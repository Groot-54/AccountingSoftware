// AccountingSystem.Application/Commands/ChangePassword/ChangePasswordHandler.cs
using MediatR;
using Microsoft.EntityFrameworkCore;
using AccountingSystem.Application.Interfaces;

namespace AccountingSystem.Application.Commands.ChangePassword;

public class ChangePasswordHandler : IRequestHandler<ChangePasswordCommand, ChangePasswordResponse>
{
    private readonly IAccountingDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ChangePasswordHandler(
        IAccountingDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ChangePasswordResponse> Handle(
        ChangePasswordCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Validate passwords match
            if (request.NewPassword != request.ConfirmPassword)
            {
                return new ChangePasswordResponse
                {
                    Success = false,
                    Message = "New password and confirmation do not match"
                };
            }

            // Validate password strength (at least 6 characters)
            if (request.NewPassword.Length < 6)
            {
                return new ChangePasswordResponse
                {
                    Success = false,
                    Message = "Password must be at least 6 characters long"
                };
            }

            // Get current user
            var userId = _currentUser.UserId;
            var username = _currentUser.Username;

            if (!userId.HasValue && string.IsNullOrEmpty(username))
            {
                return new ChangePasswordResponse
                {
                    Success = false,
                    Message = "User not authenticated"
                };
            }

            // Find user
            User? user = null;

            if (userId.HasValue)
            {
                user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId.Value && u.IsActive, cancellationToken);
            }

            if (user == null && !string.IsNullOrEmpty(username))
            {
                user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == username && u.IsActive, cancellationToken);
            }

            if (user == null)
            {
                return new ChangePasswordResponse
                {
                    Success = false,
                    Message = "User not found"
                };
            }

            // Verify current password
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return new ChangePasswordResponse
                {
                    Success = false,
                    Message = "Current password is incorrect"
                };
            }

            // Hash new password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return new ChangePasswordResponse
            {
                Success = true,
                Message = "Password changed successfully"
            };
        }
        catch (Exception ex)
        {
            return new ChangePasswordResponse
            {
                Success = false,
                Message = $"Error changing password: {ex.Message}"
            };
        }
    }
}