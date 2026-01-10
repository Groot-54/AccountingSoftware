// CreateCustomerCommand.cs
using MediatR;

namespace AccountingSystem.Application.Commands.CreateCustomer;

public record CreateCustomerCommand : IRequest<CreateCustomerResponse>
{
    public string CustomerName { get; init; } = string.Empty;
    public string? Mobile { get; init; }
    public string? Email { get; init; }
    public string? Address { get; init; }
}

public record CreateCustomerResponse
{
    public long CustomerId { get; init; }
    public bool Success { get; init; }
    public string? Message { get; init; }
}