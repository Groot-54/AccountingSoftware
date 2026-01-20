// AccountingSystem.Application/Commands/UpdateCustomer/UpdateCustomerCommand.cs
using MediatR;
using AccountingSystem.Core.Enums;

namespace AccountingSystem.Application.Commands.UpdateCustomer;

public record UpdateCustomerCommand : IRequest<UpdateCustomerResponse>
{
    public long Id { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string? Mobile { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
    public string? Address { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? ZipCode { get; init; }
    public decimal OpeningBalance { get; init; }
    public BalanceType OpeningBalanceType { get; init; }
    public DateTime? OpeningBalanceDate { get; init; }
    public bool IsSettled { get; init; }
    public long? UpdatedBy { get; init; }
}

public record UpdateCustomerResponse
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public long? CustomerId { get; init; }
}