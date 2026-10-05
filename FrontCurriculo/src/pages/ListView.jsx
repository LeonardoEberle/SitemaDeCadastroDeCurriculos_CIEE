import { useEffect, useState } from 'react';
import Toast from '../components/Toast.jsx';
import { listarPessoas, excluirPessoa } from '../services/api.js';

export default function ListView({ onNew, onOpen, onBack }) {
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
          <div className="empty">
            Nenhum candidato cadastrado ainda. Volte para o portal e candidate-se em uma vaga.
          </div>
        )}

        <ul className="lista">
          {items.map((p) => (
            <li key={p.id} className="item">
              <div
                className="grow"
                onClick={() => onOpen(p.id)}
                style={{ cursor: 'pointer' }}
              >
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
