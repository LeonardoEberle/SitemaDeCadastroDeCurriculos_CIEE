using System.ComponentModel.DataAnnotations;

namespace ApiCurriculos.DTOs;

public class PessoaCreateDto
{
    [Required(ErrorMessage = "Nome completo é obrigatório")]
    [MaxLength(255)]
    public string Nome { get; set; } = string.Empty;

    public DateTime? Nascimento { get; set; }

    [MaxLength(20)]
    public string? Telefone { get; set; }

    [Required(ErrorMessage = "E-mail é obrigatório")]
    [EmailAddress(ErrorMessage = "Formato de e-mail inválido")]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Endereco { get; set; }

    [MaxLength(100)]
    public string? Cidade { get; set; }

    [MaxLength(20)]
    public string? Estado { get; set; }

    [Required(ErrorMessage = "Nacionalidade é obrigatória")]
    [MaxLength(100)]
    public string Nacionalidade { get; set; } = string.Empty;

    [Required(ErrorMessage = "Cargo de interesse é obrigatório")]
    [MaxLength(100)]
    public string CargoInteresse { get; set; } = string.Empty;

    public string? ResumoProfissional { get; set; }

    public ICollection<HabilidadeCreateDto>? Habilidades { get; set; }
    public ICollection<ExperienciaCreateDto>? ExperienciasProfissionais { get; set; }
    public ICollection<GraduacaoCreateDto>? Graduacoes { get; set; }
}

public class PessoaUpdateDto
{
    [Required(ErrorMessage = "Nome completo é obrigatório")]
    [MaxLength(255)]
    public string Nome { get; set; } = string.Empty;

    public DateTime? Nascimento { get; set; }

    [MaxLength(20)]
    public string? Telefone { get; set; }

    [Required(ErrorMessage = "E-mail é obrigatório")]
    [EmailAddress(ErrorMessage = "Formato de e-mail inválido")]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Endereco { get; set; }

    [MaxLength(100)]
    public string? Cidade { get; set; }

    [MaxLength(20)]
    public string? Estado { get; set; }

    [Required(ErrorMessage = "Nacionalidade é obrigatória")]
    [MaxLength(100)]
    public string Nacionalidade { get; set; } = string.Empty;

    [Required(ErrorMessage = "Cargo de interesse é obrigatório")]
    [MaxLength(100)]
    public string CargoInteresse { get; set; } = string.Empty;

    public string? ResumoProfissional { get; set; }
}

public class PessoaReadDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public DateTime? Nascimento { get; set; }
    public string? Telefone { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Endereco { get; set; }
    public string? Cidade { get; set; }
    public string? Estado { get; set; }
    public string Nacionalidade { get; set; } = string.Empty;
    public DateTimeOffset DataInscricao { get; set; }
    public string CargoInteresse { get; set; } = string.Empty;
    public string? ResumoProfissional { get; set; }

    public ICollection<HabilidadeReadDto> Habilidades { get; set; } = new List<HabilidadeReadDto>();
    public ICollection<ExperienciaReadDto> ExperienciasProfissionais { get; set; } = new List<ExperienciaReadDto>();
    public ICollection<GraduacaoReadDto> Graduacoes { get; set; } = new List<GraduacaoReadDto>();
}

public class PessoaListDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefone { get; set; }
    public string CargoInteresse { get; set; } = string.Empty;
    public DateTimeOffset DataInscricao { get; set; }
}
