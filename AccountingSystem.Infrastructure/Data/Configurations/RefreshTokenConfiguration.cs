// AccountingSystem.Infrastructure/Configurations/RefreshTokenConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AccountingSystem.Core.Entities;

namespace AccountingSystem.Infrastructure.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");
        
        builder.HasKey(rt => rt.Id);
        
        builder.Property(rt => rt.Token)
            .IsRequired()
            .HasMaxLength(500);
            
        builder.Property(rt => rt.CreatedByIp)
            .HasMaxLength(50);
            
        builder.Property(rt => rt.RevokedByIp)
            .HasMaxLength(50);
            
        builder.HasOne(rt => rt.User)
            .WithMany()
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasIndex(rt => rt.Token);
    }
}