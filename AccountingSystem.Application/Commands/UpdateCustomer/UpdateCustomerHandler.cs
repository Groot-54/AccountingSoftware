// AccountingSystem.Application/Commands/UpdateCustomer/UpdateCustomerHandler.cs
using MediatR;
using Microsoft.EntityFrameworkCore;
using AccountingSystem.Application.Interfaces;

namespace AccountingSystem.Application.Commands.UpdateCustomer;

public class UpdateCustomerHandler : IRequestHandler<UpdateCustomerCommand, UpdateCustomerResponse>
{
    private readonly IAccountingDbContext _context;

    public UpdateCustomerHandler(IAccountingDbContext context)
    {
        _context = context;
    }

    public async Task<UpdateCustomerResponse> Handle(
        UpdateCustomerCommand request, 
        CancellationToken cancellationToken)
    {
        try
        {
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == request.Id && c.IsActive, cancellationToken);

            if (customer == null)
            {
                return new UpdateCustomerResponse
                {
                    Success = false,
                    Message = "Customer not found or inactive"
                };
            }

            // Update customer details
            customer.CustomerName = request.CustomerName;
            customer.Mobile = request.Mobile;
            customer.Phone = request.Phone;
            customer.Email = request.Email;
            customer.Address = request.Address;
            customer.City = request.City;
            customer.State = request.State;
            customer.ZipCode = request.ZipCode;
            customer.OpeningBalance = request.OpeningBalance;
            customer.OpeningBalanceType = request.OpeningBalanceType;
            customer.OpeningBalanceDate = request.OpeningBalanceDate;
            
            // Handle settlement
            if (request.IsSettled && !customer.IsSettled)
            {
                customer.IsSettled = true;
                customer.SettlementDate = DateTime.UtcNow;
            }
            else if (!request.IsSettled && customer.IsSettled)
            {
                customer.IsSettled = false;
                customer.SettlementDate = null;
            }

            customer.UpdatedBy = request.UpdatedBy;
            customer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return new UpdateCustomerResponse
            {
                Success = true,
                Message = "Customer updated successfully",
                CustomerId = customer.Id
            };
        }
        catch (Exception ex)
        {
            return new UpdateCustomerResponse
            {
                Success = false,
                Message = $"Error updating customer: {ex.Message}"
            };
        }
    }
}