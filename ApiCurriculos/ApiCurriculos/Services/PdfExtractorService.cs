using System.Text;
using System.Text.RegularExpressions;
using ApiCurriculos.DTOs;

namespace ApiCurriculos.Services;

public partial class PdfExtractorService : IPdfExtractorService
{
    public async Task<PdfExtracaoResultDto> ExtrairDadosAsync(Stream pdfStream, CancellationToken ct = default)
    {
        var resultado = new PdfExtracaoResultDto { Sucesso = false };

        try
        {
            using var ms = new MemoryStream();
            await pdfStream.CopyToAsync(ms, ct);
            var bytes = ms.ToArray();

            var texto = ExtrairTextoSimples(bytes);

            if (string.IsNullOrWhiteSpace(texto))
            {
                resultado.Sucesso = true;
                resultado.Mensagem = "Não foi possível extrair os dados do PDF automaticamente. Preencha os dados manualmente.";
                return resultado;
            }

            resultado.TextoExtraido = texto;
            resultado.Sucesso = true;
            resultado.Mensagem = "Extração concluída. Revise e corrija os campos se necessário antes de salvar.";

            resultado.Email = ExtrairEmail(texto);
            resultado.Telefone = ExtrairTelefone(texto);
            resultado.NomeCompleto = ExtrairNome(texto, resultado.Email);
            resultado.CargoInteresse = ExtrairCargo(texto);
            resultado.ResumoProfissional = ExtrairResumo(texto);
            resultado.Habilidades = ExtrairHabilidades(texto);
        }
        catch (Exception ex)
        {
            resultado.Sucesso = true;
            resultado.Mensagem = $"Falha na leitura do PDF ({ex.Message}). O cadastro manual continua disponível.";
        }

        return resultado;
    }

    private static string ExtrairTextoSimples(byte[] bytes)
    {
        try
        {
            var texto = Encoding.UTF8.GetString(bytes);
            var matches = TextoEntreParenteses().Matches(texto);
            if (matches.Count > 0)
            {
                var sb = new StringBuilder();
                foreach (Match m in matches)
                {
                    sb.Append(' ').Append(m.Groups[1].Value);
                }
                texto = sb.ToString();
            }
            else
            {
                texto = Encoding.ASCII.GetString(bytes);
            }

            texto = LimpaCaracteresPdf().Replace(texto, " ");
            texto = EspacosDuplicados().Replace(texto, " ").Trim();
            return texto;
        }
        catch
        {
            return string.Empty;
        }
    }

    private static string? ExtrairEmail(string texto)
    {
        var match = EmailRegex().Match(texto);
        return match.Success ? match.Value.Trim() : null;
    }

    private static string? ExtrairTelefone(string texto)
    {
        var match = TelefoneRegex().Match(texto);
        if (!match.Success) return null;

        var d = new string(match.Value.Where(char.IsDigit).ToArray());
        if (d.Length is < 10 or > 11) return match.Value.Trim();
        return d.Length == 11
            ? $"({d[..2]}) {d[2..7]}-{d[7..]}"
            : $"({d[..2]}) {d[2..6]}-{d[6..]}";
    }

    private static string? ExtrairNome(string texto, string? email)
    {
        var linhas = texto.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var linha in linhas.Take(8))
        {
            if (linha.Length is > 2 and < 120
                && NomeValidoRegex().IsMatch(linha)
                && !EmailRegex().IsMatch(linha)
                && !TelefoneRegex().IsMatch(linha))
            {
                return linha.Trim();
            }
        }

        if (!string.IsNullOrEmpty(email))
        {
            var local = email.Split('@')[0].Replace('.', ' ').Replace('_', ' ').Replace('-', ' ');
            if (local.Length > 2)
                return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(local);
        }

        return linhas.FirstOrDefault(l => l.Length > 2 && l.Length < 120);
    }

    private static string? ExtrairCargo(string texto)
    {
        string[] padroes =
        [
            @"Cargo\s*(?:de)?\s*[Ii]nteresse\s*[:\-]\s*(.+)",
            @"Objetivo\s*[:\-]\s*(.+)",
            @"Área\s*(?:de)?\s*[Ii]nteresse\s*[:\-]\s*(.+)",
            @"Pretensão\s*[:\-]\s*(.+)",
            @"[Pp]retende\s*[aA]tuar\s*[Cc]omo\s*[:\-]?\s*(.+)"
        ];

        foreach (var p in padroes)
        {
            var m = Regex.Match(texto, p, RegexOptions.IgnoreCase);
            if (!m.Success) continue;
            var v = m.Groups[1].Value.Trim().Split('\r', '\n')[0].Trim();
            if (v.Length < 150) return v;
        }
        return null;
    }

    private static string? ExtrairResumo(string texto)
    {
        string[] padroes =
        [
            @"Resumo\s*(?:Profissional)?\s*[:\-]\s*((?:.|\n){50,1500}?)(?=\n\n|\n[A-ZÀ-Ú][A-Za-zÀ-ú\s]{3,50}\s*[:\-]|\z)",
            @"Perfil\s*(?:Profissional)?\s*[:\-]\s*((?:.|\n){50,1500}?)(?=\n\n|\n[A-ZÀ-Ú][A-Za-zÀ-ú\s]{3,50}\s*[:\-]|\z)",
            @"Sobre\s*(?:[Mm]im)?\s*[:\-]\s*((?:.|\n){50,1500}?)(?=\n\n|\n[A-ZÀ-Ú][A-Za-zÀ-ú\s]{3,50}\s*[:\-]|\z)"
        ];

        foreach (var p in padroes)
        {
            var m = Regex.Match(texto, p, RegexOptions.IgnoreCase);
            if (!m.Success) continue;
            var v = EspacosDuplicados().Replace(m.Groups[1].Value, " ").Trim();
            if (v.Length > 40) return v;
        }
        return null;
    }

    private static List<string> ExtrairHabilidades(string texto)
    {
        var resultado = new List<string>();
        var m = Regex.Match(texto,
            @"(?:Habilidades|Competências|Conhecimentos|Tecnologias|Skills|Ferramentas)\s*[:\-]\s*((?:.|\n){10,1500}?)(?=\n\n|\n[A-ZÀ-Ú][A-Za-zÀ-ú\s]{3,50}\s*[:\-]|\z)",
            RegexOptions.IgnoreCase);

        if (!m.Success) return resultado;

        char[] separadores = ['\n', ',', ';', '•', '-', '|', '★', '✓', '●', '○'];
        var itens = m.Groups[1].Value
            .Split(separadores, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(x => x.Trim('.', ' '))
            .Where(x => x.Length is > 1 and < 80);

        foreach (var i in itens.Take(15))
        {
            if (!resultado.Contains(i)) resultado.Add(i);
        }
        return resultado;
    }

    [GeneratedRegex(@"\(([^\)]{2,200})\)")]
    private static partial Regex TextoEntreParenteses();

    [GeneratedRegex(@"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")]
    private static partial Regex LimpaCaracteresPdf();

    [GeneratedRegex(@"\s{2,}")]
    private static partial Regex EspacosDuplicados();

    [GeneratedRegex(@"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")]
    private static partial Regex EmailRegex();

    [GeneratedRegex(@"(?:\+?\d{1,3}\s?)?\(?\d{2}\)?\s?\d{4,5}-?\d{4}")]
    private static partial Regex TelefoneRegex();

    [GeneratedRegex(@"^[A-ZÀ-Ú][A-Za-zÀ-ú\s'.-]+$")]
    private static partial Regex NomeValidoRegex();
}
