// AccountingSystem.Application/Commands/CreateCustomer/CreateCustomerHandler.cs
using MediatR;
using AccountingSystem.Application.Interfaces;
using AccountingSystem.Core.Entities;
using AccountingSystem.Core.Enums;
// using Microsoft.AspNetCore.Http;
// using System.Security.Claims;

namespace AccountingSystem.Application.Commands.CreateCustomer;

public class CreateCustomerHandler : IRequestHandler<CreateCustomerCommand, CreateCustomerResponse>
{
    private readonly IAccountingDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateCustomerHandler(
        IAccountingDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<CreateCustomerResponse> Handle(
        CreateCustomerCommand request, 
        CancellationToken cancellationToken)
    {
        try
        {
            // Get current user ID from JWT token
            var userId = _currentUser.UserId;

            var customer = new Customer
            {
                CustomerName = request.CustomerName,
                Mobile = request.Mobile,
                Email = request.Email,
                Address = request.Address,
                OpeningBalance = 0,
                OpeningBalanceType = BalanceType.CR,
                OpeningBalanceDate = DateTime.UtcNow,
                IsActive = true,
                IsSettled = false,
                CreatedBy = userId,
                UpdatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync(cancellationToken);

            return new CreateCustomerResponse
            {
                CustomerId = customer.Id,
                Success = true,
                Message = "Customer created successfully"
            };
        }
        catch (Exception ex)
        {
            return new CreateCustomerResponse
            {
                CustomerId = 0,
                Success = false,
                Message = $"Error creating customer: {ex.Message}"
            };
        }
    }
}