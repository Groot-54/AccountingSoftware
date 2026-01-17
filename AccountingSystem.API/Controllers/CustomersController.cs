using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AccountingSystem.Application.Commands.CreateCustomer;
using AccountingSystem.Application.Commands.UpdateCustomer;
using AccountingSystem.Application.Commands.DeleteCustomer;
using Microsoft.EntityFrameworkCore;
using AccountingSystem.Infrastructure.Data;
using System.Security.Claims;

namespace AccountingSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly AccountingDbContext _context;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(
        IMediator mediator, 
        AccountingDbContext context,
        ILogger<CustomersController> logger)
    {
        _mediator = mediator;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all active customers
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        try
        {
            var query = _context.Customers.AsQueryable();
            
            if (!includeInactive)
                query = query.Where(c => c.IsActive);

            var customers = await query
                .OrderBy(c => c.CustomerName)
                .Select(c => new CustomerDto
                {
                    Id = c.Id,
                    CustomerName = c.CustomerName,
                    Mobile = c.Mobile,
                    Phone = c.Phone,
                    Email = c.Email,
                    Address = c.Address,
                    City = c.City,
                    State = c.State,
                    ZipCode = c.ZipCode,
                    OpeningBalance = c.OpeningBalance,
                    OpeningBalanceType = c.OpeningBalanceType.ToString(),
                    OpeningBalanceDate = c.OpeningBalanceDate,
                    IsSettled = c.IsSettled,
                    SettlementDate = c.SettlementDate,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync();

            return Ok(customers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching customers");
            return StatusCode(500, new { message = "Error fetching customers" });
        }
    }

    /// <summary>
    /// Get customer by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        try
        {
            var customer = await _context.Customers
                .Where(c => c.Id == id)
                .Select(c => new CustomerDto
                {
                    Id = c.Id,
                    CustomerName = c.CustomerName,
                    Mobile = c.Mobile,
                    Phone = c.Phone,
                    Email = c.Email,
                    Address = c.Address,
                    City = c.City,
                    State = c.State,
                    ZipCode = c.ZipCode,
                    OpeningBalance = c.OpeningBalance,
                    OpeningBalanceType = c.OpeningBalanceType.ToString(),
                    OpeningBalanceDate = c.OpeningBalanceDate,
                    IsSettled = c.IsSettled,
                    SettlementDate = c.SettlementDate,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (customer == null)
                return NotFound(new { message = "Customer not found" });

            return Ok(customer);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching customer {Id}", id);
            return StatusCode(500, new { message = "Error fetching customer" });
        }
    }

    /// <summary>
    /// Create new customer
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            
            if (!result.Success)
                return BadRequest(result);

            return CreatedAtAction(nameof(GetById), 
                new { id = result.CustomerId }, 
                result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating customer");
            return StatusCode(500, new { message = "Error creating customer" });
        }
    }

    /// <summary>
    /// Update existing customer
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateCustomerDto dto)
    {
        try
        {
            // Get current user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            long? userId = userIdClaim != null ? long.Parse(userIdClaim) : null;

            var command = new UpdateCustomerCommand
            {
                Id = id,
                CustomerName = dto.CustomerName,
                Mobile = dto.Mobile,
                Phone = dto.Phone,
                Email = dto.Email,
                Address = dto.Address,
                City = dto.City,
                State = dto.State,
                ZipCode = dto.ZipCode,
                OpeningBalance = dto.OpeningBalance,
                OpeningBalanceType = dto.OpeningBalanceType,
                OpeningBalanceDate = dto.OpeningBalanceDate,
                IsSettled = dto.IsSettled,
                UpdatedBy = userId
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating customer {Id}", id);
            return StatusCode(500, new { message = "Error updating customer" });
        }
    }

    /// <summary>
    /// Delete customer (requires password confirmation)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id, [FromBody] DeleteCustomerDto dto)
    {
        try
        {
            // Get current user ID from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            long? userId = userIdClaim != null ? long.Parse(userIdClaim) : null;

            var command = new DeleteCustomerCommand
            {
                Id = id,
                Password = dto.Password,
                DeletedBy = userId
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting customer {Id}", id);
            return StatusCode(500, new { message = "Error deleting customer" });
        }
    }

    /// <summary>
    /// Get customer current balance
    /// </summary>
    [HttpGet("{id}/balance")]
    public async Task<IActionResult> GetBalance(long id, [FromQuery] int? year = null)
    {
        try
        {
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == id && c.IsActive);

            if (customer == null)
                return NotFound(new { message = "Customer not found" });

            // Get last transaction for running balance
            var query = _context.Transactions
                .Where(t => t.CustomerId == id && !t.IsDeleted);

            if (year.HasValue)
                query = query.Where(t => t.FinancialYear == year.Value);

            var lastTransaction = await query
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.Id)
                .FirstOrDefaultAsync();

            var balance = lastTransaction?.RunningBalance ?? customer.OpeningBalance;
            var balanceType = balance >= 0 ? "CR" : "DR";

            return Ok(new
            {
                customerId = id,
                customerName = customer.CustomerName,
                balance = Math.Abs(balance),
                balanceType = balanceType,
                year = year,
                openingBalance = customer.OpeningBalance,
                lastTransactionDate = lastTransaction?.TransactionDate
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching balance for customer {Id}", id);
            return StatusCode(500, new { message = "Error fetching customer balance" });
        }
    }

    /// <summary>
    /// Settle customer account
    /// </summary>
    [HttpPost("{id}/settle")]
    public async Task<IActionResult> SettleCustomer(long id)
    {
        try
        {
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == id && c.IsActive);

            if (customer == null)
                return NotFound(new { message = "Customer not found" });

            if (customer.IsSettled)
                return BadRequest(new { message = "Customer is already settled" });

            customer.IsSettled = true;
            customer.SettlementDate = DateTime.UtcNow;
            customer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Customer settled successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error settling customer {Id}", id);
            return StatusCode(500, new { message = "Error settling customer" });
        }
    }
}

// DTOs
public record CustomerDto
{
    public long Id { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string? Mobile { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
    public string? Address { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? ZipCode { get; init; }
    public decimal OpeningBalance { get; init; }
    public string OpeningBalanceType { get; init; } = string.Empty;
    public DateTime? OpeningBalanceDate { get; init; }
    public bool IsSettled { get; init; }
    public DateTime? SettlementDate { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record UpdateCustomerDto
{
    public string CustomerName { get; init; } = string.Empty;
    public string? Mobile { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
    public string? Address { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? ZipCode { get; init; }
    public decimal OpeningBalance { get; init; }
    public AccountingSystem.Core.Enums.BalanceType OpeningBalanceType { get; init; }
    public DateTime? OpeningBalanceDate { get; init; }
    public bool IsSettled { get; init; }
}

public record DeleteCustomerDto
{
    public string Password { get; init; } = string.Empty;
}