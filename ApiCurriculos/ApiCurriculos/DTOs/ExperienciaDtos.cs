using System.ComponentModel.DataAnnotations;

namespace ApiCurriculos.DTOs;

public class ExperienciaCreateDto
{
    [MaxLength(255)]
    public string? Cargo { get; set; }
    public string? Descricao { get; set; }
    public DateTime? DataInicio { get; set; }
    public DateTime? DataFim { get; set; }
}

public class ExperienciaReadDto
{
    public int Id { get; set; }
    public string? Cargo { get; set; }
    public string? Descricao { get; set; }
    public DateTime? DataInicio { get; set; }
    public DateTime? DataFim { get; set; }
    public int PessoaId { get; set; }
}
