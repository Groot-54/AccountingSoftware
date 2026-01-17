using AccountingSystem.Core.Entities;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace AccountingSystem.Application.Interfaces
{
    public interface IAccountingDbContext
    {
        DbSet<Customer> Customers { get; }
        DbSet<User> Users { get; }
        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    }
}
