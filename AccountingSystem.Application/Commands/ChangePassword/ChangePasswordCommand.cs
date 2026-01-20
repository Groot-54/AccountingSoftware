// AccountingSystem.Application/Commands/ChangePassword/ChangePasswordCommand.cs
using MediatR;

namespace AccountingSystem.Application.Commands.ChangePassword;

public class ChangePasswordCommand : IRequest<ChangePasswordResponse>
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class ChangePasswordResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}