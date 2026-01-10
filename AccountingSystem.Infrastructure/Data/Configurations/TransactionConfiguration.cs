using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("transactions");
        
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id");
        
        builder.Property(t => t.CustomerId).HasColumnName("customer_id").IsRequired();
        builder.Property(t => t.TransactionDate).HasColumnName("transaction_date").IsRequired();
        builder.Property(t => t.Description).HasColumnName("description").HasMaxLength(200);
        
        builder.Property(t => t.DebitAmount)
            .HasColumnName("debit_amount")
            .HasColumnType("decimal(18,2)");
        
        builder.Property(t => t.CreditAmount)
            .HasColumnName("credit_amount")
            .HasColumnType("decimal(18,2)");
        
        builder.Property(t => t.RunningBalance)
            .HasColumnName("running_balance")
            .HasColumnType("decimal(18,2)");
        
        builder.Property(t => t.TransactionType)
            .HasColumnName("transaction_type")
            .HasMaxLength(10)
            .HasConversion<string>()
            .IsRequired();
        
        builder.Property(t => t.FinancialYear).HasColumnName("financial_year").IsRequired();
        builder.Property(t => t.Remark).HasColumnName("remark").HasMaxLength(200);
        builder.Property(t => t.IsDeleted).HasColumnName("is_deleted");
        builder.Property(t => t.DeletedAt).HasColumnName("deleted_at");
        builder.Property(t => t.DeletedBy).HasColumnName("deleted_by");
        builder.Property(t => t.CreatedBy).HasColumnName("created_by");
        builder.Property(t => t.UpdatedBy).HasColumnName("updated_by");
        builder.Property(t => t.CreatedAt).HasColumnName("created_at");
        builder.Property(t => t.UpdatedAt).HasColumnName("updated_at");
        
        // Indexes
        builder.HasIndex(t => t.CustomerId);
        builder.HasIndex(t => t.TransactionDate);
        builder.HasIndex(t => t.FinancialYear);
        builder.HasIndex(t => t.TransactionType);
        builder.HasIndex(t => t.IsDeleted);
    }
}