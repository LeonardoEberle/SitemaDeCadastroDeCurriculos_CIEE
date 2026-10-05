using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiCurriculos.Models;

[Table("Experiencias_profissionais")]
public class ExperienciaProfissional
{
    [Key]
    [Column("exp_id")]
    public int Id { get; set; }

    [Column("exp_pes_id")]
    public int PessoaId { get; set; }

    [Column("exp_cargo")]
    [MaxLength(255)]
    public string? Cargo { get; set; }

    [Column("exp_descricao", TypeName = "varchar(MAX)")]
    public string? Descricao { get; set; }

    [Column("exp_data_inicio", TypeName = "date")]
    public DateTime? DataInicio { get; set; }

    [Column("exp_data_fim", TypeName = "date")]
    public DateTime? DataFim { get; set; }

    [ForeignKey(nameof(PessoaId))]
    public Pessoa? Pessoa { get; set; }
}
