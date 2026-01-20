// AccountingSystem.Application/Commands/DeleteCustomer/DeleteCustomerHandler.cs
using MediatR;
using Microsoft.EntityFrameworkCore;
using AccountingSystem.Application.Interfaces;

namespace AccountingSystem.Application.Commands.DeleteCustomer;

public class DeleteCustomerHandler : IRequestHandler<DeleteCustomerCommand, DeleteCustomerResponse>
{
    private readonly IAccountingDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DeleteCustomerHandler(
        IAccountingDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<DeleteCustomerResponse> Handle(
        DeleteCustomerCommand request, 
        CancellationToken cancellationToken)
    {
        try
        {
            // Get current user ID - try UserId first, then username
            var userId = _currentUser.UserId;
            var username = _currentUser.Username;

            // Need at least one identifier
            if (!userId.HasValue && string.IsNullOrEmpty(username))
            {
                return new DeleteCustomerResponse
                {
                    Success = false,
                    Message = "Unauthorized: User not found"
                };
            }

            // Find user by ID or username
            User? user = null;
            
            if (userId.HasValue)
            {
                user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId.Value && u.IsActive, cancellationToken);
            }
            
            // Fallback to username if user not found by ID
            if (user == null && !string.IsNullOrEmpty(username))
            {
                user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == username && u.IsActive, cancellationToken);
            }

            if (user == null)
            {
                return new DeleteCustomerResponse
                {
                    Success = false,
                    Message = "User not found"
                };
            }

            // Verify password using BCrypt
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return new DeleteCustomerResponse
                {
                    Success = false,
                    Message = "Invalid password"
                };
            }

            // Find customer
            var customer = await _context.Customers
                .Include(c => c.Transactions)
                .FirstOrDefaultAsync(c => c.Id == request.Id && c.IsActive, cancellationToken);

            if (customer == null)
            {
                return new DeleteCustomerResponse
                {
                    Success = false,
                    Message = "Customer not found or already deleted"
                };
            }

            // Check if customer has transactions
            var hasTransactions = customer.Transactions.Any(t => !t.IsDeleted);
            if (hasTransactions)
            {
                return new DeleteCustomerResponse
                {
                    Success = false,
                    Message = "Cannot delete customer with existing transactions. Please delete all transactions first."
                };
            }

            // Soft delete
            customer.IsActive = false;
            customer.DeletedAt = DateTime.UtcNow;
            customer.UpdatedBy = request.DeletedBy ?? user.Id;
            customer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return new DeleteCustomerResponse
            {
                Success = true,
                Message = "Customer deleted successfully"
            };
        }
        catch (Exception ex)
        {
            return new DeleteCustomerResponse
            {
                Success = false,
                Message = $"Error deleting customer: {ex.Message}"
            };
        }
    }
}