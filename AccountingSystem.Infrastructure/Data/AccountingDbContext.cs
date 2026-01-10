// AccountingSystem.Infrastructure/Data/AccountingDbContext.cs
using Microsoft.EntityFrameworkCore;
using AccountingSystem.Core.Entities;
using AccountingSystem.Application.Interfaces;

namespace AccountingSystem.Infrastructure.Data;

public class AccountingDbContext : DbContext, IAccountingDbContext
{
    public AccountingDbContext(DbContextOptions<AccountingDbContext> options)
        : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; } // ✅ ADDED - This fixes the error!

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AccountingDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Auto-update timestamps
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Property("CreatedAt").CurrentValue == null)
                    entry.Property("CreatedAt").CurrentValue = DateTime.UtcNow;
            }
            
            if (entry.Metadata.FindProperty("UpdatedAt") != null)
                entry.Property("UpdatedAt").CurrentValue = DateTime.UtcNow;
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}