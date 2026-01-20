// AccountingSystem.Application/Commands/DeleteTransaction/DeleteTransactionCommand.cs
using MediatR;

namespace AccountingSystem.Application.Commands.DeleteTransaction;

public class DeleteTransactionCommand : IRequest<DeleteTransactionResponse>
{
    public long Id { get; set; }
    public string Password { get; set; } = string.Empty;
}

public class DeleteTransactionResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}