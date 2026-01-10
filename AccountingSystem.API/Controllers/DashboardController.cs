// AccountingSystem.API/Controllers/DashboardController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AccountingSystem.Infrastructure.Data;

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

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var currentYear = DateTime.Now.Year;

            // Total customers
            var totalCustomers = await _context.Customers
                .Where(c => c.IsActive)
                .CountAsync();

            var activeCustomers = await _context.Customers
                .Where(c => c.IsActive && !c.IsSettled)
                .CountAsync();

            // Total credit (all time)
            var totalCredit = await _context.Transactions
                .Where(t => !t.IsDeleted)
                .SumAsync(t => t.CreditAmount);

            // Total debit (all time)
            var totalDebit = await _context.Transactions
                .Where(t => !t.IsDeleted)
                .SumAsync(t => t.DebitAmount);

            // Current year credit
            var currentYearCredit = await _context.Transactions
                .Where(t => !t.IsDeleted && t.FinancialYear == currentYear)
                .SumAsync(t => t.CreditAmount);

            // Current year debit
            var currentYearDebit = await _context.Transactions
                .Where(t => !t.IsDeleted && t.FinancialYear == currentYear)
                .SumAsync(t => t.DebitAmount);

            // Net balance
            var netBalance = totalCredit - totalDebit;

            var stats = new DashboardStatsDto
            {
                TotalCustomers = totalCustomers,
                ActiveCustomers = activeCustomers,
                TotalCredit = totalCredit,
                TotalDebit = totalDebit,
                NetBalance = netBalance,
                CurrentYearCredit = currentYearCredit,
                CurrentYearDebit = currentYearDebit
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching dashboard stats");
            return StatusCode(500, new { message = "Error fetching dashboard statistics" });
        }
    }

    [HttpGet("recent-transactions")]
    public async Task<IActionResult> GetRecentTransactions([FromQuery] int limit = 10)
    {
        try
        {
            var transactions = await _context.Transactions
                .Include(t => t.Customer)
                .Where(t => !t.IsDeleted)
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.CreatedAt)
                .Take(limit)
                .Select(t => new RecentTransactionDto
                {
                    Id = t.Id,
                    CustomerName = t.Customer.CustomerName,
                    TransactionDate = t.TransactionDate,
                    Description = t.Description,
                    CreditAmount = t.CreditAmount,
                    DebitAmount = t.DebitAmount,
                    RunningBalance = t.RunningBalance
                })
                .ToListAsync();

            return Ok(transactions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching recent transactions");
            return StatusCode(500, new { message = "Error fetching recent transactions" });
        }
    }

    [HttpGet("monthly-summary")]
    public async Task<IActionResult> GetMonthlySummary([FromQuery] int year)
    {
        try
        {
            if (year == 0) year = DateTime.Now.Year;

            var monthlySummary = await _context.Transactions
                .Where(t => !t.IsDeleted && t.FinancialYear == year)
                .GroupBy(t => t.TransactionDate.Month)
                .Select(g => new MonthlySummaryDto
                {
                    Month = g.Key,
                    TotalCredit = g.Sum(t => t.CreditAmount),
                    TotalDebit = g.Sum(t => t.DebitAmount),
                    TransactionCount = g.Count()
                })
                .OrderBy(m => m.Month)
                .ToListAsync();

            return Ok(monthlySummary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching monthly summary");
            return StatusCode(500, new { message = "Error fetching monthly summary" });
        }
    }

    [HttpGet("top-customers")]
    public async Task<IActionResult> GetTopCustomers([FromQuery] int limit = 5)
    {
        try
        {
            var topCustomers = await _context.Transactions
                .Include(t => t.Customer)
                .Where(t => !t.IsDeleted && t.Customer.IsActive)
                .GroupBy(t => new { t.CustomerId, t.Customer.CustomerName })
                .Select(g => new TopCustomerDto
                {
                    CustomerId = g.Key.CustomerId,
                    CustomerName = g.Key.CustomerName,
                    TotalTransactions = g.Count(),
                    TotalCredit = g.Sum(t => t.CreditAmount),
                    TotalDebit = g.Sum(t => t.DebitAmount),
                    NetAmount = g.Sum(t => t.CreditAmount - t.DebitAmount)
                })
                .OrderByDescending(c => c.TotalTransactions)
                .Take(limit)
                .ToListAsync();

            return Ok(topCustomers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching top customers");
            return StatusCode(500, new { message = "Error fetching top customers" });
        }
    }
}

// DTOs
public record DashboardStatsDto
{
    public int TotalCustomers { get; init; }
    public int ActiveCustomers { get; init; }
    public decimal TotalCredit { get; init; }
    public decimal TotalDebit { get; init; }
    public decimal NetBalance { get; init; }
    public decimal CurrentYearCredit { get; init; }
    public decimal CurrentYearDebit { get; init; }
}

public record RecentTransactionDto
{
    public long Id { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public DateTime TransactionDate { get; init; }
    public string? Description { get; init; }
    public decimal CreditAmount { get; init; }
    public decimal DebitAmount { get; init; }
    public decimal RunningBalance { get; init; }
}

public record MonthlySummaryDto
{
    public int Month { get; init; }
    public decimal TotalCredit { get; init; }
    public decimal TotalDebit { get; init; }
    public int TransactionCount { get; init; }
}

public record TopCustomerDto
{
    public long CustomerId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public int TotalTransactions { get; init; }
    public decimal TotalCredit { get; init; }
    public decimal TotalDebit { get; init; }
    public decimal NetAmount { get; init; }
}