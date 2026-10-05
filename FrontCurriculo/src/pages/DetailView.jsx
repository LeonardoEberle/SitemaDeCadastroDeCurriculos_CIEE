import { useEffect, useState } from 'react';
import Toast from '../components/Toast.jsx';
import { obterPessoa } from '../services/api.js';

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

export default function DetailView({ id, onBack }) {
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

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
