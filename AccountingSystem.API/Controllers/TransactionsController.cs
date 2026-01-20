// AccountingSystem.API/Controllers/TransactionsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AccountingSystem.Infrastructure.Data;
using AccountingSystem.Core.Entities;
using AccountingSystem.Core.Enums;
using AccountingSystem.Application.Interfaces;

namespace AccountingSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly AccountingDbContext _context;
    private readonly ILogger<TransactionsController> _logger;
    private readonly ICurrentUserService _currentUser;

    public TransactionsController(
        AccountingDbContext context,
        ILogger<TransactionsController> logger,
        ICurrentUserService currentUser)
    {
        _context = context;
        _logger = logger;
        _currentUser = currentUser;
    }

    // GET: api/transactions
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] long? customerId = null,
        [FromQuery] int? year = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? type = null)
    {
        try
        {
            var query = _context.Transactions
                .Include(t => t.Customer)
                .Where(t => !t.IsDeleted);

            // Apply filters
            if (customerId.HasValue)
                query = query.Where(t => t.CustomerId == customerId.Value);

            if (year.HasValue)
                query = query.Where(t => t.FinancialYear == year.Value);

            if (startDate.HasValue)
                query = query.Where(t => t.TransactionDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(t => t.TransactionDate <= endDate.Value);

            if (!string.IsNullOrEmpty(type))
            {
                if (Enum.TryParse<TransactionType>(type, true, out var transactionType))
                    query = query.Where(t => t.TransactionType == transactionType);
            }

            var transactions = await query
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.CreatedAt)
                .Select(t => new TransactionDto
                {
                    Id = t.Id,
                    CustomerId = t.CustomerId,
                    CustomerName = t.Customer.CustomerName,
                    TransactionDate = t.TransactionDate,
                    Description = t.Description,
                    DebitAmount = t.DebitAmount,
                    CreditAmount = t.CreditAmount,
                    RunningBalance = t.RunningBalance,
                    TransactionType = t.TransactionType.ToString(),
                    FinancialYear = t.FinancialYear,
                    Remark = t.Remark,
                    IsDeleted = t.IsDeleted,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync();

            return Ok(transactions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching transactions");
            return StatusCode(500, new { message = "Error fetching transactions" });
        }
    }

    // GET: api/transactions/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        try
        {
            var transaction = await _context.Transactions
                .Include(t => t.Customer)
                .Where(t => t.Id == id && !t.IsDeleted)
                .Select(t => new TransactionDto
                {
                    Id = t.Id,
                    CustomerId = t.CustomerId,
                    CustomerName = t.Customer.CustomerName,
                    TransactionDate = t.TransactionDate,
                    Description = t.Description,
                    DebitAmount = t.DebitAmount,
                    CreditAmount = t.CreditAmount,
                    RunningBalance = t.RunningBalance,
                    TransactionType = t.TransactionType.ToString(),
                    FinancialYear = t.FinancialYear,
                    Remark = t.Remark,
                    IsDeleted = t.IsDeleted,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (transaction == null)
                return NotFound(new { message = "Transaction not found" });

            return Ok(transaction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching transaction {Id}", id);
            return StatusCode(500, new { message = "Error fetching transaction" });
        }
    }

    // POST: api/transactions/credit
    [HttpPost("credit")]
    public async Task<IActionResult> CreateCredit([FromBody] CreateTransactionDto dto)
    {
        try
        {
            // Get current user ID
            var userId = _currentUser.UserId;
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Validate customer exists and is active
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == dto.CustomerId && c.IsActive);

            if (customer == null)
                return BadRequest(new { message = "Customer not found or inactive" });

            // Check if customer is settled
            if (customer.IsSettled)
            {
                return BadRequest(new { message = "Cannot create transactions for settled customers. Please unsettle the customer first." });
            }

            // Get last transaction for running balance
            var lastTransaction = await _context.Transactions
                .Where(t => t.CustomerId == dto.CustomerId && !t.IsDeleted)
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.Id)
                .FirstOrDefaultAsync();

            var previousBalance = lastTransaction?.RunningBalance ?? customer.OpeningBalance;

            // Calculate new running balance (Credit increases balance)
            var newBalance = previousBalance + dto.Amount;

            var transaction = new Transaction
            {
                CustomerId = dto.CustomerId,
                TransactionDate = dto.TransactionDate,
                Description = dto.Description,
                CreditAmount = dto.Amount,
                DebitAmount = 0,
                RunningBalance = newBalance,
                TransactionType = TransactionType.Credit,
                FinancialYear = dto.TransactionDate.Year,
                Remark = dto.Remark,
                CreatedBy = userId.Value,
                CreatedAt = DateTime.UtcNow,
                UpdatedBy = userId.Value,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            // Update subsequent transactions' running balances
            await RecalculateRunningBalances(dto.CustomerId, transaction.TransactionDate);

            _logger.LogInformation("Credit transaction created: {Id} for customer {CustomerId} by user {UserId}", 
                transaction.Id, dto.CustomerId, userId.Value);

            return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, 
                new { id = transaction.Id, message = "Credit transaction created successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating credit transaction");
            return StatusCode(500, new { message = "Error creating credit transaction" });
        }
    }

    // POST: api/transactions/debit
    [HttpPost("debit")]
    public async Task<IActionResult> CreateDebit([FromBody] CreateTransactionDto dto)
    {
        try
        {
            // Get current user ID
            var userId = _currentUser.UserId;
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Validate customer exists and is active
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == dto.CustomerId && c.IsActive);

            if (customer == null)
                return BadRequest(new { message = "Customer not found or inactive" });

            // Check if customer is settled
            if (customer.IsSettled)
            {
                return BadRequest(new { message = "Cannot create transactions for settled customers. Please unsettle the customer first." });
            }

            // Get last transaction for running balance
            var lastTransaction = await _context.Transactions
                .Where(t => t.CustomerId == dto.CustomerId && !t.IsDeleted)
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.Id)
                .FirstOrDefaultAsync();

            var previousBalance = lastTransaction?.RunningBalance ?? customer.OpeningBalance;

            // Calculate new running balance (Debit decreases balance)
            var newBalance = previousBalance - dto.Amount;

            var transaction = new Transaction
            {
                CustomerId = dto.CustomerId,
                TransactionDate = dto.TransactionDate,
                Description = dto.Description,
                DebitAmount = dto.Amount,
                CreditAmount = 0,
                RunningBalance = newBalance,
                TransactionType = TransactionType.Debit,
                FinancialYear = dto.TransactionDate.Year,
                Remark = dto.Remark,
                CreatedBy = userId.Value,
                CreatedAt = DateTime.UtcNow,
                UpdatedBy = userId.Value,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            // Update subsequent transactions' running balances
            await RecalculateRunningBalances(dto.CustomerId, transaction.TransactionDate);

            _logger.LogInformation("Debit transaction created: {Id} for customer {CustomerId} by user {UserId}", 
                transaction.Id, dto.CustomerId, userId.Value);

            return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, 
                new { id = transaction.Id, message = "Debit transaction created successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating debit transaction");
            return StatusCode(500, new { message = "Error creating debit transaction" });
        }
    }

    // PUT: api/transactions/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateTransactionDto dto)
    {
        try
        {
            // Get current user ID
            var userId = _currentUser.UserId;
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var transaction = await _context.Transactions
                .Include(t => t.Customer)
                .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

            if (transaction == null)
                return NotFound(new { message = "Transaction not found" });

            // Check if customer is settled
            if (transaction.Customer.IsSettled)
            {
                return BadRequest(new { message = "Cannot edit transactions for settled customers" });
            }

            // Update fields
            if (dto.TransactionDate.HasValue)
                transaction.TransactionDate = dto.TransactionDate.Value;

            if (dto.Description != null)
                transaction.Description = dto.Description;

            if (dto.Amount.HasValue)
            {
                if (transaction.TransactionType == TransactionType.Credit)
                {
                    transaction.CreditAmount = dto.Amount.Value;
                    transaction.DebitAmount = 0;
                }
                else
                {
                    transaction.DebitAmount = dto.Amount.Value;
                    transaction.CreditAmount = 0;
                }
            }

            if (dto.Remark != null)
                transaction.Remark = dto.Remark;

            transaction.UpdatedBy = userId.Value;
            transaction.UpdatedAt = DateTime.UtcNow;
            transaction.FinancialYear = transaction.TransactionDate.Year;

            await _context.SaveChangesAsync();

            // Recalculate running balances for this customer
            await RecalculateRunningBalances(transaction.CustomerId, DateTime.MinValue);

            _logger.LogInformation("Transaction updated: {Id} by user {UserId}", id, userId.Value);

            return Ok(new { message = "Transaction updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating transaction {Id}", id);
            return StatusCode(500, new { message = "Error updating transaction" });
        }
    }

    // DELETE: api/transactions/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id, [FromBody] DeleteTransactionDto dto)
    {
        try
        {
            // Get current user
            var userId = _currentUser.UserId;
            var username = _currentUser.Username;

            if (!userId.HasValue || string.IsNullOrEmpty(username))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Validate password is provided
            if (string.IsNullOrEmpty(dto.Password))
                return BadRequest(new { message = "Password is required" });

            // Verify password
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId.Value && u.IsActive);

            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            // Verify password using BCrypt
            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return BadRequest(new { message = "Invalid password" });
            }

            // Get transaction
            var transaction = await _context.Transactions
                .Include(t => t.Customer)
                .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

            if (transaction == null)
                return NotFound(new { message = "Transaction not found" });

            // Check if customer is settled
            if (transaction.Customer.IsSettled)
            {
                return BadRequest(new { message = "Cannot delete transactions for settled customers" });
            }

            // Soft delete
            transaction.IsDeleted = true;
            transaction.DeletedAt = DateTime.UtcNow;
            transaction.DeletedBy = userId.Value;
            transaction.UpdatedBy = userId.Value;
            transaction.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Recalculate running balances
            await RecalculateRunningBalances(transaction.CustomerId, DateTime.MinValue);

            _logger.LogInformation("Transaction deleted: {Id} by user {UserId}", id, userId.Value);

            return Ok(new { message = "Transaction deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting transaction {Id}", id);
            return StatusCode(500, new { message = "Error deleting transaction" });
        }
    }

    // GET: api/transactions/customer/{customerId}
    [HttpGet("customer/{customerId}")]
    public async Task<IActionResult> GetByCustomer(long customerId, [FromQuery] int? year = null)
    {
        try
        {
            var query = _context.Transactions
                .Where(t => t.CustomerId == customerId && !t.IsDeleted);

            if (year.HasValue)
                query = query.Where(t => t.FinancialYear == year.Value);

            var transactions = await query
                .OrderBy(t => t.TransactionDate)
                .ThenBy(t => t.Id)
                .Select(t => new TransactionDto
                {
                    Id = t.Id,
                    CustomerId = t.CustomerId,
                    CustomerName = t.Customer.CustomerName,
                    TransactionDate = t.TransactionDate,
                    Description = t.Description,
                    DebitAmount = t.DebitAmount,
                    CreditAmount = t.CreditAmount,
                    RunningBalance = t.RunningBalance,
                    TransactionType = t.TransactionType.ToString(),
                    FinancialYear = t.FinancialYear,
                    Remark = t.Remark,
                    IsDeleted = t.IsDeleted,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync();

            return Ok(transactions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching transactions for customer {CustomerId}", customerId);
            return StatusCode(500, new { message = "Error fetching customer transactions" });
        }
    }

    // Private helper method to recalculate running balances
    private async Task RecalculateRunningBalances(long customerId, DateTime fromDate)
    {
        var customer = await _context.Customers.FindAsync(customerId);
        if (customer == null) return;

        // Get all transactions for this customer in chronological order
        var transactions = await _context.Transactions
            .Where(t => t.CustomerId == customerId && !t.IsDeleted && t.TransactionDate >= fromDate)
            .OrderBy(t => t.TransactionDate)
            .ThenBy(t => t.Id)
            .ToListAsync();

        // Get previous balance
        var previousTransaction = await _context.Transactions
            .Where(t => t.CustomerId == customerId && !t.IsDeleted && t.TransactionDate < fromDate)
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.Id)
            .FirstOrDefaultAsync();

        decimal runningBalance = previousTransaction?.RunningBalance ?? customer.OpeningBalance;

        // Recalculate each transaction
        foreach (var transaction in transactions)
        {
            if (transaction.TransactionType == TransactionType.Credit)
                runningBalance += transaction.CreditAmount;
            else
                runningBalance -= transaction.DebitAmount;

            transaction.RunningBalance = runningBalance;
        }

        await _context.SaveChangesAsync();
    }
}

// DTOs
public record TransactionDto
{
    public long Id { get; init; }
    public long CustomerId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public DateTime TransactionDate { get; init; }
    public string? Description { get; init; }
    public decimal DebitAmount { get; init; }
    public decimal CreditAmount { get; init; }
    public decimal RunningBalance { get; init; }
    public string TransactionType { get; init; } = string.Empty;
    public int FinancialYear { get; init; }
    public string? Remark { get; init; }
    public bool IsDeleted { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record CreateTransactionDto
{
    public long CustomerId { get; init; }
    public DateTime TransactionDate { get; init; }
    public string? Description { get; init; }
    public decimal Amount { get; init; }
    public string Type { get; init; } = string.Empty;
    public string? Remark { get; init; }
}

public record UpdateTransactionDto
{
    public DateTime? TransactionDate { get; init; }
    public string? Description { get; init; }
    public decimal? Amount { get; init; }
    public string? Remark { get; init; }
}

public record DeleteTransactionDto
{
    public string Password { get; init; } = string.Empty;
}