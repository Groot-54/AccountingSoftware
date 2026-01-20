// AccountingSystem.Application/Commands/UpdateTransaction/UpdateTransactionCommand.cs
using MediatR;

namespace AccountingSystem.Application.Commands.UpdateTransaction;

public class UpdateTransactionCommand : IRequest<UpdateTransactionResponse>
{
    public long Id { get; set; }
    public DateTime? TransactionDate { get; set; }
    public string? Description { get; set; }
    public decimal? Amount { get; set; }
    public string? Remark { get; set; }
}

public class UpdateTransactionResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}