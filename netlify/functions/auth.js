import { lerArquivo, salvarArquivo, gerarApiKey, KEYS_PATH } from './_shared/github.js';

export async function handler(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod!== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ erro: "Método não permitido" }) };
  }

  const novaKey = gerarApiKey();
  const { content, sha } = await lerArquivo(KEYS_PATH);
  const keys = content || { keys: [] };
  keys.keys.push(novaKey);
  await salvarArquivo(KEYS_PATH, keys, sha, 'Nova API Key gerada');

  return {
    statusCode: 201, headers,
    body: JSON.stringify({ api_key: novaKey, aviso: "Salve essa chave. Ela não será mostrada novamente." })
  };
}
