using Microsoft.AspNetCore.Mvc;
using MediatR;
using AccountingSystem.Application.Commands.CreateCustomer;
using Microsoft.EntityFrameworkCore;
using AccountingSystem.Infrastructure.Data;

namespace AccountingSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly AccountingDbContext _context;

    public CustomersController(IMediator mediator, AccountingDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var customers = await _context.Customers
            .Where(c => c.IsActive)
            .ToListAsync();
        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null) return NotFound();
        return Ok(customer);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}