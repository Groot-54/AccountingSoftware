namespace AccountingSystem.Application.Interfaces;

public interface ICurrentUserService
{
    long? UserId { get; }
    string? Username { get; }
}
