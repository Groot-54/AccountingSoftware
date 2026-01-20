// AccountingSystem.Application/Commands/UpdateTransaction/UpdateTransactionHandler.cs
using MediatR;
using Microsoft.EntityFrameworkCore;
using AccountingSystem.Application.Interfaces;
using AccountingSystem.Core.Enums;

namespace AccountingSystem.Application.Commands.UpdateTransaction;

public class UpdateTransactionHandler : IRequestHandler<UpdateTransactionCommand, UpdateTransactionResponse>
{
    private readonly IAccountingDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateTransactionHandler(
        IAccountingDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<UpdateTransactionResponse> Handle(
        UpdateTransactionCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get current user ID
            var userId = _currentUser.UserId;
            if (!userId.HasValue)
            {
                return new UpdateTransactionResponse
                {
                    Success = false,
                    Message = "User not authenticated"
                };
            }

            var transaction = await _context.Transactions
                .Include(t => t.Customer)
                .FirstOrDefaultAsync(t => t.Id == request.Id && !t.IsDeleted, cancellationToken);

            if (transaction == null)
            {
                return new UpdateTransactionResponse
                {
                    Success = false,
                    Message = "Transaction not found"
                };
            }

            // Check if customer is settled
            if (transaction.Customer.IsSettled)
            {
                return new UpdateTransactionResponse
                {
                    Success = false,
                    Message = "Cannot edit transactions for settled customers"
                };
            }

            // Update fields if provided
            if (request.TransactionDate.HasValue)
            {
                transaction.TransactionDate = request.TransactionDate.Value;
                transaction.FinancialYear = request.TransactionDate.Value.Year;
            }

            if (request.Description != null)
                transaction.Description = request.Description;

            if (request.Amount.HasValue)
            {
                if (transaction.TransactionType == TransactionType.Credit)
                {
                    transaction.CreditAmount = request.Amount.Value;
                    transaction.DebitAmount = 0;
                }
                else
                {
                    transaction.DebitAmount = request.Amount.Value;
                    transaction.CreditAmount = 0;
                }
            }

            if (request.Remark != null)
                transaction.Remark = request.Remark;

            transaction.UpdatedBy = userId.Value;
            transaction.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            // Recalculate all running balances for this customer
            await RecalculateRunningBalances(transaction.CustomerId, cancellationToken);

            return new UpdateTransactionResponse
            {
                Success = true,
                Message = "Transaction updated successfully"
            };
        }
        catch (Exception ex)
        {
            return new UpdateTransactionResponse
            {
                Success = false,
                Message = $"Error updating transaction: {ex.Message}"
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