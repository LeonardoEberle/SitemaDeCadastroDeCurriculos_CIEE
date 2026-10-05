using System.ComponentModel.DataAnnotations;

namespace ApiCurriculos.DTOs;

public class GraduacaoCreateDto
{
    [MaxLength(255)]
    public string? Nome { get; set; }
    public DateTime? DataInicio { get; set; }
    public DateTime? DataFim { get; set; }
    [MaxLength(255)]
    public string? Instituicao { get; set; }
}

public class GraduacaoReadDto
{
    public int Id { get; set; }
    public string? Nome { get; set; }
    public DateTime? DataInicio { get; set; }
    public DateTime? DataFim { get; set; }
    public string? Instituicao { get; set; }
    public int PessoaId { get; set; }
}
