import { useMemo, useState } from 'react';
import VAGAS from '../data/vagas.js';

export default function JobsView({ onApply, onGoAdmin }) {
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
          <h1>Portal do Candidato</h1>
          <p className="sub">
            Encontre a vaga ideal em Curitiba e Região Metropolitana e candidate-se em minutos.
            Suas informações serão usadas apenas para o processo seletivo.
          </p>
        </div>
        <button
          className="btn ghost"
          onClick={onGoAdmin}
          title="Apenas para validações do desafio"
        >
          Área administrativa
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
          <strong>{filtradas.length}</strong> vaga{filtradas.length === 1 ? '' : 's'} aberta
          {filtradas.length === 1 ? '' : 's'}.
        </div>

        {filtradas.length === 0 && (
          <div className="empty">Nenhuma vaga encontrada para &quot;{busca}&quot;.</div>
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
                  <span>{v.local}</span>
                  <span className="sep">•</span>
                  <span>{v.faixa}</span>
                </div>
                <p className="desc">{v.descricao}</p>
                <div className="tags">
                  {(v.requisitos || []).map((r, i) => (
                    <span key={i} className="tag">{r}</span>
                  ))}
                </div>
              </div>
              <div className="actions">
                <button className="btn primary" onClick={() => onApply(v)}>
                  Quero me candidatar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="footer">
        Área do Candidato ·{' '}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); onGoAdmin(); }}
          style={{ color: 'inherit' }}
        >
          Área administrativa (validação)
        </a>
      </footer>
    </div>
  );
}
