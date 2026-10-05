export const emptyForm = () => ({
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

export const montarPayload = (form) => ({
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
