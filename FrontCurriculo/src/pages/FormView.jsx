import { useState } from 'react';
import Toast from '../components/Toast.jsx';
import Field from '../components/Field.jsx';
import { criarPessoa, extrairPdf } from '../services/api.js';
import { emptyForm, montarPayload } from '../utils/formHelpers.js';

export default function FormView({ onDone, vaga }) {
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
      setToast({
        msg: r?.mensagem || 'PDF processado.',
        tipo: r?.sucesso === false ? 'alerta' : 'ok',
      });
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

  const salvar = async (e) => {
    e.preventDefault();
    setErros({});
    setLoading(true);
    try {
      const payload = montarPayload(form);
      const r = await criarPessoa(payload);
      setToast({
        msg: vaga
          ? `Candidatura enviada para "${vaga.titulo}"! Boa sorte no processo seletivo.`
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
        <button className="btn ghost" onClick={onDone}>Voltar</button>
      </header>

      {vaga && (
        <section className="card vaga-highlight">
          <div className="row between wrap">
            <div className="grow">
              <div className="nome">{vaga.titulo}</div>
              <div className="meta2">
                <strong>{vaga.empresa}</strong>
                <span className="sep">•</span>
                <span>{vaga.local}</span>
                <span className="sep">•</span>
                <span>{vaga.faixa}</span>
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
              <span className="btn">Extrair de PDF</span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                disabled={pdfLoading || loading}
                onChange={handlePdf}
                hidden
              />
              {pdfLoading && <span className="ml">processando...</span>}
            </label>
          </div>

          <div className="grid2">
            <Field label="Nome completo *" erro={erros.nome}>
              <input
                className="input"
                value={form.nome}
                maxLength={255}
                onChange={(e) => setField('nome', e.target.value)}
              />
            </Field>
            <Field label="Nacionalidade *" erro={erros.nacionalidade}>
              <input
                className="input"
                value={form.nacionalidade}
                maxLength={100}
                onChange={(e) => setField('nacionalidade', e.target.value)}
              />
            </Field>
            <Field label="E-mail *" erro={erros.email}>
              <input
                type="email"
                className="input"
                value={form.email}
                maxLength={255}
                onChange={(e) => setField('email', e.target.value)}
              />
            </Field>
            <Field label="Cargo de interesse *" erro={erros.cargoInteresse}>
              <input
                className="input"
                value={form.cargoInteresse}
                maxLength={100}
                onChange={(e) => setField('cargoInteresse', e.target.value)}
              />
            </Field>
            <Field label="Data de nascimento">
              <input
                type="date"
                className="input"
                value={form.nascimento}
                onChange={(e) => setField('nascimento', e.target.value)}
              />
            </Field>
            <Field label="Telefone">
              <input
                className="input"
                value={form.telefone}
                maxLength={20}
                placeholder="(11) 98765-4321"
                onChange={(e) => setField('telefone', e.target.value)}
              />
            </Field>
            <Field label="Endereço">
              <input
                className="input"
                value={form.endereco}
                maxLength={255}
                onChange={(e) => setField('endereco', e.target.value)}
              />
            </Field>
            <Field label="Cidade">
              <input
                className="input"
                value={form.cidade}
                maxLength={100}
                onChange={(e) => setField('cidade', e.target.value)}
              />
            </Field>
            <Field label="Estado (UF)">
              <input
                className="input"
                value={form.estado}
                maxLength={20}
                placeholder="PR"
                onChange={(e) => setField('estado', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Resumo profissional">
            <textarea
              className="input"
              rows={4}
              value={form.resumoProfissional}
              onChange={(e) => setField('resumoProfissional', e.target.value)}
            />
          </Field>
        </section>

        <section className="subcard">
          <div className="row between wrap">
            <h2 className="h2">Habilidades</h2>
            <button
              type="button"
              className="btn small"
              onClick={() => addArr('habilidades', { nome: '' })}
            >
              + Adicionar habilidade
            </button>
          </div>
          {form.habilidades.map((h, i) => (
            <div className="row gap" key={`h${i}`}>
              <div className="grow">
                <input
                  className="input"
                  value={h.nome || ''}
                  maxLength={255}
                  placeholder={`Habilidade ${i + 1} (ex: Pacote Office, organização)`}
                  onChange={(e) => setArr('habilidades', i, 'nome', e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn small danger"
                disabled={form.habilidades.length <= 1}
                onClick={() => rmArr('habilidades', i)}
              >
                Remover
              </button>
            </div>
          ))}
        </section>

        <section className="subcard">
          <div className="row between wrap">
            <h2 className="h2">Experiências Profissionais</h2>
            <button
              type="button"
              className="btn small"
              onClick={() => addArr('experienciasProfissionais', { cargo: '', descricao: '', dataInicio: '', dataFim: '' })}
            >
              + Adicionar experiência
            </button>
          </div>
          {form.experienciasProfissionais.map((e, i) => (
            <div className="subitem" key={`e${i}`}>
              <div className="grid2">
                <Field label={`Cargo ${i + 1}`}>
                  <input
                    className="input"
                    value={e.cargo || ''}
                    maxLength={255}
                    onChange={(ev) => setArr('experienciasProfissionais', i, 'cargo', ev.target.value)}
                  />
                </Field>
                <div />
                <Field label="Data início">
                  <input
                    type="date"
                    className="input"
                    value={e.dataInicio || ''}
                    onChange={(ev) => setArr('experienciasProfissionais', i, 'dataInicio', ev.target.value)}
                  />
                </Field>
                <Field label="Data fim">
                  <input
                    type="date"
                    className="input"
                    value={e.dataFim || ''}
                    onChange={(ev) => setArr('experienciasProfissionais', i, 'dataFim', ev.target.value)}
                  />
                </Field>
              </div>
              <Field label="Descrição">
                <textarea
                  className="input"
                  rows={3}
                  value={e.descricao || ''}
                  onChange={(ev) => setArr('experienciasProfissionais', i, 'descricao', ev.target.value)}
                />
              </Field>
              <div className="row end">
                <button
                  type="button"
                  className="btn small danger"
                  disabled={form.experienciasProfissionais.length <= 1}
                  onClick={() => rmArr('experienciasProfissionais', i)}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="subcard">
          <div className="row between wrap">
            <h2 className="h2">Graduações</h2>
            <button
              type="button"
              className="btn small"
              onClick={() => addArr('graduacoes', { nome: '', dataInicio: '', dataFim: '', instituicao: '' })}
            >
              + Adicionar graduação
            </button>
          </div>
          {form.graduacoes.map((g, i) => (
            <div className="subitem" key={`g${i}`}>
              <div className="grid2">
                <Field label={`Curso ${i + 1}`}>
                  <input
                    className="input"
                    value={g.nome || ''}
                    maxLength={255}
                    onChange={(ev) => setArr('graduacoes', i, 'nome', ev.target.value)}
                  />
                </Field>
                <Field label="Instituição">
                  <input
                    className="input"
                    value={g.instituicao || ''}
                    maxLength={255}
                    onChange={(ev) => setArr('graduacoes', i, 'instituicao', ev.target.value)}
                  />
                </Field>
                <Field label="Data início">
                  <input
                    type="date"
                    className="input"
                    value={g.dataInicio || ''}
                    onChange={(ev) => setArr('graduacoes', i, 'dataInicio', ev.target.value)}
                  />
                </Field>
                <Field label="Data fim">
                  <input
                    type="date"
                    className="input"
                    value={g.dataFim || ''}
                    onChange={(ev) => setArr('graduacoes', i, 'dataFim', ev.target.value)}
                  />
                </Field>
              </div>
              <div className="row end">
                <button
                  type="button"
                  className="btn small danger"
                  disabled={form.graduacoes.length <= 1}
                  onClick={() => rmArr('graduacoes', i)}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </section>

        <div className="row end gap">
          <button type="button" className="btn ghost" disabled={loading} onClick={onDone}>
            Cancelar
          </button>
          <button type="submit" className="btn primary" disabled={loading}>
            {loading
              ? (vaga ? 'Enviando...' : 'Salvando...')
              : (vaga ? 'Enviar candidatura' : 'Salvar cadastro')}
          </button>
        </div>
      </form>

      <footer className="footer">Backend .NET 10 • Frontend React 19</footer>
    </div>
  );
}
