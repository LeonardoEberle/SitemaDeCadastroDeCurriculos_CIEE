using ApiCurriculos.DTOs;
using ApiCurriculos.Services;
using Microsoft.AspNetCore.Mvc;

namespace ApiCurriculos.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PdfController : ControllerBase
{
    private const long TamanhoMaximoPermitido = 5 * 1024 * 1024; // 5 MB
    private readonly IPdfExtractorService _extrator;

    public PdfController(IPdfExtractorService extrator)
    {
        _extrator = extrator;
    }

    [HttpPost("extrair")]
    [ProducesResponseType<PdfExtracaoResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PdfExtracaoResultDto>> ExtrairDados(
        IFormFile? arquivo,
        CancellationToken ct)
    {
        if (arquivo is null || arquivo.Length == 0)
        {
            return BadRequest(new PdfExtracaoResultDto
            {
                Sucesso = false,
                Mensagem = "Nenhum arquivo foi enviado."
            });
        }

        var extensao = Path.GetExtension(arquivo.FileName)?.ToLowerInvariant();
        if (extensao != ".pdf" && !string.Equals(arquivo.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new PdfExtracaoResultDto
            {
                Sucesso = false,
                Mensagem = "Arquivo inválido. Apenas arquivos PDF são aceitos."
            });
        }

        if (arquivo.Length > TamanhoMaximoPermitido)
        {
            return BadRequest(new PdfExtracaoResultDto
            {
                Sucesso = false,
                Mensagem = "Arquivo muito grande. O tamanho máximo permitido é 5 MB."
            });
        }

        try
        {
            using var stream = arquivo.OpenReadStream();
            var resultado = await _extrator.ExtrairDadosAsync(stream, ct);

            if (!resultado.Sucesso)
                return StatusCode(StatusCodes.Status422UnprocessableEntity, resultado);

            return Ok(resultado);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new PdfExtracaoResultDto
            {
                Sucesso = false,
                Mensagem = "Ocorreu uma falha inesperada na leitura do PDF. Você pode preencher os dados manualmente."
            });
        }
    }
}
