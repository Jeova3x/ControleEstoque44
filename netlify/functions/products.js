import { lerArquivo, salvarArquivo, validarApiKey, DB_PATH } from './_shared/github.js';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-api-key, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };

  const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'];
  if (!await validarApiKey(apiKey)) {
    return { statusCode: 401, headers, body: JSON.stringify({ erro: "API Key inválida. Use /api/auth" }) };
  }

  const path = event.path.replace('/.netlify/functions/products', '').replace('/api/products', '');
  let { content: produtos, sha } = await lerArquivo(DB_PATH);
  if (!produtos) produtos = [];

  try {
    // GET /api/products - lista todos
    if (event.httpMethod === 'GET' && path === '') {
      return { statusCode: 200, headers, body: JSON.stringify(produtos) };
    }

    // GET /api/products/sku/SKU-001 - busca por SKU
    if (event.httpMethod === 'GET' && path.startsWith('/sku/')) {
      const sku = path.split('/sku/')[1];
      const produto = produtos.find(p => p.sku === sku);
      return produto
       ? { statusCode: 200, headers, body: JSON.stringify(produto) }
        : { statusCode: 404, headers, body: JSON.stringify({ erro: "SKU não encontrado" }) };
    }

    // GET /api/products/prod_1 - busca por ID
    if (event.httpMethod === 'GET' && path.match(/^\/[^/]+$/)) {
      const id = path.slice(1);
      const produto = produtos.find(p => p.id === id);
      return produto
       ? { statusCode: 200, headers, body: JSON.stringify(produto) }
        : { statusCode: 404, headers, body: JSON.stringify({ erro: "Produto não encontrado" }) };
    }

    // POST /api/products - cria
    if (event.httpMethod === 'POST' && path === '') {
      const body = JSON.parse(event.body);
      if (produtos.find(p => p.sku === body.sku)) {
        return { statusCode: 400, headers, body: JSON.stringify({ erro: "SKU já existe" }) };
      }
      const novo = {
        id: `prod_${Date.now()}`,
        sku: body.sku,
        name: body.name,
        quantity: body.quantity || 0,
        price: body.price || 0,
        createdAt: new Date().toISOString()
      };
      produtos.push(novo);
      await salvarArquivo(DB_PATH, produtos, sha, `Adiciona ${novo.sku}`);
      return { statusCode: 201, headers, body: JSON.stringify(novo) };
    }

    // PUT /api/products/prod_1 - atualiza
    if (event.httpMethod === 'PUT' && path.match(/^\/[^/]+$/)) {
      const id = path.slice(1);
      const body = JSON.parse(event.body);
      const idx = produtos.findIndex(p => p.id === id);
      if (idx === -1) return { statusCode: 404, headers, body: JSON.stringify({ erro: "Produto não encontrado" }) };

      produtos[idx] = {...produtos[idx],...body, id: produtos[idx].id, createdAt: produtos[idx].createdAt, updatedAt: new Date().toISOString() };
      await salvarArquivo(DB_PATH, produtos, sha, `Atualiza ${id}`);
      return { statusCode: 200, headers, body: JSON.stringify(produtos[idx]) };
    }

    // DELETE /api/products/prod_1 - remove
    if (event.httpMethod === 'DELETE' && path.match(/^\/[^/]+$/)) {
      const id = path.slice(1);
      const tamanhoAntes = produtos.length;
      produtos = produtos.filter(p => p.id!== id);
      if (produtos.length === tamanhoAntes) {
        return { statusCode: 404, headers, body: JSON.stringify({ erro: "Produto não encontrado" }) };
      }
      await salvarArquivo(DB_PATH, produtos, sha, `Remove ${id}`);
      return { statusCode: 204, headers, body: "" };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ erro: "Rota não encontrada" }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ erro: err.message }) };
  }
}
