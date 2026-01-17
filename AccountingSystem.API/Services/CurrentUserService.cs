using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using AccountingSystem.Application.Interfaces;

namespace AccountingSystem.API.Services;

public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public long? UserId
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?
                .User?
                .FindFirst(ClaimTypes.NameIdentifier)?.Value;

            return long.TryParse(value, out var id) ? id : null;
        }
    }

    public string? Username
        => _httpContextAccessor.HttpContext?
            .User?
            .FindFirst(ClaimTypes.Name)?.Value;
}
