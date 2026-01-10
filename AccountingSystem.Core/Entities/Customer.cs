namespace AccountingSystem.Core.Entities;
using AccountingSystem.Core.Enums;

public class Customer
{
    public long Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    
    public decimal OpeningBalance { get; set; }
    public BalanceType OpeningBalanceType { get; set; }
    public DateTime? OpeningBalanceDate { get; set; }
    
    public bool IsSettled { get; set; }
    public DateTime? SettlementDate { get; set; }
    
    public bool IsActive { get; set; } = true;
    public DateTime? DeletedAt { get; set; }
    
    public long? CreatedBy { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}