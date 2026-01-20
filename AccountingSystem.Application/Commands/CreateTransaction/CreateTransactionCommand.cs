// AccountingSystem.Application/Commands/CreateTransaction/CreateTransactionCommand.cs
using MediatR;
using AccountingSystem.Core.Enums;

namespace AccountingSystem.Application.Commands.CreateTransaction;

public class CreateTransactionCommand : IRequest<CreateTransactionResponse>
{
    public long CustomerId { get; set; }
    public DateTime TransactionDate { get; set; }
    public string? Description { get; set; }
    public decimal Amount { get; set; }
    public TransactionType TransactionType { get; set; }
    public string? Remark { get; set; }
}

public class CreateTransactionResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public long? TransactionId { get; set; }
}