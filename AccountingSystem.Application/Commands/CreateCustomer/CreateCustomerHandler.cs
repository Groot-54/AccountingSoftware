using MediatR;
using AccountingSystem.Core.Entities;
using AccountingSystem.Application.Interfaces;

namespace AccountingSystem.Application.Commands.CreateCustomer;

public class CreateCustomerHandler : IRequestHandler<CreateCustomerCommand, CreateCustomerResponse>
{
    private readonly IAccountingDbContext _context;

    public CreateCustomerHandler(IAccountingDbContext context)
    {
        _context = context;
    }

    public async Task<CreateCustomerResponse> Handle(
        CreateCustomerCommand request,
        CancellationToken cancellationToken)
    {
        var customer = new Customer
        {
            CustomerName = request.CustomerName,
            Mobile = request.Mobile,
            Email = request.Email,
            Address = request.Address,
            OpeningBalance = 0,
            OpeningBalanceType = Core.Enums.BalanceType.CR,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateCustomerResponse
        {
            Success = true,
            CustomerId = customer.Id,
            Message = "Customer created successfully"
        };
    }
}