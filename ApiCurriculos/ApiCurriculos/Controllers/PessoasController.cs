using ApiCurriculos.Data;
using ApiCurriculos.DTOs;
using ApiCurriculos.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiCurriculos.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PessoasController : ControllerBase
{
    private readonly AppDbContext _db;

    public PessoasController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [ProducesResponseType<IEnumerable<PessoaListDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PessoaListDto>>> Listar(
        [FromQuery] int? take = 50,
        [FromQuery] int? skip = 0,
        [FromQuery] string? busca = null,
        CancellationToken ct = default)
    {
        var query = _db.Pessoas.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(busca))
        {
            query = query.Where(p =>
                p.Nome.Contains(busca) ||
                p.Email.Contains(busca) ||
                p.CargoInteresse.Contains(busca) ||
                p.Cidade!.Contains(busca));
        }

        var total = await query.CountAsync(ct);

        var itens = await query
            .OrderByDescending(p => p.DataInscricao)
            .Skip(skip ?? 0)
            .Take(take ?? 50)
            .Select(p => new PessoaListDto
            {
                Id = p.Id,
                Nome = p.Nome,
                Email = p.Email,
                Telefone = p.Telefone,
                CargoInteresse = p.CargoInteresse,
                DataInscricao = p.DataInscricao
            })
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        return Ok(itens);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType<PessoaReadDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PessoaReadDto>> Detalhes(int id, CancellationToken ct)
    {
        var pessoa = await _db.Pessoas
            .AsNoTracking()
            .Include(p => p.Habilidades)
            .Include(p => p.ExperienciasProfissionais)
            .Include(p => p.Graduacoes)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

        if (pessoa is null) return NotFound(new { Mensagem = "Candidato não encontrado" });

        return Ok(MapParaDetalhes(pessoa));
    }

    [HttpPost]
    [ProducesResponseType<PessoaReadDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PessoaReadDto>> Cadastrar(
        [FromBody] PessoaCreateDto dto,
        CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (await _db.Pessoas.AnyAsync(p => p.Email == dto.Email, ct))
        {
            ModelState.AddModelError(nameof(dto.Email), "Este e-mail já está cadastrado.");
            return Conflict(ModelState);
        }

        var pessoa = new Pessoa
        {
            Nome = dto.Nome.Trim(),
            Nascimento = dto.Nascimento,
            Telefone = dto.Telefone?.Trim(),
            Email = dto.Email.Trim().ToLowerInvariant(),
            Endereco = dto.Endereco?.Trim(),
            Cidade = dto.Cidade?.Trim(),
            Estado = dto.Estado?.Trim(),
            Nacionalidade = dto.Nacionalidade.Trim(),
            CargoInteresse = dto.CargoInteresse.Trim(),
            ResumoProfissional = dto.ResumoProfissional?.Trim(),
            Habilidades = dto.Habilidades?
                .Where(h => !string.IsNullOrWhiteSpace(h.Nome))
                .Select(h => new Habilidade { Nome = h.Nome!.Trim() })
                .ToList() ?? new List<Habilidade>(),
            ExperienciasProfissionais = dto.ExperienciasProfissionais?
                .Select(e => new ExperienciaProfissional
                {
                    Cargo = e.Cargo?.Trim(),
                    Descricao = e.Descricao?.Trim(),
                    DataInicio = e.DataInicio,
                    DataFim = e.DataFim
                })
                .Where(e => !string.IsNullOrWhiteSpace(e.Cargo) || e.DataInicio.HasValue)
                .ToList() ?? new List<ExperienciaProfissional>(),
            Graduacoes = dto.Graduacoes?
                .Select(g => new Graduacao
                {
                    Nome = g.Nome?.Trim(),
                    Instituicao = g.Instituicao?.Trim(),
                    DataInicio = g.DataInicio,
                    DataFim = g.DataFim
                })
                .Where(g => !string.IsNullOrWhiteSpace(g.Nome))
                .ToList() ?? new List<Graduacao>()
        };

        _db.Pessoas.Add(pessoa);
        await _db.SaveChangesAsync(ct);

        var cadastrado = await _db.Pessoas
            .AsNoTracking()
            .Include(p => p.Habilidades)
            .Include(p => p.ExperienciasProfissionais)
            .Include(p => p.Graduacoes)
            .FirstAsync(p => p.Id == pessoa.Id, ct);

        return CreatedAtAction(nameof(Detalhes),
            new { id = pessoa.Id },
            new { Mensagem = "Cadastro salvo com sucesso!", Dados = MapParaDetalhes(cadastrado) });
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType<PessoaReadDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PessoaReadDto>> Atualizar(
        int id,
        [FromBody] PessoaUpdateDto dto,
        CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var pessoa = await _db.Pessoas.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (pessoa is null) return NotFound(new { Mensagem = "Candidato não encontrado" });

        if (dto.Email.Trim().ToLowerInvariant() != pessoa.Email &&
            await _db.Pessoas.AnyAsync(p => p.Email == dto.Email && p.Id != id, ct))
        {
            ModelState.AddModelError(nameof(dto.Email), "Este e-mail já está cadastrado.");
            return Conflict(ModelState);
        }

        pessoa.Nome = dto.Nome.Trim();
        pessoa.Nascimento = dto.Nascimento;
        pessoa.Telefone = dto.Telefone?.Trim();
        pessoa.Email = dto.Email.Trim().ToLowerInvariant();
        pessoa.Endereco = dto.Endereco?.Trim();
        pessoa.Cidade = dto.Cidade?.Trim();
        pessoa.Estado = dto.Estado?.Trim();
        pessoa.Nacionalidade = dto.Nacionalidade.Trim();
        pessoa.CargoInteresse = dto.CargoInteresse.Trim();
        pessoa.ResumoProfissional = dto.ResumoProfissional?.Trim();

        await _db.SaveChangesAsync(ct);

        return Ok(new { Mensagem = "Atualizado com sucesso!", Id = pessoa.Id });
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Excluir(int id, CancellationToken ct)
    {
        var pessoa = await _db.Pessoas.FindAsync(new object?[] { id }, ct);
        if (pessoa is null) return NotFound(new { Mensagem = "Candidato não encontrado" });

        _db.Pessoas.Remove(pessoa);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    private static PessoaReadDto MapParaDetalhes(Pessoa p)
    {
        return new PessoaReadDto
        {
            Id = p.Id,
            Nome = p.Nome,
            Nascimento = p.Nascimento,
            Telefone = p.Telefone,
            Email = p.Email,
            Endereco = p.Endereco,
            Cidade = p.Cidade,
            Estado = p.Estado,
            Nacionalidade = p.Nacionalidade,
            DataInscricao = p.DataInscricao,
            CargoInteresse = p.CargoInteresse,
            ResumoProfissional = p.ResumoProfissional,
            Habilidades = p.Habilidades.Select(h => new HabilidadeReadDto
            {
                Id = h.Id,
                Nome = h.Nome,
                PessoaId = h.PessoaId
            }).ToList(),
            ExperienciasProfissionais = p.ExperienciasProfissionais.Select(e => new ExperienciaReadDto
            {
                Id = e.Id,
                Cargo = e.Cargo,
                Descricao = e.Descricao,
                DataInicio = e.DataInicio,
                DataFim = e.DataFim,
                PessoaId = e.PessoaId
            }).ToList(),
            Graduacoes = p.Graduacoes.Select(g => new GraduacaoReadDto
            {
                Id = g.Id,
                Nome = g.Nome,
                DataInicio = g.DataInicio,
                DataFim = g.DataFim,
                Instituicao = g.Instituicao,
                PessoaId = g.PessoaId
            }).ToList()
        };
    }
}
