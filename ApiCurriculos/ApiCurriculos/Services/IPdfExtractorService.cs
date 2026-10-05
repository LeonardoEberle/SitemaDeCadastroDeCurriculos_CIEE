using ApiCurriculos.DTOs;

namespace ApiCurriculos.Services;

public interface IPdfExtractorService
{
    Task<PdfExtracaoResultDto> ExtrairDadosAsync(Stream pdfStream, CancellationToken ct = default);
}
