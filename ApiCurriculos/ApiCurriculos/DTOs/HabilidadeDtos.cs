using System.ComponentModel.DataAnnotations;

namespace ApiCurriculos.DTOs;

public class HabilidadeCreateDto
{
    [MaxLength(255)]
    public string? Nome { get; set; }
}

public class HabilidadeReadDto
{
    public int Id { get; set; }
    public string? Nome { get; set; }
    public int PessoaId { get; set; }
}
