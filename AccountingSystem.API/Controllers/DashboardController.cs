// AccountingSystem.API/Controllers/DashboardController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AccountingSystem.Infrastructure.Data;
using AccountingSystem.Core.Enums;

namespace AccountingSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(
        AccountingDbContext context,
        ILogger<DashboardController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get dashboard overview with KPIs
    /// </summary>
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview([FromQuery] int? year = null)
    {
        try
        {
            var currentYear = year ?? DateTime.UtcNow.Year;

            // Total Customers
            var totalCustomers = await _context.Customers
                .CountAsync(c => c.IsActive);

            var activeCustomers = await _context.Customers
                .CountAsync(c => c.IsActive && !c.IsSettled);

            var settledCustomers = await _context.Customers
                .CountAsync(c => c.IsActive && c.IsSettled);

            // Transactions for current year
            var yearTransactions = await _context.Transactions
                .Where(t => !t.IsDeleted && t.FinancialYear == currentYear)
                .ToListAsync();

            var totalCredit = yearTransactions.Sum(t => t.CreditAmount);
            var totalDebit = yearTransactions.Sum(t => t.DebitAmount);
            var netBalance = totalCredit - totalDebit;

            // All-time totals
            var allTimeTransactions = await _context.Transactions
                .Where(t => !t.IsDeleted)
                .ToListAsync();

            var allTimeCredit = allTimeTransactions.Sum(t => t.CreditAmount);
            var allTimeDebit = allTimeTransactions.Sum(t => t.DebitAmount);
            var allTimeBalance = allTimeCredit - allTimeDebit;

            // Recent transactions (last 10)
            var recentTransactions = await _context.Transactions
                .Include(t => t.Customer)
                .Where(t => !t.IsDeleted)
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.CreatedAt)
                .Take(10)
                .Select(t => new RecentTransactionDto
                {
                    Id = t.Id,
                    CustomerName = t.Customer.CustomerName,
                    TransactionDate = t.TransactionDate,
                    Description = t.Description,
                    Amount = t.TransactionType == TransactionType.Credit ? t.CreditAmount : t.DebitAmount,
                    Type = t.TransactionType.ToString(),
                    RunningBalance = t.RunningBalance
                })
                .ToListAsync();

            // Monthly summary for current year
            var monthlySummary = yearTransactions
                .GroupBy(t => t.TransactionDate.Month)
                .Select(g => new MonthlySummaryDto
                {
                    Month = g.Key,
                    MonthName = new DateTime(currentYear, g.Key, 1).ToString("MMMM"),
                    Credit = g.Sum(t => t.CreditAmount),
                    Debit = g.Sum(t => t.DebitAmount),
                    NetAmount = g.Sum(t => t.CreditAmount) - g.Sum(t => t.DebitAmount),
                    TransactionCount = g.Count()
                })
                .OrderBy(m => m.Month)
                .ToList();

            return Ok(new DashboardOverviewDto
            {
                // Customer Stats
                TotalCustomers = totalCustomers,
                ActiveCustomers = activeCustomers,
                SettledCustomers = settledCustomers,

                // Current Year Stats
                Year = currentYear,
                TotalCredit = totalCredit,
                TotalDebit = totalDebit,
                NetBalance = netBalance,
                BalanceType = netBalance >= 0 ? "CR" : "DR",

                // All Time Stats
                AllTimeCredit = allTimeCredit,
                AllTimeDebit = allTimeDebit,
                AllTimeBalance = allTimeBalance,

                // Transactions
                TotalTransactions = yearTransactions.Count,
                AllTimeTransactions = allTimeTransactions.Count,
                RecentTransactions = recentTransactions,

                // Monthly Summary
                MonthlySummary = monthlySummary
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching dashboard overview");
            return StatusCode(500, new { message = "Error fetching dashboard data" });
        }
    }

    /// <summary>
    /// Get year-wise summary
    /// </summary>
    [HttpGet("yearly-summary")]
    public async Task<IActionResult> GetYearlySummary([FromQuery] int? startYear = null, [FromQuery] int? endYear = null)
    {
        try
        {
            var start = startYear ?? DateTime.UtcNow.Year - 5;
            var end = endYear ?? DateTime.UtcNow.Year;

            var transactions = await _context.Transactions
                .Where(t => !t.IsDeleted && t.FinancialYear >= start && t.FinancialYear <= end)
                .ToListAsync();

            var yearlySummary = transactions
                .GroupBy(t => t.FinancialYear)
                .Select(g => new YearlySummaryDto
                {
                    Year = g.Key,
                    Credit = g.Sum(t => t.CreditAmount),
                    Debit = g.Sum(t => t.DebitAmount),
                    NetAmount = g.Sum(t => t.CreditAmount) - g.Sum(t => t.DebitAmount),
                    TransactionCount = g.Count(),
                    CreditCount = g.Count(t => t.TransactionType == TransactionType.Credit),
                    DebitCount = g.Count(t => t.TransactionType == TransactionType.Debit)
                })
                .OrderByDescending(y => y.Year)
                .ToList();

            return Ok(yearlySummary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching yearly summary");
            return StatusCode(500, new { message = "Error fetching yearly summary" });
        }
    }

    /// <summary>
    /// Get top customers by balance
    /// </summary>
    [HttpGet("top-customers")]
    public async Task<IActionResult> GetTopCustomers([FromQuery] int limit = 10, [FromQuery] string orderBy = "balance")
    {
        try
        {
            var customers = await _context.Customers
                .Where(c => c.IsActive)
                .Include(c => c.Transactions)
                .ToListAsync();

            var customerBalances = customers.Select(c =>
            {
                var lastTransaction = c.Transactions
                    .Where(t => !t.IsDeleted)
                    .OrderByDescending(t => t.TransactionDate)
                    .ThenByDescending(t => t.Id)
                    .FirstOrDefault();

                var balance = lastTransaction?.RunningBalance ?? c.OpeningBalance;

                return new TopCustomerDto
                {
                    Id = c.Id,
                    CustomerName = c.CustomerName,
                    Balance = Math.Abs(balance),
                    BalanceType = balance >= 0 ? "CR" : "DR",
                    TransactionCount = c.Transactions.Count(t => !t.IsDeleted),
                    LastTransactionDate = lastTransaction?.TransactionDate
                };
            }).ToList();

            // Order by balance (highest first)
            var topCustomers = orderBy.ToLower() switch
            {
                "transactions" => customerBalances.OrderByDescending(c => c.TransactionCount).Take(limit).ToList(),
                "recent" => customerBalances.OrderByDescending(c => c.LastTransactionDate).Take(limit).ToList(),
                _ => customerBalances.OrderByDescending(c => c.Balance).Take(limit).ToList()
            };

            return Ok(topCustomers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching top customers");
            return StatusCode(500, new { message = "Error fetching top customers" });
        }
    }

    /// <summary>
    /// Get dashboard statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var currentYear = DateTime.UtcNow.Year;
            var currentMonth = DateTime.UtcNow.Month;

            // This month's transactions
            var thisMonthTransactions = await _context.Transactions
                .Where(t => !t.IsDeleted 
                    && t.TransactionDate.Year == currentYear 
                    && t.TransactionDate.Month == currentMonth)
                .ToListAsync();

            // Last month's transactions
            var lastMonth = DateTime.UtcNow.AddMonths(-1);
            var lastMonthTransactions = await _context.Transactions
                .Where(t => !t.IsDeleted 
                    && t.TransactionDate.Year == lastMonth.Year 
                    && t.TransactionDate.Month == lastMonth.Month)
                .ToListAsync();

            // Calculate growth
            var thisMonthCredit = thisMonthTransactions.Sum(t => t.CreditAmount);
            var lastMonthCredit = lastMonthTransactions.Sum(t => t.CreditAmount);
            var creditGrowth = lastMonthCredit > 0 
                ? ((thisMonthCredit - lastMonthCredit) / lastMonthCredit) * 100 
                : 0;

            var thisMonthDebit = thisMonthTransactions.Sum(t => t.DebitAmount);
            var lastMonthDebit = lastMonthTransactions.Sum(t => t.DebitAmount);
            var debitGrowth = lastMonthDebit > 0 
                ? ((thisMonthDebit - lastMonthDebit) / lastMonthDebit) * 100 
                : 0;

            // New customers this month
            var newCustomersThisMonth = await _context.Customers
                .CountAsync(c => c.IsActive 
                    && c.CreatedAt.Year == currentYear 
                    && c.CreatedAt.Month == currentMonth);

            var newCustomersLastMonth = await _context.Customers
                .CountAsync(c => c.IsActive 
                    && c.CreatedAt.Year == lastMonth.Year 
                    && c.CreatedAt.Month == lastMonth.Month);

            var customerGrowth = newCustomersLastMonth > 0
                ? ((decimal)(newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100
                : 0;

            return Ok(new DashboardStatsDto
            {
                ThisMonth = new MonthStatsDto
                {
                    Credit = thisMonthCredit,
                    Debit = thisMonthDebit,
                    TransactionCount = thisMonthTransactions.Count,
                    NewCustomers = newCustomersThisMonth
                },
                LastMonth = new MonthStatsDto
                {
                    Credit = lastMonthCredit,
                    Debit = lastMonthDebit,
                    TransactionCount = lastMonthTransactions.Count,
                    NewCustomers = newCustomersLastMonth
                },
                Growth = new GrowthStatsDto
                {
                    CreditGrowth = Math.Round(creditGrowth, 2),
                    DebitGrowth = Math.Round(debitGrowth, 2),
                    CustomerGrowth = Math.Round(customerGrowth, 2)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching dashboard stats");
            return StatusCode(500, new { message = "Error fetching stats" });
        }
    }
}

// DTOs
public record DashboardOverviewDto
{
    // Customer Stats
    public int TotalCustomers { get; init; }
    public int ActiveCustomers { get; init; }
    public int SettledCustomers { get; init; }

    // Current Year Stats
    public int Year { get; init; }
    public decimal TotalCredit { get; init; }
    public decimal TotalDebit { get; init; }
    public decimal NetBalance { get; init; }
    public string BalanceType { get; init; } = string.Empty;

    // All Time Stats
    public decimal AllTimeCredit { get; init; }
    public decimal AllTimeDebit { get; init; }
    public decimal AllTimeBalance { get; init; }

    // Transaction Stats
    public int TotalTransactions { get; init; }
    public int AllTimeTransactions { get; init; }
    public List<RecentTransactionDto> RecentTransactions { get; init; } = new();

    // Monthly Summary
    public List<MonthlySummaryDto> MonthlySummary { get; init; } = new();
}

public record RecentTransactionDto
{
    public long Id { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public DateTime TransactionDate { get; init; }
    public string? Description { get; init; }
    public decimal Amount { get; init; }
    public string Type { get; init; } = string.Empty;
    public decimal RunningBalance { get; init; }
}

public record MonthlySummaryDto
{
    public int Month { get; init; }
    public string MonthName { get; init; } = string.Empty;
    public decimal Credit { get; init; }
    public decimal Debit { get; init; }
    public decimal NetAmount { get; init; }
    public int TransactionCount { get; init; }
}

public record YearlySummaryDto
{
    public int Year { get; init; }
    public decimal Credit { get; init; }
    public decimal Debit { get; init; }
    public decimal NetAmount { get; init; }
    public int TransactionCount { get; init; }
    public int CreditCount { get; init; }
    public int DebitCount { get; init; }
}

public record TopCustomerDto
{
    public long Id { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public decimal Balance { get; init; }
    public string BalanceType { get; init; } = string.Empty;
    public int TransactionCount { get; init; }
    public DateTime? LastTransactionDate { get; init; }
}

public record DashboardStatsDto
{
    public MonthStatsDto ThisMonth { get; init; } = new();
    public MonthStatsDto LastMonth { get; init; } = new();
    public GrowthStatsDto Growth { get; init; } = new();
}

public record MonthStatsDto
{
    public decimal Credit { get; init; }
    public decimal Debit { get; init; }
    public int TransactionCount { get; init; }
    public int NewCustomers { get; init; }
}

public record GrowthStatsDto
{
    public decimal CreditGrowth { get; init; }
    public decimal DebitGrowth { get; init; }
    public decimal CustomerGrowth { get; init; }
}