const BASE = '/api';

async function json(res) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

function mergeErrors(dest, src, prefix = '') {
  if (!src) return;
  if (typeof src === 'string') {
    dest._geral = dest._geral ? `${dest._geral}\n${src}` : src;
    return;
  }
  for (const [k, v] of Object.entries(src)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) dest[key] = v.join('\n');
    else if (v && typeof v === 'object') mergeErrors(dest, v, key);
    else dest[key] = String(v ?? '');
  }
}

export async function listarPessoas({ busca = '', take = 50, skip = 0 } = {}) {
  const qs = new URLSearchParams();
  if (busca) qs.set('busca', busca);
  qs.set('take', String(take));
  qs.set('skip', String(skip));
  const res = await fetch(`${BASE}/pessoas?${qs.toString()}`);
  const data = await json(res);
  const total = Number(res.headers.get('X-Total-Count') ?? 0);
  if (!res.ok) {
    const errs = {};
    mergeErrors(errs, data);
    throw new Error(errs._geral || `Erro ao listar (HTTP ${res.status})`);
  }
  return { lista: Array.isArray(data) ? data : [], total };
}

export async function obterPessoa(id) {
  const res = await fetch(`${BASE}/pessoas/${encodeURIComponent(id)}`);
  const data = await json(res);
  if (!res.ok) {
    const errs = {};
    mergeErrors(errs, data);
    throw new Error(errs._geral || `Erro ao obter (HTTP ${res.status})`);
  }
  return data;
}

export async function criarPessoa(payload) {
  const res = await fetch(`${BASE}/pessoas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await json(res);
  if (!res.ok) {
    const errs = {};
    mergeErrors(errs, data);
    const err = new Error(errs._geral || `Erro ao salvar (HTTP ${res.status})`);
    err.campos = errs;
    throw err;
  }
  return data;
}

export async function atualizarPessoa(id, payload) {
  const res = await fetch(`${BASE}/pessoas/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await json(res);
  if (!res.ok) {
    const errs = {};
    mergeErrors(errs, data);
    const err = new Error(errs._geral || `Erro ao atualizar (HTTP ${res.status})`);
    err.campos = errs;
    throw err;
  }
  return data;
}

export async function excluirPessoa(id) {
  const res = await fetch(`${BASE}/pessoas/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await json(res);
    const errs = {};
    mergeErrors(errs, data);
    throw new Error(errs._geral || `Erro ao excluir (HTTP ${res.status})`);
  }
  return true;
}

export async function extrairPdf(file) {
  const fd = new FormData();
  fd.append('arquivo', file);
  const res = await fetch(`${BASE}/pdf/extrair`, { method: 'POST', body: fd });
  const data = await json(res);
  if (!res.ok) {
    const errs = {};
    mergeErrors(errs, data);
    throw new Error(errs._geral || data?.mensagem || `Erro no PDF (HTTP ${res.status})`);
  }
  return data;
}
