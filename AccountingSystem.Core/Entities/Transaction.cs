using AccountingSystem.Core.Enums;
using AccountingSystem.Core.Entities;

public class Transaction
{
    public long Id { get; set; }
    public long CustomerId { get; set; }
    
    public DateTime TransactionDate { get; set; }
    public string? Description { get; set; }
    public decimal DebitAmount { get; set; }
    public decimal CreditAmount { get; set; }
    public decimal RunningBalance { get; set; }
    
    public TransactionType TransactionType { get; set; }
    public int FinancialYear { get; set; }
    public string? Remark { get; set; }
    
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public long? DeletedBy { get; set; }
    
    public long? CreatedBy { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation
    public Customer Customer { get; set; } = null!;
}