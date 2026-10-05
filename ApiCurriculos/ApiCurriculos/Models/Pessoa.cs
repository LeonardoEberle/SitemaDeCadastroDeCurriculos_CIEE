using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiCurriculos.Models;

[Table("Pessoa")]
public class Pessoa
{
    [Key]
    [Column("pes_id")]
    public int Id { get; set; }

    [Required]
    [Column("pes_nome")]
    [MaxLength(255)]
    public string Nome { get; set; } = string.Empty;

    [Column("pes_nascimento", TypeName = "date")]
    public DateTime? Nascimento { get; set; }

    [Column("pes_telefone")]
    [MaxLength(20)]
    public string? Telefone { get; set; }

    [Required]
    [Column("pes_email")]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Column("pes_endereco")]
    [MaxLength(255)]
    public string? Endereco { get; set; }

    [Column("pes_cidade")]
    [MaxLength(100)]
    public string? Cidade { get; set; }

    [Column("pes_estado")]
    [MaxLength(20)]
    public string? Estado { get; set; }

    [Required]
    [Column("pes_nacionalidade")]
    [MaxLength(100)]
    public string Nacionalidade { get; set; } = string.Empty;

    [Column("pes_data_inscricao")]
    public DateTimeOffset DataInscricao { get; set; }

    [Required]
    [Column("pes_cargo_interesse")]
    [MaxLength(100)]
    public string CargoInteresse { get; set; } = string.Empty;

    [Column("pes_resumo_profissional", TypeName = "varchar(MAX)")]
    public string? ResumoProfissional { get; set; }

    public ICollection<Habilidade> Habilidades { get; set; } = new List<Habilidade>();
    public ICollection<ExperienciaProfissional> ExperienciasProfissionais { get; set; } = new List<ExperienciaProfissional>();
    public ICollection<Graduacao> Graduacoes { get; set; } = new List<Graduacao>();
}
