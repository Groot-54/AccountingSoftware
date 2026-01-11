// AccountingSystem.API/Extensions/DatabaseSeeder.cs
using AccountingSystem.Infrastructure.Data;
using AccountingSystem.Core.Entities;

namespace AccountingSystem.API.Extensions;

public static class DatabaseSeeder
{
    public static async Task SeedDatabase(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AccountingDbContext>();
        
        // Ensure database is created
        await context.Database.EnsureCreatedAsync();
        
        // Check if admin user exists
        if (!context.Users.Any())
        {
            var adminUser = new User
            {
                Username = "admin",
                Email = "admin@accounting.com",
                FullName = "System Administrator",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            context.Users.Add(adminUser);
            await context.SaveChangesAsync();
            
            Console.WriteLine("✅ Admin user created - Username: admin, Password: admin123");
        }
    }
}