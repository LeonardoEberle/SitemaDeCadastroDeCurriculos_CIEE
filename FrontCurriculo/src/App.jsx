import { useEffect, useMemo, useState } from 'react';
import {
  listarPessoas,
  obterPessoa,
  criarPessoa,
  excluirPessoa,
  extrairPdf,
} from './services/api.js';
import './App.css';

const VAGAS = [
  {
    id: 'v1',
    titulo: 'Desenvolvedor(a) Backend Júnior (.NET / C#)',
    empresa: 'CIEE Soluções Tecnológicas',
    local: 'São Paulo, SP (híbrido)',
    tipo: 'CLT — Efetivo',
    faixa: 'R$ 3.200 a R$ 4.200 + benefícios',
    descricao: 'Atuar no desenvolvimento e manutenção de APIs REST com ASP.NET Core, SQL Server e Azure. Oportunidade de aprendizado com arquitetura limpa e boas práticas.',
    requisitos: ['C# / .NET', 'SQL (qualquer banco relacional)', 'Desejável ASP.NET Core', 'Desejável Entity Framework'],
  },
  {
    id: 'v2',
    titulo: 'Desenvolvedor(a) Frontend Júnior (React)',
    empresa: 'CIEE Soluções Tecnológicas',
    local: 'São Paulo, SP (presencial 2x/semana)',
    tipo: 'CLT — Efetivo',
    faixa: 'R$ 3.000 a R$ 4.000 + benefícios',
    descricao: 'Construir interfaces modernas e responsivas em React para os portais internos e externos do CIEE. Integrar com APIs REST e participar de code review.',
    requisitos: ['JavaScript / TypeScript', 'React', 'HTML5 e CSS3', 'Desejável Vite / Next.js'],
  },
  {
    id: 'v3',
    titulo: 'Estágio — Análise de Dados (Power BI / SQL)',
    empresa: 'CIEE Núcleo de BI',
    local: 'São Paulo, SP (híbrido)',
    tipo: 'Estágio obrigatório ou não',
    faixa: 'R$ 1.400 + VR + VT',
    descricao: 'Apoiar na construção de dashboards em Power BI, extração de dados via SQL Server e validação de relatórios gerenciais. Aprendizado com DAX e modelagem dimensional.',
    requisitos: ['Conhecimento básico de SQL', 'Excel avançado', 'Desejável Power BI', 'Curso superior em andamento (Exatas/Computação/Administração)'],
  },
  {
    id: 'v4',
    titulo: 'Analista de QA Júnior (Testes Manuais)',
    empresa: 'CIEE Garantia da Qualidade',
    local: 'São Paulo, SP (remoto)',
    tipo: 'CLT — Efetivo',
    faixa: 'R$ 2.800 a R$ 3.600',
    descricao: 'Planejar, executar e documentar casos de teste manuais nas aplicações web do CIEE. Reportar bugs e acompanhar correções junto ao time de desenvolvimento.',
    requisitos: ['Testes manuais', 'Escrita de casos de teste', 'Ferramenta de gestão de bugs (Jira/Mantis)', 'Desejável Postman'],
  },
  {
    id: 'v5',
    titulo: 'Analista de Suporte Técnico Nível 1',
    empresa: 'CIEE Helpdesk',
    local: 'São Paulo, SP (presencial)',
    tipo: 'CLT — Efetivo',
    faixa: 'R$ 2.200 a R$ 2.800',
    descricao: 'Atender chamados dos funcionários do CIEE via telefone/e-mail: instalação de softwares Office 365, reset de senha AD, troubleshooting de rede e hardware.',
    requisitos: ['Windows 10/11', 'Office 365', 'Noções de Active Directory', 'Boa comunicação'],
  },
];

const emptyForm = () => ({
  nome: '',
  nascimento: '',
  telefone: '',
  email: '',
  endereco: '',
  cidade: '',
  estado: '',
  nacionalidade: '',
  cargoInteresse: '',
  resumoProfissional: '',
  habilidades: [{ nome: '' }],
  experienciasProfissionais: [{ cargo: '', descricao: '', dataInicio: '', dataFim: '' }],
  graduacoes: [{ nome: '', dataInicio: '', dataFim: '', instituicao: '' }],
});

export default function App() {
  const [view, setView] = useState('jobs');
  const [detailId, setDetailId] = useState(null);
  const [vagaSelecionada, setVagaSelecionada] = useState(null);

  if (view === 'form') return (
    <FormView
      vaga={vagaSelecionada}
      onDone={() => { setVagaSelecionada(null); setView('jobs'); }}
    />
  );
  if (view === 'detail') return (
    <DetailView id={detailId} onBack={() => setView('list')} />
  );
  if (view === 'list') return (
    <ListView
      onNew={() => setView('form')}
      onOpen={(id) => { setDetailId(id); setView('detail'); }}
      onBack={() => setView('jobs')}
    />
  );
  return (
    <JobsView
      onApply={(vaga) => { setVagaSelecionada(vaga); setView('form'); }}
      onGoAdmin={() => setView('list')}
    />
  );
}

function Toast({ msg, tipo }) {
  if (!msg) return null;
  return (
    <div className={`toast ${tipo || 'info'}`}>
      <span>{msg}</span>
    </div>
  );
}

function JobsView({ onApply, onGoAdmin }) {
  const [busca, setBusca] = useState('');
  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return VAGAS;
    return VAGAS.filter((v) =>
      [v.titulo, v.empresa, v.local, v.tipo, v.descricao, ...(v.requisitos || [])]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [busca]);

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Portal do Candidato — CIEE</h1>
          <p className="sub">
            Encontre a vaga ideal e candidate-se em minutos. Suas informações serão usadas apenas
            para o processo seletivo.
          </p>
        </div>
        <button className="btn ghost" onClick={onGoAdmin} title="Apenas para validações do desafio">
          🔧 Área administrativa
        </button>
      </header>

      <section className="card">
        <div className="row between">
          <div className="grow">
            <input
              className="input"
              placeholder="Buscar vaga (título, empresa, requisito, cidade...)..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="meta">
          <strong>{filtradas.length}</strong> vaga{filtradas.length === 1 ? '' : 's'} aberta{filtradas.length === 1 ? '' : 's'}.
        </div>

        {filtradas.length === 0 && (
          <div className="empty">Nenhuma vaga encontrada para "{busca}".</div>
        )}

        <ul className="lista">
          {filtradas.map((v) => (
            <li key={v.id} className="item vaga-item">
              <div className="grow">
                <div className="row between wrap">
                  <div className="nome">{v.titulo}</div>
                  <span className="badge">{v.tipo}</span>
                </div>
                <div className="meta2">
                  <strong>{v.empresa}</strong>
                  <span className="sep">•</span>
                  <span>📍 {v.local}</span>
                  <span className="sep">•</span>
                  <span>💰 {v.faixa}</span>
                </div>
                <p className="desc">{v.descricao}</p>
                <div className="tags">
                  {(v.requisitos || []).map((r, i) => (
                    <span key={i} className="tag">{r}</span>
                  ))}
                </div>
              </div>
              <div className="actions">
                <button className="btn primary" onClick={() => onApply(v)}>📝 Quero me candidatar</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="footer">
        Desafio CIEE • Área do Candidato ·{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onGoAdmin(); }} style={{ color: 'inherit' }}>
          Área administrativa (validação)
        </a>
      </footer>
    </div>
  );
}

function ListView({ onNew, onOpen, onBack }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const carregar = async (q = busca) => {
    setLoading(true);
    try {
      const { lista, total } = await listarPessoas({ busca: q });
      setItems(lista);
      setTotal(total);
    } catch (e) {
      setToast({ msg: e.message, tipo: 'erro' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(''); }, []);

  const handleExcluir = async (p) => {
    if (!confirm(`Excluir candidato "${p.nome}"?`)) return;
    try {
      await excluirPessoa(p.id);
      setToast({ msg: 'Candidato excluído.', tipo: 'ok' });
      await carregar(busca);
    } catch (e) {
      setToast({ msg: e.message, tipo: 'erro' });
    }
  };

  return (
    <div className="page">
      <Toast {...(toast || {})} />
      <header className="header">
        <div>
          <h1>🔧 Área administrativa — Candidatos inscritos</h1>
          <p className="sub">Validação e visualização dos cadastros realizados no portal do candidato.</p>
        </div>
        <div className="row gap">
          <button className="btn ghost" onClick={onBack}>← Voltar para vagas</button>
          <button className="btn primary" onClick={onNew}>+ Cadastro manual</button>
        </div>
      </header>

      <section className="card">
        <div className="row between">
          <div className="grow">
            <input
              className="input"
              placeholder="Buscar por nome, e-mail, cargo ou cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && carregar(busca)}
            />
          </div>
          <button className="btn" onClick={() => carregar(busca)}>Buscar</button>
        </div>

        <div className="meta">
          <strong>{total}</strong> candidato{total === 1 ? '' : 's'} encontrado{total === 1 ? '' : 's'}.
          {loading && <span className="ml">carregando...</span>}
        </div>

        {!loading && items.length === 0 && (
          <div className="empty">Nenhum candidato cadastrado ainda. Volte para o portal e candidate-se em uma vaga.</div>
        )}

        <ul className="lista">
          {items.map((p) => (
            <li key={p.id} className="item">
              <div className="grow" onClick={() => onOpen(p.id)} style={{ cursor: 'pointer' }}>
                <div className="nome">{p.nome}</div>
                <div className="meta2">
                  <span>{p.cargoInteresse}</span>
                  <span className="sep">•</span>
                  <span>{p.email}</span>
                  {p.telefone && (<><span className="sep">•</span><span>{p.telefone}</span></>)}
                </div>
              </div>
              <div className="actions">
                <button className="btn small" onClick={() => onOpen(p.id)}>Detalhes</button>
                <button className="btn small danger" onClick={() => handleExcluir(p)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="footer">Desafio CIEE • Backend .NET 10 • Frontend React 19</footer>
    </div>
  );
}

function FormView({ onDone, vaga }) {
  const [form, setForm] = useState(() => ({
    ...emptyForm(),
    cargoInteresse: vaga?.titulo || '',
  }));
  const [erros, setErros] = useState({});
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setArr = (chave, idx, k, v) =>
    setForm((f) => {
      const arr = f[chave].map((it, i) => (i === idx ? { ...it, [k]: v } : it));
      return { ...f, [chave]: arr };
    });

  const addArr = (chave, modelo) =>
    setForm((f) => ({ ...f, [chave]: [...f[chave], { ...modelo }] }));

  const rmArr = (chave, idx) =>
    setForm((f) => {
      if (f[chave].length <= 1) return f;
      return { ...f, [chave]: f[chave].filter((_, i) => i !== idx) };
    });

  const handlePdf = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPdfLoading(true);
    try {
      const r = await extrairPdf(file);
      setToast({ msg: r?.mensagem || 'PDF processado.', tipo: r?.sucesso === false ? 'alerta' : 'ok' });
      setForm((f) => ({
        ...f,
        nome: r?.nomeCompleto || f.nome,
        email: r?.email || f.email,
        telefone: r?.telefone || f.telefone,
        cargoInteresse: r?.cargoInteresse || f.cargoInteresse,
        resumoProfissional: r?.resumoProfissional || f.resumoProfissional,
        habilidades: (r?.habilidades && r.habilidades.length > 0)
          ? r.habilidades.map((n) => ({ nome: n }))
          : f.habilidades,
      }));
    } catch (e) {
      setToast({ msg: e.message, tipo: 'erro' });
    } finally {
      setPdfLoading(false);
    }
  };

  const montarPayload = () => ({
    nome: form.nome.trim() || null,
    nascimento: form.nascimento || null,
    telefone: form.telefone.trim() || null,
    email: form.email.trim() || null,
    endereco: form.endereco.trim() || null,
    cidade: form.cidade.trim() || null,
    estado: form.estado.trim() || null,
    nacionalidade: form.nacionalidade.trim() || null,
    cargoInteresse: form.cargoInteresse.trim() || null,
    resumoProfissional: form.resumoProfissional.trim() || null,
    habilidades: form.habilidades
      .map((h) => ({ nome: h.nome?.trim() || null }))
      .filter((h) => h.nome),
    experienciasProfissionais: form.experienciasProfissionais
      .map((e) => ({
        cargo: e.cargo?.trim() || null,
        descricao: e.descricao?.trim() || null,
        dataInicio: e.dataInicio || null,
        dataFim: e.dataFim || null,
      }))
      .filter((e) => e.cargo || e.descricao || e.dataInicio || e.dataFim),
    graduacoes: form.graduacoes
      .map((g) => ({
        nome: g.nome?.trim() || null,
        dataInicio: g.dataInicio || null,
        dataFim: g.dataFim || null,
        instituicao: g.instituicao?.trim() || null,
      }))
      .filter((g) => g.nome || g.instituicao || g.dataInicio || g.dataFim),
  });

  const salvar = async (e) => {
    e.preventDefault();
    setErros({});
    setLoading(true);
    try {
      const payload = montarPayload();
      const r = await criarPessoa(payload);
      setToast({
        msg: vaga
          ? `Candidatura enviada para "${vaga.titulo}"! Boa sorte no processo 🤞`
          : (r?.mensagem || 'Cadastro salvo com sucesso!'),
        tipo: 'ok',
      });
      setTimeout(onDone, 1400);
    } catch (e) {
      setErros(e.campos || { _geral: e.message });
      setToast({ msg: e.campos?._geral || 'Verifique os campos destacados.', tipo: 'erro' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Toast {...(toast || {})} />
      <header className="header">
        <div>
          <h1>{vaga ? 'Minha Candidatura' : 'Cadastro manual de candidato'}</h1>
          <p className="sub">
            {vaga
              ? 'Preencha seus dados para se candidatar. Campos com * são obrigatórios.'
              : 'Preencha os campos abaixo. Campos com * são obrigatórios.'}
          </p>
        </div>
        <button className="btn ghost" onClick={onDone}>← Voltar</button>
      </header>

      {vaga && (
        <section className="card vaga-highlight">
          <div className="row between wrap">
            <div className="grow">
              <div className="nome">📋 {vaga.titulo}</div>
              <div className="meta2">
                <strong>{vaga.empresa}</strong>
                <span className="sep">•</span>
                <span>📍 {vaga.local}</span>
                <span className="sep">•</span>
                <span>💰 {vaga.faixa}</span>
                <span className="sep">•</span>
                <span className="badge">{vaga.tipo}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <form className="card form" onSubmit={salvar}>
        <section className="subcard">
          <div className="row between wrap">
            <h2 className="h2">Dados Pessoais</h2>
            <label className="file-btn">
              <span className="btn">📄 Extrair de PDF</span>
              <input type="file" accept=".pdf,application/pdf" disabled={pdfLoading || loading} onChange={handlePdf} hidden />
              {pdfLoading && <span className="ml">processando...</span>}
            </label>
          </div>

          <div className="grid2">
            <Field label="Nome completo *" erro={erros.nome}>
              <input className="input" value={form.nome} maxLength={255}
                onChange={(e) => setField('nome', e.target.value)} />
            </Field>
            <Field label="Nacionalidade *" erro={erros.nacionalidade}>
              <input className="input" value={form.nacionalidade} maxLength={100}
                onChange={(e) => setField('nacionalidade', e.target.value)} />
            </Field>
            <Field label="E-mail *" erro={erros.email}>
              <input type="email" className="input" value={form.email} maxLength={255}
                onChange={(e) => setField('email', e.target.value)} />
            </Field>
            <Field label="Cargo de interesse *" erro={erros.cargoInteresse}>
              <input className="input" value={form.cargoInteresse} maxLength={100}
                onChange={(e) => setField('cargoInteresse', e.target.value)} />
            </Field>
            <Field label="Data de nascimento">
              <input type="date" className="input" value={form.nascimento}
                onChange={(e) => setField('nascimento', e.target.value)} />
            </Field>
            <Field label="Telefone">
              <input className="input" value={form.telefone} maxLength={20}
                placeholder="(11) 98765-4321"
                onChange={(e) => setField('telefone', e.target.value)} />
            </Field>
            <Field label="Endereço">
              <input className="input" value={form.endereco} maxLength={255}
                onChange={(e) => setField('endereco', e.target.value)} />
            </Field>
            <Field label="Cidade">
              <input className="input" value={form.cidade} maxLength={100}
                onChange={(e) => setField('cidade', e.target.value)} />
            </Field>
            <Field label="Estado (UF)">
              <input className="input" value={form.estado} maxLength={20} placeholder="SP"
                onChange={(e) => setField('estado', e.target.value)} />
            </Field>
          </div>

          <Field label="Resumo profissional">
            <textarea className="input" rows={4} value={form.resumoProfissional}
              onChange={(e) => setField('resumoProfissional', e.target.value)} />
          </Field>
        </section>

        <section className="subcard">
          <div className="row between wrap">
            <h2 className="h2">Habilidades</h2>
            <button type="button" className="btn small" onClick={() => addArr('habilidades', { nome: '' })}>
              + Adicionar habilidade
            </button>
          </div>
          {form.habilidades.map((h, i) => (
            <div className="row gap" key={`h${i}`}>
              <div className="grow">
                <input className="input" value={h.nome || ''} maxLength={255}
                  placeholder={`Habilidade ${i + 1} (ex: C#, SQL)`}
                  onChange={(e) => setArr('habilidades', i, 'nome', e.target.value)} />
              </div>
              <button type="button" className="btn small danger" disabled={form.habilidades.length <= 1}
                onClick={() => rmArr('habilidades', i)}>Remover</button>
            </div>
          ))}
        </section>

        <section className="subcard">
          <div className="row between wrap">
            <h2 className="h2">Experiências Profissionais</h2>
            <button type="button" className="btn small"
              onClick={() => addArr('experienciasProfissionais', { cargo: '', descricao: '', dataInicio: '', dataFim: '' })}>
              + Adicionar experiência
            </button>
          </div>
          {form.experienciasProfissionais.map((e, i) => (
            <div className="subitem" key={`e${i}`}>
              <div className="grid2">
                <Field label={`Cargo ${i + 1}`}>
                  <input className="input" value={e.cargo || ''} maxLength={255}
                    onChange={(ev) => setArr('experienciasProfissionais', i, 'cargo', ev.target.value)} />
                </Field>
                <div />
                <Field label="Data início">
                  <input type="date" className="input" value={e.dataInicio || ''}
                    onChange={(ev) => setArr('experienciasProfissionais', i, 'dataInicio', ev.target.value)} />
                </Field>
                <Field label="Data fim">
                  <input type="date" className="input" value={e.dataFim || ''}
                    onChange={(ev) => setArr('experienciasProfissionais', i, 'dataFim', ev.target.value)} />
                </Field>
              </div>
              <Field label="Descrição">
                <textarea className="input" rows={3} value={e.descricao || ''}
                  onChange={(ev) => setArr('experienciasProfissionais', i, 'descricao', ev.target.value)} />
              </Field>
              <div className="row end">
                <button type="button" className="btn small danger"
                  disabled={form.experienciasProfissionais.length <= 1}
                  onClick={() => rmArr('experienciasProfissionais', i)}>Remover</button>
              </div>
            </div>
          ))}
        </section>

        <section className="subcard">
          <div className="row between wrap">
            <h2 className="h2">Graduações</h2>
            <button type="button" className="btn small"
              onClick={() => addArr('graduacoes', { nome: '', dataInicio: '', dataFim: '', instituicao: '' })}>
              + Adicionar graduação
            </button>
          </div>
          {form.graduacoes.map((g, i) => (
            <div className="subitem" key={`g${i}`}>
              <div className="grid2">
                <Field label={`Curso ${i + 1}`}>
                  <input className="input" value={g.nome || ''} maxLength={255}
                    onChange={(ev) => setArr('graduacoes', i, 'nome', ev.target.value)} />
                </Field>
                <Field label="Instituição">
                  <input className="input" value={g.instituicao || ''} maxLength={255}
                    onChange={(ev) => setArr('graduacoes', i, 'instituicao', ev.target.value)} />
                </Field>
                <Field label="Data início">
                  <input type="date" className="input" value={g.dataInicio || ''}
                    onChange={(ev) => setArr('graduacoes', i, 'dataInicio', ev.target.value)} />
                </Field>
                <Field label="Data fim">
                  <input type="date" className="input" value={g.dataFim || ''}
                    onChange={(ev) => setArr('graduacoes', i, 'dataFim', ev.target.value)} />
                </Field>
              </div>
              <div className="row end">
                <button type="button" className="btn small danger"
                  disabled={form.graduacoes.length <= 1}
                  onClick={() => rmArr('graduacoes', i)}>Remover</button>
              </div>
            </div>
          ))}
        </section>

        <div className="row end gap">
          <button type="button" className="btn ghost" disabled={loading} onClick={onDone}>Cancelar</button>
          <button type="submit" className="btn primary" disabled={loading}>
            {loading
              ? (vaga ? 'Enviando...' : 'Salvando...')
              : (vaga ? '📤 Enviar candidatura' : '💾 Salvar cadastro')}
          </button>
        </div>
      </form>

      <footer className="footer">Desafio CIEE • Backend .NET 10 • Frontend React 19</footer>
    </div>
  );
}

function Field({ label, erro, children }) {
  return (
    <label className={`field ${erro ? 'err' : ''}`}>
      <span className="lbl">{label}</span>
      {children}
      {erro && <span className="erro">{erro}</span>}
    </label>
  );
}

function DetailView({ id, onBack }) {
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fmtDate = (d) => {
    if (!d) return '—';
    const iso = typeof d === 'string' ? d.slice(0, 10) : d;
    const dt = new Date(iso + 'T00:00:00');
    if (Number.isNaN(dt.getTime())) return iso;
    return dt.toLocaleDateString('pt-BR');
  };

  const fmtTimestamp = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleString('pt-BR');
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await obterPessoa(id);
        setP(r);
      } catch (e) {
        setToast({ msg: e.message, tipo: 'erro' });
      } finally { setLoading(false); }
    })();
  }, [id]);

  return (
    <div className="page">
      <Toast {...(toast || {})} />
      <header className="header">
        <div>
          <h1>Detalhes do Candidato</h1>
          <p className="sub">Visualização completa dos dados cadastrados.</p>
        </div>
        <button className="btn ghost" onClick={onBack}>← Voltar</button>
      </header>

      {loading && <section className="card"><div className="meta">Carregando...</div></section>}

      {!loading && p && (
        <>
          <section className="card">
            <h2 className="h2">Dados Pessoais</h2>
            <dl className="kv">
              <div><dt>Nome</dt><dd>{p.nome || '—'}</dd></div>
              <div><dt>Cargo interesse</dt><dd>{p.cargoInteresse || '—'}</dd></div>
              <div><dt>E-mail</dt><dd>{p.email || '—'}</dd></div>
              <div><dt>Telefone</dt><dd>{p.telefone || '—'}</dd></div>
              <div><dt>Nascimento</dt><dd>{fmtDate(p.nascimento)}</dd></div>
              <div><dt>Nacionalidade</dt><dd>{p.nacionalidade || '—'}</dd></div>
              <div><dt>Endereço</dt><dd>{p.endereco || '—'}</dd></div>
              <div><dt>Cidade / UF</dt><dd>{[p.cidade, p.estado].filter(Boolean).join(' - ') || '—'}</dd></div>
              <div className="full"><dt>Data inscrição</dt><dd>{fmtTimestamp(p.dataInscricao)}</dd></div>
              <div className="full"><dt>Resumo profissional</dt><dd className="preserve">{p.resumoProfissional || '—'}</dd></div>
            </dl>
          </section>

          <section className="card">
            <h2 className="h2">Habilidades ({p.habilidades?.length || 0})</h2>
            <div className="tags">
              {(p.habilidades || []).length === 0 && <span className="empty">Nenhuma.</span>}
              {(p.habilidades || []).map((h) => (
                <span key={h.id} className="tag">{h.nome}</span>
              ))}
            </div>
          </section>

          <section className="card">
            <h2 className="h2">Experiências ({p.experienciasProfissionais?.length || 0})</h2>
            {(p.experienciasProfissionais || []).length === 0 && <div className="empty">Nenhuma.</div>}
            {(p.experienciasProfissionais || []).map((e) => (
              <div key={e.id} className="subitem">
                <div className="row between wrap">
                  <strong>{e.cargo || '—'}</strong>
                  <span className="meta2">{fmtDate(e.dataInicio)} → {fmtDate(e.dataFim)}</span>
                </div>
                <p className="preserve">{e.descricao || '—'}</p>
              </div>
            ))}
          </section>

          <section className="card">
            <h2 className="h2">Graduações ({p.graduacoes?.length || 0})</h2>
            {(p.graduacoes || []).length === 0 && <div className="empty">Nenhuma.</div>}
            {(p.graduacoes || []).map((g) => (
              <div key={g.id} className="subitem">
                <div className="row between wrap">
                  <strong>{g.nome || '—'}</strong>
                  <span className="meta2">{fmtDate(g.dataInicio)} → {fmtDate(g.dataFim)}</span>
                </div>
                <p className="meta2">Instituição: {g.instituicao || '—'}</p>
              </div>
            ))}
          </section>
        </>
      )}

      <footer className="footer">Desafio CIEE • Backend .NET 10 • Frontend React 19</footer>
    </div>
  );
}
