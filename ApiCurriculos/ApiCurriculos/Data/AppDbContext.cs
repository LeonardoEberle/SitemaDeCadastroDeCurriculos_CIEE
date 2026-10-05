using ApiCurriculos.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiCurriculos.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Pessoa> Pessoas => Set<Pessoa>();
    public DbSet<Habilidade> Habilidades => Set<Habilidade>();
    public DbSet<ExperienciaProfissional> ExperienciasProfissionais => Set<ExperienciaProfissional>();
    public DbSet<Graduacao> Graduacoes => Set<Graduacao>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Pessoa>(entity =>
        {
            entity.HasIndex(p => p.Email).IsUnique().HasDatabaseName("IX_Pessoa_Email");

            entity.Property(p => p.DataInscricao)
                  .HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Habilidade>()
            .HasOne(h => h.Pessoa)
            .WithMany(p => p!.Habilidades)
            .HasForeignKey(h => h.PessoaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExperienciaProfissional>()
            .HasOne(e => e.Pessoa)
            .WithMany(p => p!.ExperienciasProfissionais)
            .HasForeignKey(e => e.PessoaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Graduacao>()
            .HasOne(g => g.Pessoa)
            .WithMany(p => p!.Graduacoes)
            .HasForeignKey(g => g.PessoaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
