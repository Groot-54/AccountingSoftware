// AccountingSystem.API/Controllers/ReportsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AccountingSystem.Infrastructure.Data;

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

    // GET: api/reports/customer-ledger/{customerId}
    [HttpGet("customer-ledger/{customerId}")]
    public async Task<IActionResult> GetCustomerLedger(
        long customerId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == customerId && c.IsActive);

            if (customer == null)
                return NotFound(new { message = "Customer not found" });

            var query = _context.Transactions
                .Where(t => t.CustomerId == customerId && !t.IsDeleted);

            if (startDate.HasValue)
                query = query.Where(t => t.TransactionDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(t => t.TransactionDate <= endDate.Value);

            var transactions = await query
                .OrderBy(t => t.TransactionDate)
                .ThenBy(t => t.Id)
                .Select(t => new
                {
                    t.Id,
                    t.TransactionDate,
                    t.Description,
                    t.DebitAmount,
                    t.CreditAmount,
                    t.RunningBalance,
                    TransactionType = t.TransactionType.ToString()
                })
                .ToListAsync();

            var totalCredit = transactions.Sum(t => t.CreditAmount);
            var totalDebit = transactions.Sum(t => t.DebitAmount);
            var netBalance = totalCredit - totalDebit;

            return Ok(new
            {
                customer = new
                {
                    customer.Id,
                    customer.CustomerName,
                    customer.Mobile,
                    customer.Address,
                    customer.OpeningBalance,
                    OpeningBalanceType = customer.OpeningBalanceType.ToString()
                },
                summary = new
                {
                    totalCredit,
                    totalDebit,
                    netBalance
                },
                transactions
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating customer ledger for {CustomerId}", customerId);
            return StatusCode(500, new { message = "Error generating customer ledger" });
        }
    }

    // GET: api/reports/date-wise
    [HttpGet("date-wise")]
    public async Task<IActionResult> GetDateWiseReport(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        try
        {
            var transactions = await _context.Transactions
                .Include(t => t.Customer)
                .Where(t => !t.IsDeleted 
                    && t.TransactionDate >= startDate 
                    && t.TransactionDate <= endDate)
                .OrderBy(t => t.TransactionDate)
                .ThenBy(t => t.CustomerId)
                .Select(t => new
                {
                    t.Id,
                    t.CustomerId,
                    t.Customer.CustomerName,
                    t.TransactionDate,
                    t.Description,
                    t.DebitAmount,
                    t.CreditAmount,
                    t.RunningBalance,
                    TransactionType = t.TransactionType.ToString()
                })
                .ToListAsync();

            var totalCredit = transactions.Sum(t => t.CreditAmount);
            var totalDebit = transactions.Sum(t => t.DebitAmount);
            var netBalance = totalCredit - totalDebit;

            // Group by customer
            var customerSummary = transactions
                .GroupBy(t => new { t.CustomerId, t.CustomerName })
                .Select(g => new
                {
                    g.Key.CustomerId,
                    g.Key.CustomerName,
                    transactionCount = g.Count(),
                    totalCredit = g.Sum(t => t.CreditAmount),
                    totalDebit = g.Sum(t => t.DebitAmount),
                    netAmount = g.Sum(t => t.CreditAmount - t.DebitAmount)
                })
                .OrderByDescending(c => c.transactionCount)
                .ToList();

            return Ok(new
            {
                period = new { startDate, endDate },
                summary = new
                {
                    totalTransactions = transactions.Count,
                    totalCredit,
                    totalDebit,
                    netBalance
                },
                customerSummary,
                transactions
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating date-wise report");
            return StatusCode(500, new { message = "Error generating date-wise report" });
        }
    }

    // GET: api/reports/year-wise/{year}
    [HttpGet("year-wise/{year}")]
    public async Task<IActionResult> GetYearWiseReport(int year)
    {
        try
        {
            var transactions = await _context.Transactions
                .Include(t => t.Customer)
                .Where(t => !t.IsDeleted && t.FinancialYear == year)
                .ToListAsync();

            var totalCredit = transactions.Sum(t => t.CreditAmount);
            var totalDebit = transactions.Sum(t => t.DebitAmount);
            var netBalance = totalCredit - totalDebit;

            // Monthly breakdown
            var monthlyData = transactions
                .GroupBy(t => t.TransactionDate.Month)
                .Select(g => new
                {
                    month = g.Key,
                    monthName = new DateTime(year, g.Key, 1).ToString("MMMM"),
                    transactionCount = g.Count(),
                    totalCredit = g.Sum(t => t.CreditAmount),
                    totalDebit = g.Sum(t => t.DebitAmount),
                    netAmount = g.Sum(t => t.CreditAmount - t.DebitAmount)
                })
                .OrderBy(m => m.month)
                .ToList();

            // Customer summary
            var customerSummary = transactions
                .GroupBy(t => new { t.CustomerId, t.Customer.CustomerName })
                .Select(g => new
                {
                    g.Key.CustomerId,
                    g.Key.CustomerName,
                    transactionCount = g.Count(),
                    totalCredit = g.Sum(t => t.CreditAmount),
                    totalDebit = g.Sum(t => t.DebitAmount),
                    netAmount = g.Sum(t => t.CreditAmount - t.DebitAmount)
                })
                .OrderByDescending(c => Math.Abs(c.netAmount))
                .ToList();

            return Ok(new
            {
                year,
                summary = new
                {
                    totalTransactions = transactions.Count,
                    totalCredit,
                    totalDebit,
                    netBalance
                },
                monthlyData,
                customerSummary
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating year-wise report for {Year}", year);
            return StatusCode(500, new { message = "Error generating year-wise report" });
        }
    }

    // GET: api/reports/balance-summary
    [HttpGet("balance-summary")]
    public async Task<IActionResult> GetBalanceSummary()
    {
        try
        {
            var customers = await _context.Customers
                .Where(c => c.IsActive && !c.IsSettled)
                .Select(c => new
                {
                    c.Id,
                    c.CustomerName,
                    c.OpeningBalance,
                    OpeningBalanceType = c.OpeningBalanceType.ToString()
                })
                .ToListAsync();

            var customerBalances = new List<object>();

            foreach (var customer in customers)
            {
                var transactions = await _context.Transactions
                    .Where(t => t.CustomerId == customer.Id && !t.IsDeleted)
                    .ToListAsync();

                var totalCredit = transactions.Sum(t => t.CreditAmount);
                var totalDebit = transactions.Sum(t => t.DebitAmount);
                
                var currentBalance = customer.OpeningBalance;
                if (customer.OpeningBalanceType == "CR")
                    currentBalance += (totalCredit - totalDebit);
                else
                    currentBalance += (totalDebit - totalCredit);

                customerBalances.Add(new
                {
                    customer.Id,
                    customer.CustomerName,
                    openingBalance = customer.OpeningBalance,
                    openingBalanceType = customer.OpeningBalanceType,
                    totalCredit,
                    totalDebit,
                    currentBalance,
                    balanceType = currentBalance >= 0 ? "CR" : "DR"
                });
            }

            var totalCurrentCredit = customerBalances
                .Where(c => ((dynamic)c).currentBalance >= 0)
                .Sum(c => ((dynamic)c).currentBalance);

            var totalCurrentDebit = Math.Abs(customerBalances
                .Where(c => ((dynamic)c).currentBalance < 0)
                .Sum(c => ((dynamic)c).currentBalance));

            return Ok(new
            {
                summary = new
                {
                    totalCustomers = customerBalances.Count,
                    totalCurrentCredit,
                    totalCurrentDebit,
                    netPosition = totalCurrentCredit - totalCurrentDebit
                },
                customerBalances
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating balance summary");
            return StatusCode(500, new { message = "Error generating balance summary" });
        }
    }

    // GET: api/reports/outstanding-balances
    [HttpGet("outstanding-balances")]
    public async Task<IActionResult> GetOutstandingBalances([FromQuery] string? type = null)
    {
        try
        {
            var customers = await _context.Customers
                .Where(c => c.IsActive && !c.IsSettled)
                .ToListAsync();

            var outstandingBalances = new List<object>();

            foreach (var customer in customers)
            {
                var lastTransaction = await _context.Transactions
                    .Where(t => t.CustomerId == customer.Id && !t.IsDeleted)
                    .OrderByDescending(t => t.TransactionDate)
                    .ThenByDescending(t => t.Id)
                    .FirstOrDefaultAsync();

                var currentBalance = lastTransaction?.RunningBalance ?? customer.OpeningBalance;

                // Filter by type if specified
                if (type == "receivable" && currentBalance <= 0) continue;
                if (type == "payable" && currentBalance >= 0) continue;

                outstandingBalances.Add(new
                {
                    customerId = customer.Id,
                    customerName = customer.CustomerName,
                    mobile = customer.Mobile,
                    currentBalance = Math.Abs(currentBalance),
                    balanceType = currentBalance >= 0 ? "Receivable" : "Payable",
                    lastTransactionDate = lastTransaction?.TransactionDate
                });
            }

            var totalReceivable = outstandingBalances
                .Where(b => ((dynamic)b).balanceType == "Receivable")
                .Sum(b => ((dynamic)b).currentBalance);

            var totalPayable = outstandingBalances
                .Where(b => ((dynamic)b).balanceType == "Payable")
                .Sum(b => ((dynamic)b).currentBalance);

            return Ok(new
            {
                summary = new
                {
                    totalReceivable,
                    totalPayable,
                    netPosition = totalReceivable - totalPayable
                },
                outstandingBalances = outstandingBalances
                    .OrderByDescending(b => ((dynamic)b).currentBalance)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating outstanding balances report");
            return StatusCode(500, new { message = "Error generating outstanding balances report" });
        }
    }

    // GET: api/reports/transaction-summary
    [HttpGet("transaction-summary")]
    public async Task<IActionResult> GetTransactionSummary(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var query = _context.Transactions.Where(t => !t.IsDeleted);

            if (startDate.HasValue)
                query = query.Where(t => t.TransactionDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(t => t.TransactionDate <= endDate.Value);

            var transactions = await query.ToListAsync();

            var summary = new
            {
                totalTransactions = transactions.Count,
                totalCreditTransactions = transactions.Count(t => t.CreditAmount > 0),
                totalDebitTransactions = transactions.Count(t => t.DebitAmount > 0),
                totalCreditAmount = transactions.Sum(t => t.CreditAmount),
                totalDebitAmount = transactions.Sum(t => t.DebitAmount),
                netAmount = transactions.Sum(t => t.CreditAmount - t.DebitAmount),
                averageTransactionSize = transactions.Count > 0 
                    ? transactions.Sum(t => t.CreditAmount + t.DebitAmount) / transactions.Count 
                    : 0
            };

            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating transaction summary");
            return StatusCode(500, new { message = "Error generating transaction summary" });
        }
    }
}