public class AuditLog
{
    public long Id { get; set; }
    public string TableName { get; set; } = string.Empty;
    public long RecordId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public long? ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}