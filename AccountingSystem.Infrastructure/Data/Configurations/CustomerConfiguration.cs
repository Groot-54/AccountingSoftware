using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AccountingSystem.Core.Entities;

namespace AccountingSystem.Infrastructure.Data.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customers");
        
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        
        builder.Property(c => c.CustomerName)
            .HasColumnName("customer_name")
            .HasMaxLength(100)
            .IsRequired();
        
        builder.Property(c => c.Phone).HasColumnName("phone").HasMaxLength(20);
        builder.Property(c => c.Mobile).HasColumnName("mobile").HasMaxLength(20);
        builder.Property(c => c.Email).HasColumnName("email").HasMaxLength(100);
        builder.Property(c => c.Address).HasColumnName("address");
        builder.Property(c => c.City).HasColumnName("city").HasMaxLength(50);
        builder.Property(c => c.State).HasColumnName("state").HasMaxLength(50);
        builder.Property(c => c.ZipCode).HasColumnName("zip_code").HasMaxLength(10);
        
        builder.Property(c => c.OpeningBalance)
            .HasColumnName("opening_balance")
            .HasColumnType("decimal(18,2)");
        
        builder.Property(c => c.OpeningBalanceType)
            .HasColumnName("opening_balance_type")
            .HasMaxLength(10)
            .HasConversion<string>();
        
        builder.Property(c => c.OpeningBalanceDate).HasColumnName("opening_balance_date");
        builder.Property(c => c.IsSettled).HasColumnName("is_settled");
        builder.Property(c => c.SettlementDate).HasColumnName("settlement_date");
        builder.Property(c => c.IsActive).HasColumnName("is_active");
        builder.Property(c => c.DeletedAt).HasColumnName("deleted_at");
        builder.Property(c => c.CreatedBy).HasColumnName("created_by");
        builder.Property(c => c.UpdatedBy).HasColumnName("updated_by");
        builder.Property(c => c.CreatedAt).HasColumnName("created_at");
        builder.Property(c => c.UpdatedAt).HasColumnName("updated_at");
        
        // Indexes
        builder.HasIndex(c => c.CustomerName);
        builder.HasIndex(c => c.Mobile);
        builder.HasIndex(c => c.IsActive);
        
        // Relationships
        builder.HasMany(c => c.Transactions)
            .WithOne(t => t.Customer)
            .HasForeignKey(t => t.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}