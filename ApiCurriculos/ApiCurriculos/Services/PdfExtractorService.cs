using System.IO.Compression;
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

            var texto = ExtrairTextoPdf(bytes);

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

    private static string ExtrairTextoPdf(byte[] bytes)
    {
        try
        {
            var sb = new StringBuilder();

            ExtrairTextoDeBruto(bytes, sb);

            ExtrairTextoDeStreamsFlate(bytes, sb);

            var texto = sb.ToString();
            texto = LimpaCaracteresPdf().Replace(texto, " ");
            texto = EspacosDuplicados().Replace(texto, " ").Trim();
            return texto;
        }
        catch
        {
            return string.Empty;
        }
    }

    private static void ExtrairTextoDeBruto(byte[] bytes, StringBuilder sb)
    {
        try
        {
            var bruto = Encoding.UTF8.GetString(bytes);
            ExtrairFragmentosTexto(bruto, sb);
        }
        catch
        {
            // ignora
        }
    }

    private static void ExtrairTextoDeStreamsFlate(byte[] bytes, StringBuilder sb)
    {
        try
        {
            var strBytes = Encoding.ASCII.GetString(bytes);

            var matchesStream = StreamCompridoRegex().Matches(strBytes);
            foreach (Match m in matchesStream)
            {
                var idxHeader = m.Index + m.Length;
                var streamStart = idxHeader;
                while (streamStart < bytes.Length && (bytes[streamStart] == 0x0A || bytes[streamStart] == 0x0D))
                    streamStart++;

                var endStreamTag = "endstream";
                var endIdx = strBytes.IndexOf(endStreamTag, idxHeader, StringComparison.Ordinal);
                if (endIdx < 0) continue;

                var streamEnd = endIdx;
                while (streamEnd > streamStart && (bytes[streamEnd - 1] == 0x0A || bytes[streamEnd - 1] == 0x0D || bytes[streamEnd - 1] == 0x20))
                    streamEnd--;

                var comprLen = streamEnd - streamStart;
                if (comprLen <= 4) continue;

                try
                {
                    using var ms = new MemoryStream(bytes, (int)streamStart, comprLen);
                    using var deflate = new DeflateStream(ms, CompressionMode.Decompress);
                    using var sr = new StreamReader(deflate, Encoding.UTF8);
                    var descompactado = sr.ReadToEnd();
                    ExtrairFragmentosTexto(descompactado, sb);
                    continue;
                }
                catch (InvalidDataException)
                {
                    // zlib tem 2 bytes de header antes do deflate. Pular os 2 primeiros bytes.
                    try
                    {
                        if (comprLen > 6)
                        {
                            using var ms2 = new MemoryStream(bytes, (int)streamStart + 2, comprLen - 2);
                            using var deflate2 = new DeflateStream(ms2, CompressionMode.Decompress);
                            using var sr2 = new StreamReader(deflate2, Encoding.UTF8);
                            var descompactado2 = sr2.ReadToEnd();
                            ExtrairFragmentosTexto(descompactado2, sb);
                            continue;
                        }
                    }
                    catch
                    {
                        // continua tentando ASCII
                    }
                }
                catch
                {
                    // ignora esse stream
                }

                try
                {
                    var literal = Encoding.ASCII.GetString(bytes, (int)streamStart, Math.Min(comprLen, 50000));
                    ExtrairFragmentosTexto(literal, sb);
                }
                catch
                {
                    // ignora
                }
            }
        }
        catch
        {
            // ignora
        }
    }

    private static void ExtrairFragmentosTexto(string conteudo, StringBuilder sb)
    {
        if (string.IsNullOrWhiteSpace(conteudo)) return;

        var literal = TextoEntreParenteses().Matches(conteudo);
        if (literal.Count > 0)
        {
            foreach (Match m in literal)
            {
                var limpo = PdfOctalUnescape().Replace(m.Groups[1].Value, me =>
                {
                    var code = Convert.ToInt32(me.Groups[1].Value, 8);
                    return code <= 255 ? ((char)code).ToString() : me.Value;
                });
                limpo = PdfHexUnescape().Replace(limpo, me =>
                {
                    if (me.Groups[1].Length % 2 == 0)
                    {
                        try
                        {
                            var raw = Convert.FromHexString(me.Groups[1].Value);
                            return Encoding.UTF8.GetString(raw);
                        }
                        catch { }
                    }
                    return me.Value;
                });
                sb.Append(' ').Append(limpo);
            }
        }

        var hex = HexEntreColchetes().Matches(conteudo);
        foreach (Match m in hex)
        {
            var h = m.Groups[1].Value;
            if (h.Length < 2 || h.Length % 2 != 0) continue;
            try
            {
                var raw = Convert.FromHexString(h);
                var decodificado = (h.Length >= 4 && raw[0] == 0xFE && raw[1] == 0xFF)
                    ? Encoding.BigEndianUnicode.GetString(raw)
                    : Encoding.UTF8.GetString(raw);
                sb.Append(' ').Append(decodificado);
            }
            catch
            {
                // ignora
            }
        }

        if (literal.Count == 0 && hex.Count == 0)
        {
            sb.Append(' ').Append(conteudo);
        }

        var quebras = OperadorQuebraLinha().Matches(conteudo).Count;
        if (quebras > 0) sb.Append(' ').Append('\n', Math.Min(quebras, 3));
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
        var palavrasEmail = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrEmpty(email))
        {
            var local = email.Split('@')[0];
            foreach (var p in local.Split(new[] { '.', '_', '-', '+' }, StringSplitOptions.RemoveEmptyEntries))
            {
                if (p.Length >= 3) palavrasEmail.Add(p);
            }
        }

        var tokens = TokenosCandidatosNome().Split(texto)
            .Select(s => s.Trim())
            .Where(s => s.Length is > 2 and < 80)
            .ToList();

        foreach (var tk in tokens.Take(40))
        {
            if (NomeValidoRegex().IsMatch(tk)
                && !EmailRegex().IsMatch(tk)
                && !TelefoneRegex().IsMatch(tk)
                && !tk.Contains('@')
                && !tk.Contains('/')
                && !tk.Contains("http", StringComparison.OrdinalIgnoreCase)
                && !tk.Contains("www.", StringComparison.OrdinalIgnoreCase)
                && !tk.Contains(".com", StringComparison.OrdinalIgnoreCase)
                && !tk.Contains(".br", StringComparison.OrdinalIgnoreCase)
                && !tk.Contains("linkedin", StringComparison.OrdinalIgnoreCase)
                && !tk.Contains("github", StringComparison.OrdinalIgnoreCase))
            {
                if (palavrasEmail.Count == 0) return tk;
                var palavras = tk.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                if (palavras.Length >= 2 && palavras.Any(p => palavrasEmail.Contains(p))) return tk;
            }
        }

        if (palavrasEmail.Count > 0 && !string.IsNullOrEmpty(email))
        {
            var local = email.Split('@')[0].Replace('.', ' ').Replace('_', ' ').Replace('-', ' ');
            if (local.Length > 2)
                return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(local);
        }

        return tokens.FirstOrDefault();
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
            @"Resumo\s*(?:Profissional)?\s*[:\-]?\s*((?:.|\n){50,2000}?)(?=\n\n|\n[A-ZÀ-Ú][A-Za-zÀ-ú\s]{3,50}\s*[:\-]|\z)",
            @"Perfil\s*(?:Profissional)?\s*[:\-]?\s*((?:.|\n){50,2000}?)(?=\n\n|\n[A-ZÀ-Ú][A-Za-zÀ-ú\s]{3,50}\s*[:\-]|\z)",
            @"Sobre\s*(?:[Mm]im)\s*[:\-]?\s*((?:.|\n){50,2000}?)(?=\n\n|\n[A-ZÀ-Ú][A-Za-zÀ-ú\s]{3,50}\s*[:\-]|\z)",
            @"Apresenta(?:ç|c)(?:ã|a)o\s*(?:pessoal|profissional)?\s*[:\-]?\s*((?:.|\n){50,2000}?)(?=\n\n|\n[A-ZÀ-Ú][A-Za-zÀ-ú\s]{3,50}\s*[:\-]|\z)"
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

        string[] padroesSecao =
        [
            @"(?:Habilidades(?:\s+(?:T(?:é|e)cnicas|Tecnologias))?|Compet(?:ê|e)ncias(?:\s+Principais)?|Principais\s+compet(?:ê|e)ncias|Conhecimentos|Tecnologias|Skills|Ferramentas|Certifica(?:ç|c)(?:õ|o)es|Experi(?:ê|e)ncia\s+Profissional|Forma(?:ç|c)(?:ã|a)o|Educa(?:ç|c)(?:ã|a)o)\s*[:\-]?\s*((?:.|\n){30,3000}?)(?=\n\n|\n[A-ZÀ-Ú][A-Za-zÀ-ú\s]{3,60}\s*[:\-]|\z)",
        ];

        MatchCollection? matches = null;
        foreach (var p in padroesSecao)
        {
            var ms = Regex.Matches(texto, p, RegexOptions.IgnoreCase);
            if (ms.Count == 0) continue;
            matches = ms;
            break;
        }

        if (matches is null || matches.Count == 0) return resultado;

        char[] separadores = ['\n', '\r', ',', ';', '•', '-', '|', '★', '✓', '●', '○', '◆', '◇', '▪', '▫'];

        foreach (Match m in matches)
        {
            var bloco = m.Groups[1].Value;
            var itens = bloco
                .Split(separadores, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(x => x.Trim('.', ' ', ':', '–'))
                .Where(x => x.Length is > 1 and < 100
                    && !PalavraRuimHabilidadeRegex().IsMatch(x)
                    && !EmailRegex().IsMatch(x)
                    && !TelefoneRegex().IsMatch(x)
                    && !x.Contains("http", StringComparison.OrdinalIgnoreCase)
                    && !x.Contains("@"));

            foreach (var i in itens)
            {
                var chave = i.ToLowerInvariant();
                if (!resultado.Any(r => r.ToLowerInvariant() == chave) && resultado.Count < 20)
                    resultado.Add(i);
            }
        }

        return resultado;
    }

    [GeneratedRegex(@"\(([^\)]{2,300})\)")]
    private static partial Regex TextoEntreParenteses();

    [GeneratedRegex(@"<<\s*\/Filter\s*\/FlateDecode[^>]*>>\s*stream", RegexOptions.Singleline)]
    private static partial Regex StreamCompridoRegex();

    [GeneratedRegex(@"\\([0-7]{1,3})")]
    private static partial Regex PdfOctalUnescape();

    [GeneratedRegex(@"\\x([0-9a-fA-F]{2,4})")]
    private static partial Regex PdfHexUnescape();

    [GeneratedRegex(@"<([0-9a-fA-F]+)>")]
    private static partial Regex HexEntreColchetes();

    [GeneratedRegex(@"(?:^|\s)(?:T\*|Tj|TJ|ET|Td\s+[-]?\d+\s+[-]?\d+|Tm\s+[-]?\d+(?:\.\d+)?\s+[-]?\d+(?:\.\d+)?)")]
    private static partial Regex OperadorQuebraLinha();

    [GeneratedRegex(@"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")]
    private static partial Regex LimpaCaracteresPdf();

    [GeneratedRegex(@"\s{2,}")]
    private static partial Regex EspacosDuplicados();

    [GeneratedRegex(@"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")]
    private static partial Regex EmailRegex();

    [GeneratedRegex(@"(?:\+?\d{1,3}\s?)?\(?\d{2}\)?[\s\.-]?\d{4,5}[\s\.-]?\d{4}")]
    private static partial Regex TelefoneRegex();

    [GeneratedRegex(@"^[A-ZÀ-Ú][A-Za-zÀ-ú\s'’´`.-]+$")]
    private static partial Regex NomeValidoRegex();

    [GeneratedRegex(@"(?:Contato|Curriculum|Currículo|Curriculo|Resumo|Cargo|Compet(?:ê|e)ncias|Principais|Objetivo|Área|Forma(?:ç|c)(?:ã|a)o|Educa(?:ç|c)(?:ã|a)o|Perfil|Sobre|Telemóvel|Telefone|Email|Endereço|Nacionalidade|Nascimento|Data|Empresa|Nome|Cidade|Estado|País|Brasil|Paraná|Curitiba|São Paulo|Rio de Janeiro|Salvador|Belo Horizonte|Porto Alegre|Recife|Fortaleza|Brasília|Manaus|Goiânia|Belém|Curso|Institui(?:ç|c)(?:ã|a)o|Conhecimento|Gradua(?:ç|c)(?:ã|a)o|T(?:é|e)cnico|Superior|Universidade|Faculdade)", RegexOptions.IgnoreCase)]
    private static partial Regex PalavraRuimHabilidadeRegex();

    [GeneratedRegex(@"(?:\r?\n|\t| {3,}|\s{2,}(?:\.\s|•\s))")]
    private static partial Regex TokenosCandidatosNome();
}
