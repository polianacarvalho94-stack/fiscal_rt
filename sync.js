// Sincronização bidirecional: Máquina ↔ GitHub
// Execute: node sync.js

const { execSync } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

const REPO_DIR = path.resolve(__dirname);
const PULL_INTERVAL_MS = 30 * 1000;
const DEBOUNCE_MS = 3000;

let pushTimer = null;
let syncando = false;

// Opções para suprimir janelas no Windows
const GIT_OPTS = {
  cwd: REPO_DIR,
  encoding: 'utf8',
  windowsHide: true,       // ← impede abertura de janela cmd
  stdio: ['ignore', 'pipe', 'pipe'],
};

// ── Utilitários ──────────────────────────────────────────────
function log(msg, tipo = 'info') {
  const hora = new Date().toLocaleTimeString('pt-BR');
  const prefix = { info: '→', ok: '✓', warn: '⚠', erro: '✗' }[tipo] || '→';
  console.log(`[${hora}] ${prefix} ${msg}`);
}

function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: REPO_DIR, encoding: 'utf8' }).trim();
}

// ── Máquina → GitHub (push) ──────────────────────────────────
function fazerPush(arquivos) {
  if (syncando) return;
  syncando = true;

  try {
    // Verifica se há mudanças
    const status = git('status --porcelain');
    if (!status) {
      log('Nenhuma mudança para enviar.', 'info');
      syncando = false;
      return;
    }

    log(`Enviando para o GitHub: ${arquivos.join(', ')}`, 'info');

    git('add .');
    const data = new Date().toLocaleString('pt-BR');
    git(`commit -m "Sync automático: ${data}"`);
    git('push origin main');

    log('Push concluído! Site atualizado no GitHub Pages.', 'ok');
  } catch (err) {
    log('Erro no push: ' + err.message, 'erro');
  }

  syncando = false;
}

// ── GitHub → Máquina (pull) ──────────────────────────────────
async function verificarGitHub() {
  if (syncando) return;

  try {
    // Busca atualizações sem aplicar
    git('fetch origin main');
    const local  = git('rev-parse HEAD');
    const remote = git('rev-parse origin/main');

    if (local !== remote) {
      log('Nova atualização detectada no GitHub! Baixando...', 'warn');
      syncando = true;

      // Salva mudanças locais se houver
      const status = git('status --porcelain');
      if (status) {
        git('stash');
        log('Mudanças locais salvas temporariamente (stash).', 'info');
      }

      // Baixa do GitHub
      git('pull origin main');
      log('Pull concluído! Arquivos locais atualizados.', 'ok');

      // Restaura mudanças locais se havia stash
      if (status) {
        git('stash pop');
        log('Mudanças locais restauradas.', 'info');
      }

      syncando = false;
    }
  } catch (err) {
    log('Erro no pull: ' + err.message, 'erro');
    syncando = false;
  }
}

// ── Watcher: monitora arquivos locais ───────────────────────
const watcher = chokidar.watch(REPO_DIR, {
  ignored: /(^|[\/\\])\..|(node_modules)|(.git)/,
  persistent: true,
  ignoreInitial: true,
});

const arquivosAlterados = new Set();

watcher.on('change', (filePath) => {
  const nome = path.relative(REPO_DIR, filePath);
  arquivosAlterados.add(nome);
  log(`Arquivo alterado: ${nome}`, 'info');

  // Debounce: aguarda parar de editar antes de fazer push
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    fazerPush([...arquivosAlterados]);
    arquivosAlterados.clear();
  }, DEBOUNCE_MS);
});

watcher.on('add', (filePath) => {
  const nome = path.relative(REPO_DIR, filePath);
  log(`Novo arquivo: ${nome}`, 'info');
  arquivosAlterados.add(nome);
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    fazerPush([...arquivosAlterados]);
    arquivosAlterados.clear();
  }, DEBOUNCE_MS);
});

watcher.on('unlink', (filePath) => {
  const nome = path.relative(REPO_DIR, filePath);
  log(`Arquivo removido: ${nome}`, 'warn');
  arquivosAlterados.add(nome + ' (removido)');
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    fazerPush([...arquivosAlterados]);
    arquivosAlterados.clear();
  }, DEBOUNCE_MS);
});

// ── Polling: verifica GitHub periodicamente ─────────────────
setInterval(verificarGitHub, PULL_INTERVAL_MS);

// ── Início ───────────────────────────────────────────────────
console.log(`
╔═══════════════════════════════════════════════╗
║     🔄 Sync Bidirecional Ativo                ║
║     Máquina ↔ GitHub (fiscal_rt)             ║
╠═══════════════════════════════════════════════╣
║  → Pasta monitorada: ${REPO_DIR.slice(-30).padEnd(30)}  ║
║  → Push: automático após edição (3s)         ║
║  → Pull: verificação a cada 30 segundos      ║
╚═══════════════════════════════════════════════╝
`);

log('Monitorando arquivos locais...', 'ok');
log('Verificando GitHub a cada 30 segundos...', 'ok');

// Verifica imediatamente ao iniciar
verificarGitHub();
