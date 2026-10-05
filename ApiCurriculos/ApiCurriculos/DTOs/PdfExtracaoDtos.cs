namespace ApiCurriculos.DTOs;

public class PdfExtracaoResultDto
{
    public bool Sucesso { get; set; }
    public string Mensagem { get; set; } = string.Empty;
    public string? NomeCompleto { get; set; }
    public string? Email { get; set; }
    public string? Telefone { get; set; }
    public string? CargoInteresse { get; set; }
    public string? ResumoProfissional { get; set; }
    public List<string> Habilidades { get; set; } = new();
    public string TextoExtraido { get; set; } = string.Empty;
}
