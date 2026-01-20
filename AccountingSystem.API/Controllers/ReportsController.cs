// AccountingSystem.API/Controllers/ReportsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AccountingSystem.Infrastructure.Data;
using AccountingSystem.Core.Enums;

namespace AccountingSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(
        AccountingDbContext context,
        ILogger<ReportsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get year-wise report with opening and closing balances
    /// </summary>
    [HttpGet("year-wise")]
    public async Task<IActionResult> GetYearWiseReport([FromQuery] int year)
    {
        try
        {
            // Get all customers
            var customers = await _context.Customers
                .Where(c => c.IsActive)
                .Include(c => c.Transactions)
                .ToListAsync();

            var customerReports = new List<YearWiseCustomerReportDto>();

            foreach (var customer in customers)
            {
                // Opening balance (last transaction of previous year OR opening balance)
                var previousYearLastTx = customer.Transactions
                    .Where(t => !t.IsDeleted && t.FinancialYear < year)
                    .OrderByDescending(t => t.TransactionDate)
                    .ThenByDescending(t => t.Id)
                    .FirstOrDefault();

                var openingBalance = previousYearLastTx?.RunningBalance ?? customer.OpeningBalance;

                // Transactions for current year
                var yearTransactions = customer.Transactions
                    .Where(t => !t.IsDeleted && t.FinancialYear == year)
                    .OrderBy(t => t.TransactionDate)
                    .ThenBy(t => t.Id)
                    .ToList();

                var totalCredit = yearTransactions.Sum(t => t.CreditAmount);
                var totalDebit = yearTransactions.Sum(t => t.DebitAmount);

                // Closing balance (last transaction of year OR opening balance if no transactions)
                var closingBalance = yearTransactions.Any()
                    ? yearTransactions.Last().RunningBalance
                    : openingBalance;

                customerReports.Add(new YearWiseCustomerReportDto
                {
                    CustomerId = customer.Id,
                    CustomerName = customer.CustomerName,
                    Mobile = customer.Mobile,
                    OpeningBalance = Math.Abs(openingBalance),
                    OpeningBalanceType = openingBalance >= 0 ? "CR" : "DR",
                    TotalCredit = totalCredit,
                    TotalDebit = totalDebit,
                    ClosingBalance = Math.Abs(closingBalance),
                    ClosingBalanceType = closingBalance >= 0 ? "CR" : "DR",
                    TransactionCount = yearTransactions.Count,
                    IsSettled = customer.IsSettled
                });
            }

            var report = new YearWiseReportDto
            {
                Year = year,
                GeneratedAt = DateTime.UtcNow,
                TotalCustomers = customers.Count,
                ActiveCustomers = customers.Count(c => !c.IsSettled),
                SettledCustomers = customers.Count(c => c.IsSettled),
                TotalOpeningBalance = customerReports.Sum(c => 
                    c.OpeningBalanceType == "CR" ? c.OpeningBalance : -c.OpeningBalance),
                TotalCredit = customerReports.Sum(c => c.TotalCredit),
                TotalDebit = customerReports.Sum(c => c.TotalDebit),
                TotalClosingBalance = customerReports.Sum(c => 
                    c.ClosingBalanceType == "CR" ? c.ClosingBalance : -c.ClosingBalance),
                Customers = customerReports.OrderBy(c => c.CustomerName).ToList()
            };

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating year-wise report for year {Year}", year);
            return StatusCode(500, new { message = "Error generating year-wise report" });
        }
    }

    /// <summary>
    /// Get customer ledger for specific customer
    /// </summary>
    [HttpGet("customer-ledger/{customerId}")]
    public async Task<IActionResult> GetCustomerLedger(
        long customerId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int? year = null)
    {
        try
        {
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == customerId && c.IsActive);

            if (customer == null)
                return NotFound(new { message = "Customer not found" });

            // Build query
            var query = _context.Transactions
                .Where(t => t.CustomerId == customerId && !t.IsDeleted);

            // Apply filters
            if (year.HasValue)
            {
                query = query.Where(t => t.FinancialYear == year.Value);
            }
            else
            {
                if (startDate.HasValue)
                    query = query.Where(t => t.TransactionDate >= startDate.Value);

                if (endDate.HasValue)
                    query = query.Where(t => t.TransactionDate <= endDate.Value);
            }

            var transactions = await query
                .OrderBy(t => t.TransactionDate)
                .ThenBy(t => t.Id)
                .ToListAsync();

            // Calculate opening balance
            DateTime filterStartDate;
            if (year.HasValue)
            {
                filterStartDate = new DateTime(year.Value, 1, 1);
            }
            else if (startDate.HasValue)
            {
                filterStartDate = startDate.Value;
            }
            else
            {
                filterStartDate = DateTime.MinValue;
            }

            var previousTransaction = await _context.Transactions
                .Where(t => t.CustomerId == customerId 
                    && !t.IsDeleted 
                    && t.TransactionDate < filterStartDate)
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.Id)
                .FirstOrDefaultAsync();

            var openingBalance = previousTransaction?.RunningBalance ?? customer.OpeningBalance;

            // Map transactions
            var ledgerEntries = transactions.Select(t => new LedgerEntryDto
            {
                Id = t.Id,
                Date = t.TransactionDate,
                Description = t.Description,
                CreditAmount = t.CreditAmount,
                DebitAmount = t.DebitAmount,
                Balance = Math.Abs(t.RunningBalance),
                BalanceType = t.RunningBalance >= 0 ? "CR" : "DR",
                Remark = t.Remark
            }).ToList();

            var totalCredit = transactions.Sum(t => t.CreditAmount);
            var totalDebit = transactions.Sum(t => t.DebitAmount);
            var closingBalance = transactions.Any() 
                ? transactions.Last().RunningBalance 
                : openingBalance;

            var ledger = new CustomerLedgerDto
            {
                CustomerId = customer.Id,
                CustomerName = customer.CustomerName,
                Mobile = customer.Mobile,
                Address = customer.Address,
                OpeningBalance = Math.Abs(openingBalance),
                OpeningBalanceType = openingBalance >= 0 ? "CR" : "DR",
                TotalCredit = totalCredit,
                TotalDebit = totalDebit,
                ClosingBalance = Math.Abs(closingBalance),
                ClosingBalanceType = closingBalance >= 0 ? "CR" : "DR",
                StartDate = startDate,
                EndDate = endDate,
                Year = year,
                GeneratedAt = DateTime.UtcNow,
                Entries = ledgerEntries
            };

            return Ok(ledger);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating customer ledger for customer {CustomerId}", customerId);
            return StatusCode(500, new { message = "Error generating customer ledger" });
        }
    }

    /// <summary>
    /// Get date-wise report (all transactions in date range)
    /// </summary>
    [HttpGet("date-wise")]
    public async Task<IActionResult> GetDateWiseReport(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        try
        {
            if (startDate > endDate)
            {
                return BadRequest(new { message = "Start date cannot be after end date" });
            }

            var transactions = await _context.Transactions
                .Include(t => t.Customer)
                .Where(t => !t.IsDeleted 
                    && t.TransactionDate >= startDate 
                    && t.TransactionDate <= endDate)
                .OrderBy(t => t.TransactionDate)
                .ThenBy(t => t.CustomerId)
                .ThenBy(t => t.Id)
                .ToListAsync();

            var reportEntries = transactions.Select(t => new DateWiseReportEntryDto
            {
                Id = t.Id,
                Date = t.TransactionDate,
                CustomerId = t.CustomerId,
                CustomerName = t.Customer.CustomerName,
                Description = t.Description,
                CreditAmount = t.CreditAmount,
                DebitAmount = t.DebitAmount,
                Balance = Math.Abs(t.RunningBalance),
                BalanceType = t.RunningBalance >= 0 ? "CR" : "DR",
                TransactionType = t.TransactionType.ToString()
            }).ToList();

            var totalCredit = transactions.Sum(t => t.CreditAmount);
            var totalDebit = transactions.Sum(t => t.DebitAmount);

            var report = new DateWiseReportDto
            {
                StartDate = startDate,
                EndDate = endDate,
                GeneratedAt = DateTime.UtcNow,
                TotalTransactions = transactions.Count,
                TotalCredit = totalCredit,
                TotalDebit = totalDebit,
                NetAmount = totalCredit - totalDebit,
                Entries = reportEntries
            };

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating date-wise report");
            return StatusCode(500, new { message = "Error generating date-wise report" });
        }
    }

    /// <summary>
    /// Get summary report by customer for a date range
    /// </summary>
    [HttpGet("customer-summary")]
    public async Task<IActionResult> GetCustomerSummary(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int? year = null)
    {
        try
        {
            var customers = await _context.Customers
                .Where(c => c.IsActive)
                .Include(c => c.Transactions)
                .ToListAsync();

            var summaries = new List<CustomerSummaryDto>();

            foreach (var customer in customers)
            {
                var query = customer.Transactions.Where(t => !t.IsDeleted).AsEnumerable();

                // Apply filters
                if (year.HasValue)
                {
                    query = query.Where(t => t.FinancialYear == year.Value);
                }
                else
                {
                    if (startDate.HasValue)
                        query = query.Where(t => t.TransactionDate >= startDate.Value);

                    if (endDate.HasValue)
                        query = query.Where(t => t.TransactionDate <= endDate.Value);
                }

                var filteredTransactions = query.ToList();

                if (filteredTransactions.Any())
                {
                    var lastTransaction = filteredTransactions
                        .OrderByDescending(t => t.TransactionDate)
                        .ThenByDescending(t => t.Id)
                        .First();

                    summaries.Add(new CustomerSummaryDto
                    {
                        CustomerId = customer.Id,
                        CustomerName = customer.CustomerName,
                        Mobile = customer.Mobile,
                        TotalCredit = filteredTransactions.Sum(t => t.CreditAmount),
                        TotalDebit = filteredTransactions.Sum(t => t.DebitAmount),
                        CurrentBalance = Math.Abs(lastTransaction.RunningBalance),
                        BalanceType = lastTransaction.RunningBalance >= 0 ? "CR" : "DR",
                        TransactionCount = filteredTransactions.Count,
                        LastTransactionDate = lastTransaction.TransactionDate
                    });
                }
            }

            var report = new CustomerSummaryReportDto
            {
                StartDate = startDate,
                EndDate = endDate,
                Year = year,
                GeneratedAt = DateTime.UtcNow,
                TotalCustomers = summaries.Count,
                TotalCredit = summaries.Sum(s => s.TotalCredit),
                TotalDebit = summaries.Sum(s => s.TotalDebit),
                Summaries = summaries.OrderBy(s => s.CustomerName).ToList()
            };

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating customer summary report");
            return StatusCode(500, new { message = "Error generating customer summary" });
        }
    }

    /// <summary>
    /// Get available years for reports
    /// </summary>
    [HttpGet("available-years")]
    public async Task<IActionResult> GetAvailableYears()
    {
        try
        {
            var years = await _context.Transactions
                .Where(t => !t.IsDeleted)
                .Select(t => t.FinancialYear)
                .Distinct()
                .OrderByDescending(y => y)
                .ToListAsync();

            // Add current year if not in list
            var currentYear = DateTime.UtcNow.Year;
            if (!years.Contains(currentYear))
            {
                years.Insert(0, currentYear);
            }

            // Add range for future selection (next 5 years)
            var maxYear = years.Any() ? years.Max() : currentYear;
            for (int i = 1; i <= 5; i++)
            {
                var futureYear = maxYear + i;
                if (!years.Contains(futureYear))
                {
                    years.Insert(0, futureYear);
                }
            }

            // Add range for past selection (up to 10 years back)
            var minYear = years.Any() ? years.Min() : currentYear;
            for (int i = 1; i <= 10; i++)
            {
                var pastYear = minYear - i;
                if (pastYear >= 2010 && !years.Contains(pastYear))
                {
                    years.Add(pastYear);
                }
            }

            years.Sort();
            years.Reverse();

            return Ok(new { years });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching available years");
            return StatusCode(500, new { message = "Error fetching available years" });
        }
    }
}

// DTOs
public record YearWiseReportDto
{
    public int Year { get; init; }
    public DateTime GeneratedAt { get; init; }
    public int TotalCustomers { get; init; }
    public int ActiveCustomers { get; init; }
    public int SettledCustomers { get; init; }
    public decimal TotalOpeningBalance { get; init; }
    public decimal TotalCredit { get; init; }
    public decimal TotalDebit { get; init; }
    public decimal TotalClosingBalance { get; init; }
    public List<YearWiseCustomerReportDto> Customers { get; init; } = new();
}

public record YearWiseCustomerReportDto
{
    public long CustomerId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string? Mobile { get; init; }
    public decimal OpeningBalance { get; init; }
    public string OpeningBalanceType { get; init; } = string.Empty;
    public decimal TotalCredit { get; init; }
    public decimal TotalDebit { get; init; }
    public decimal ClosingBalance { get; init; }
    public string ClosingBalanceType { get; init; } = string.Empty;
    public int TransactionCount { get; init; }
    public bool IsSettled { get; init; }
}

public record CustomerLedgerDto
{
    public long CustomerId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string? Mobile { get; init; }
    public string? Address { get; init; }
    public decimal OpeningBalance { get; init; }
    public string OpeningBalanceType { get; init; } = string.Empty;
    public decimal TotalCredit { get; init; }
    public decimal TotalDebit { get; init; }
    public decimal ClosingBalance { get; init; }
    public string ClosingBalanceType { get; init; } = string.Empty;
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public int? Year { get; init; }
    public DateTime GeneratedAt { get; init; }
    public List<LedgerEntryDto> Entries { get; init; } = new();
}

public record LedgerEntryDto
{
    public long Id { get; init; }
    public DateTime Date { get; init; }
    public string? Description { get; init; }
    public decimal CreditAmount { get; init; }
    public decimal DebitAmount { get; init; }
    public decimal Balance { get; init; }
    public string BalanceType { get; init; } = string.Empty;
    public string? Remark { get; init; }
}

public record DateWiseReportDto
{
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public DateTime GeneratedAt { get; init; }
    public int TotalTransactions { get; init; }
    public decimal TotalCredit { get; init; }
    public decimal TotalDebit { get; init; }
    public decimal NetAmount { get; init; }
    public List<DateWiseReportEntryDto> Entries { get; init; } = new();
}

public record DateWiseReportEntryDto
{
    public long Id { get; init; }
    public DateTime Date { get; init; }
    public long CustomerId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string? Description { get; init; }
    public decimal CreditAmount { get; init; }
    public decimal DebitAmount { get; init; }
    public decimal Balance { get; init; }
    public string BalanceType { get; init; } = string.Empty;
    public string TransactionType { get; init; } = string.Empty;
}

public record CustomerSummaryReportDto
{
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public int? Year { get; init; }
    public DateTime GeneratedAt { get; init; }
    public int TotalCustomers { get; init; }
    public decimal TotalCredit { get; init; }
    public decimal TotalDebit { get; init; }
    public List<CustomerSummaryDto> Summaries { get; init; } = new();
}

public record CustomerSummaryDto
{
    public long CustomerId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string? Mobile { get; init; }
    public decimal TotalCredit { get; init; }
    public decimal TotalDebit { get; init; }
    public decimal CurrentBalance { get; init; }
    public string BalanceType { get; init; } = string.Empty;
    public int TransactionCount { get; init; }
    public DateTime LastTransactionDate { get; init; }
}