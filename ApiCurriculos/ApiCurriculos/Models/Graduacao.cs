using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiCurriculos.Models;

[Table("Graduacao")]
public class Graduacao
{
    [Key]
    [Column("gra_id")]
    public int Id { get; set; }

    [Column("gra_pes_id")]
    public int PessoaId { get; set; }

    [Column("gra_nome")]
    [MaxLength(255)]
    public string? Nome { get; set; }

    [Column("gra_data_inicio", TypeName = "date")]
    public DateTime? DataInicio { get; set; }

    [Column("gra_data_fim", TypeName = "date")]
    public DateTime? DataFim { get; set; }

    [Column("gra_instituicao")]
    [MaxLength(255)]
    public string? Instituicao { get; set; }

    [ForeignKey(nameof(PessoaId))]
    public Pessoa? Pessoa { get; set; }
}
