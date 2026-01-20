// AccountingSystem.Application/Commands/CreateTransaction/CreateTransactionHandler.cs
using MediatR;
using Microsoft.EntityFrameworkCore;
using AccountingSystem.Application.Interfaces;
using AccountingSystem.Core.Enums;

namespace AccountingSystem.Application.Commands.CreateTransaction;

public class CreateTransactionHandler : IRequestHandler<CreateTransactionCommand, CreateTransactionResponse>
{
    private readonly IAccountingDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateTransactionHandler(
        IAccountingDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<CreateTransactionResponse> Handle(
        CreateTransactionCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get current user ID
            var userId = _currentUser.UserId;
            if (!userId.HasValue)
            {
                return new CreateTransactionResponse
                {
                    Success = false,
                    Message = "User not authenticated"
                };
            }

            // Validate customer exists and is active
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == request.CustomerId && c.IsActive, cancellationToken);

            if (customer == null)
            {
                return new CreateTransactionResponse
                {
                    Success = false,
                    Message = "Customer not found or inactive"
                };
            }

            // Check if customer is settled
            if (customer.IsSettled)
            {
                return new CreateTransactionResponse
                {
                    Success = false,
                    Message = "Cannot create transactions for settled customers. Please unsettle the customer first."
                };
            }

            // Get last transaction for running balance
            var lastTransaction = await _context.Transactions
                .Where(t => t.CustomerId == request.CustomerId && !t.IsDeleted)
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.Id)
                .FirstOrDefaultAsync(cancellationToken);

            var previousBalance = lastTransaction?.RunningBalance ?? customer.OpeningBalance;

            // Calculate new running balance
            decimal newBalance;
            if (request.TransactionType == TransactionType.Credit)
            {
                newBalance = previousBalance + request.Amount;
            }
            else // Debit
            {
                newBalance = previousBalance - request.Amount;
            }

            var transaction = new Transaction
            {
                CustomerId = request.CustomerId,
                TransactionDate = request.TransactionDate,
                Description = request.Description,
                CreditAmount = request.TransactionType == TransactionType.Credit ? request.Amount : 0,
                DebitAmount = request.TransactionType == TransactionType.Debit ? request.Amount : 0,
                RunningBalance = newBalance,
                TransactionType = request.TransactionType,
                FinancialYear = request.TransactionDate.Year,
                Remark = request.Remark,
                CreatedBy = userId.Value,
                CreatedAt = DateTime.UtcNow,
                UpdatedBy = userId.Value,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync(cancellationToken);

            // Recalculate subsequent transactions
            await RecalculateRunningBalances(
                request.CustomerId, 
                transaction.TransactionDate, 
                cancellationToken);

            return new CreateTransactionResponse
            {
                Success = true,
                Message = $"{request.TransactionType} transaction created successfully",
                TransactionId = transaction.Id
            };
        }
        catch (Exception ex)
        {
            return new CreateTransactionResponse
            {
                Success = false,
                Message = $"Error creating transaction: {ex.Message}"
            };
        }
    }

    private async Task RecalculateRunningBalances(
        long customerId, 
        DateTime fromDate, 
        CancellationToken cancellationToken)
    {
        var customer = await _context.Customers.FindAsync(new object[] { customerId }, cancellationToken);
        if (customer == null) return;

        // Get all transactions for this customer in chronological order
        var transactions = await _context.Transactions
            .Where(t => t.CustomerId == customerId && !t.IsDeleted && t.TransactionDate >= fromDate)
            .OrderBy(t => t.TransactionDate)
            .ThenBy(t => t.Id)
            .ToListAsync(cancellationToken);

        // Get previous balance
        var previousTransaction = await _context.Transactions
            .Where(t => t.CustomerId == customerId && !t.IsDeleted && t.TransactionDate < fromDate)
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.Id)
            .FirstOrDefaultAsync(cancellationToken);

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

        await _context.SaveChangesAsync(cancellationToken);
    }
}