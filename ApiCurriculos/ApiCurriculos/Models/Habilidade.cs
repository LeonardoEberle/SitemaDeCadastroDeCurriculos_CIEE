using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApiCurriculos.Models;

[Table("Habilidade")]
public class Habilidade
{
    [Key]
    [Column("hab_id")]
    public int Id { get; set; }

    [Column("hab_pes_id")]
    public int PessoaId { get; set; }

    [Column("hab_nome")]
    [MaxLength(255)]
    public string? Nome { get; set; }

    [ForeignKey(nameof(PessoaId))]
    public Pessoa? Pessoa { get; set; }
}
