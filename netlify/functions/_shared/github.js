import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = "main";

const KEYS_PATH = ".apikeys.json";
const DB_PATH = "data/products.json";

export async function lerArquivo(path) {
  try {
    const { data } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path, ref: BRANCH });
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return { content: JSON.parse(content), sha: data.sha };
  } catch (e) {
    if (e.status === 404) return { content: null, sha: null };
    throw e;
  }
}

export async function salvarArquivo(path, content, sha, message) {
  const contentEncoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER, repo: REPO, path, message,
    content: contentEncoded, sha, branch: BRANCH
  });
}

export function gerarApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length: 32}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function validarApiKey(key) {
  if (!key) return false;
  const { content } = await lerArquivo(KEYS_PATH);
  const keys = content || { keys: [] };
  return keys.keys.includes(key);
}

export { DB_PATH, KEYS_PATH };
