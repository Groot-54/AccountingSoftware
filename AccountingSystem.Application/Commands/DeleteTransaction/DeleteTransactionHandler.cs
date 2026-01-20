// AccountingSystem.Application/Commands/DeleteTransaction/DeleteTransactionHandler.cs
using MediatR;
using Microsoft.EntityFrameworkCore;
using AccountingSystem.Application.Interfaces;
using AccountingSystem.Core.Enums;

namespace AccountingSystem.Application.Commands.DeleteTransaction;

public class DeleteTransactionHandler : IRequestHandler<DeleteTransactionCommand, DeleteTransactionResponse>
{
    private readonly IAccountingDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DeleteTransactionHandler(
        IAccountingDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<DeleteTransactionResponse> Handle(
        DeleteTransactionCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get current user
            var userId = _currentUser.UserId;
            var username = _currentUser.Username;

            if (!userId.HasValue && string.IsNullOrEmpty(username))
            {
                return new DeleteTransactionResponse
                {
                    Success = false,
                    Message = "User not authenticated"
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
                return new DeleteTransactionResponse
                {
                    Success = false,
                    Message = "User not found"
                };
            }

            // Verify password using BCrypt
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return new DeleteTransactionResponse
                {
                    Success = false,
                    Message = "Invalid password"
                };
            }

            // Get transaction
            var transaction = await _context.Transactions
                .Include(t => t.Customer)
                .FirstOrDefaultAsync(t => t.Id == request.Id && !t.IsDeleted, cancellationToken);

            if (transaction == null)
            {
                return new DeleteTransactionResponse
                {
                    Success = false,
                    Message = "Transaction not found"
                };
            }

            // Check if customer is settled
            if (transaction.Customer.IsSettled)
            {
                return new DeleteTransactionResponse
                {
                    Success = false,
                    Message = "Cannot delete transactions for settled customers"
                };
            }

            // Soft delete
            transaction.IsDeleted = true;
            transaction.DeletedAt = DateTime.UtcNow;
            transaction.DeletedBy = user.Id;
            transaction.UpdatedBy = user.Id;
            transaction.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            // Recalculate running balances
            await RecalculateRunningBalances(transaction.CustomerId, cancellationToken);

            return new DeleteTransactionResponse
            {
                Success = true,
                Message = "Transaction deleted successfully"
            };
        }
        catch (Exception ex)
        {
            return new DeleteTransactionResponse
            {
                Success = false,
                Message = $"Error deleting transaction: {ex.Message}"
            };
        }
    }

    private async Task RecalculateRunningBalances(long customerId, CancellationToken cancellationToken)
    {
        var customer = await _context.Customers.FindAsync(new object[] { customerId }, cancellationToken);
        if (customer == null) return;

        // Get all transactions for this customer in chronological order
        var transactions = await _context.Transactions
            .Where(t => t.CustomerId == customerId && !t.IsDeleted)
            .OrderBy(t => t.TransactionDate)
            .ThenBy(t => t.Id)
            .ToListAsync(cancellationToken);

        decimal runningBalance = customer.OpeningBalance;

        // Recalculate each transaction
        foreach (var transaction in transactions)
        {
            if (transaction.TransactionType == TransactionType.Credit)
                runningBalance += transaction.CreditAmount;
            else
                runningBalance -= transaction.DebitAmount;

            transaction.RunningBalance = runningBalance;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}