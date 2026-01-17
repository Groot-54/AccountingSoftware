// AccountingSystem.Application/Commands/DeleteCustomer/DeleteCustomerCommand.cs
using MediatR;

namespace AccountingSystem.Application.Commands.DeleteCustomer;

public record DeleteCustomerCommand : IRequest<DeleteCustomerResponse>
{
    public long Id { get; init; }
    public string Password { get; init; } = string.Empty;
    public long? DeletedBy { get; init; }
}

public record DeleteCustomerResponse
{
    public bool Success { get; init; }
    public string? Message { get; init; }
}