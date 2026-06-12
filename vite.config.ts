import { defineConfig, loadEnv } from 'vite';
import type { ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { IncomingMessage, ServerResponse } from 'http';
import JSZip from 'jszip';

// --------------------------------------------------------------------------
// Auth middleware – exchanges GitHub OAuth code for access token
// --------------------------------------------------------------------------
const authMiddleware = (env: Record<string, string>) =>
  async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.method !== 'POST') return next();

    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { code } = JSON.parse(body);

        if (!code) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing code' }));
          return;
        }

        const response = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            client_id: env.VITE_GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
          }),
        });

        const data = await response.json() as Record<string, string>;
        res.setHeader('Content-Type', 'application/json');

        if (data.error) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: data.error_description || data.error }));
          return;
        }

        res.statusCode = 200;
        res.end(JSON.stringify(data));
      } catch {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  };

// --------------------------------------------------------------------------
// Telegram middleware – proxies zip uploads and fetches updates
// --------------------------------------------------------------------------
const telegramMiddleware = (env: Record<string, string>) =>
  async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.method === 'GET') {
      try {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const headerBotToken = req.headers['x-telegram-bot-token'] as string | undefined;
        const queryBotToken = url.searchParams.get('botToken');
        const activeBotToken = headerBotToken || queryBotToken || env.TELEGRAM_BOT_TOKEN;

        if (!activeBotToken || activeBotToken === 'your_telegram_bot_token') {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: 'Telegram Bot Token is not configured.' }));
          return;
        }

        if (activeBotToken && !/^\d+:[A-Za-z0-9_-]+$/.test(activeBotToken)) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: 'Invalid Telegram Bot Token format.' }));
          return;
        }

        interface TelegramUpdate {
          message?: {
            document?: {
              file_id: string;
              file_name: string;
            };
            date: number;
          };
        }

        const updatesRes = await fetch(`https://api.telegram.org/bot${activeBotToken}/getUpdates?limit=20&offset=-20`);
        const updates = await updatesRes.json() as { ok: boolean, result: TelegramUpdate[] };
        if (!updates.ok) {
          res.statusCode = 502;
          res.end(JSON.stringify({ ok: false, error: 'Failed to fetch updates' }));
          return;
        }

        const documents = updates.result
          .filter(u => u.message?.document)
          .map(u => ({
            fileId: u.message!.document!.file_id,
            fileName: u.message!.document!.file_name,
            date: u.message!.date
          }));

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true, documents }));
      } catch (e) {
        const err = e as Error;
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }

    if (req.method !== 'POST') return next();

    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const { owner, repo, token, meta, mode = 'delete', botToken: bodyBotToken, chatId: bodyChatId } = body;

      const activeBotToken = bodyBotToken || env.TELEGRAM_BOT_TOKEN;
      const activeChatId = bodyChatId || env.TELEGRAM_CHAT_ID;

      if (!activeBotToken || !activeChatId || activeBotToken === 'your_telegram_bot_token') {
        res.statusCode = 503;
        res.end(JSON.stringify({ ok: false, error: 'Telegram is not configured.' }));
        return;
      }

      if (activeBotToken && !/^\d+:[A-Za-z0-9_-]+$/.test(activeBotToken)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Invalid Telegram Bot Token format.' }));
        return;
      }

      if (activeChatId && !/^-?\d+$/.test(activeChatId.toString())) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Invalid Telegram Chat ID format.' }));
        return;
      }

      if (mode === 'test') {
        try {
          const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
          const testCaption = `🔔 *GitSweep Connection Test*\n\nYour Telegram configuration is working perfectly!\n\n🕒 Date: ${dateStr}\n🤖 Powered by GitSweep`;
          const testRes = await fetch(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: activeChatId,
              text: testCaption,
              parse_mode: 'Markdown',
            }),
          });
          const testData = await testRes.json() as { ok: boolean, description?: string };
          res.setHeader('Content-Type', 'application/json');
          if (!testData.ok) {
            res.statusCode = 502;
            res.end(JSON.stringify({ ok: false, error: testData.description || 'Telegram API error' }));
            return;
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          const err = e as Error;
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
        return;
      }

      if (!owner || !repo || !token) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Missing owner, repo, or token' }));
        return;
      }

      // Step 1: Get real default branch
      const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!repoInfoRes.ok) {
        res.statusCode = 502;
        res.end(JSON.stringify({ ok: false, error: `GitHub repo info failed: ${repoInfoRes.status}` }));
        return;
      }

      const repoInfo = await repoInfoRes.json() as { default_branch: string };
      const defaultBranch = repoInfo.default_branch || 'main';

      // Step 2: Download zip
      const zipRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/zipball/${defaultBranch}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
        redirect: 'follow',
      });

      const zipArrayBuffer = await zipRes.arrayBuffer();
      const zipBuffer = Buffer.from(zipArrayBuffer);

      // Step 3: Build rich caption
      const sizeDisplay = zipBuffer.byteLength > 1024 * 1024
        ? `${(zipBuffer.byteLength / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(zipBuffer.byteLength / 1024)} KB`;

      const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      
      const header = mode === 'delete' ? `🗑 *DELETED: ${meta?.fullName || `${owner}/${repo}`}*` 
                   : mode === 'leave'  ? `🤝 *CONTRIBUTION: ${meta?.fullName || `${owner}/${repo}`}*`
                   : mode === 'transfer' ? `📤 *TRANSFER: ${meta?.fullName || `${owner}/${repo}`}*`
                   : `📦 *BACKUP: ${meta?.fullName || `${owner}/${repo}`}*`;

      const footer = mode === 'delete' ? `❌ Removed on: ${dateStr} IST`
                   : mode === 'leave'  ? `✅ Left on: ${dateStr} IST`
                   : mode === 'transfer' ? `✅ Transfer initiated on: ${dateStr} IST`
                   : `✅ Backed up on: ${dateStr} IST`;

      const caption = [
        header,
        meta?.description ? `📝 ${meta.description}` : null,
        '',
        `🔒 Visibility: ${meta?.isPrivate ? 'Private' : 'Public'}`,
        meta?.language ? `💻 Language: ${meta.language}` : null,
        `⭐ Stars: ${meta?.stars ?? 0}`,
        `💾 Size: ${sizeDisplay}`,
        `🌿 Branch: ${defaultBranch}`,
        '',
        footer,
        `🤖 Powered by GitSweep`,
      ].filter(Boolean).join('\n');

      // Step 4: Upload
      const formData = new FormData();
      formData.append('chat_id', activeChatId);
      formData.append('document', new Blob([zipBuffer]), `${repo}.zip`);
      formData.append('caption', caption);
      formData.append('parse_mode', 'Markdown');

      const telegramRes = await fetch(`https://api.telegram.org/bot${activeBotToken}/sendDocument`, {
        method: 'POST',
        body: formData,
      });

      const tgData = await telegramRes.json() as {
        result?: {
          message_id?: number;
          document?: {
            file_id?: string;
          };
        };
      };
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ 
        ok: true, 
        message_id: tgData.result?.message_id,
        file_id: tgData.result?.document?.file_id
      }));
    } catch (error) {
      const err = error as Error;
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  };

// --------------------------------------------------------------------------
// Restore middleware – resurrects a repo from Telegram backup
// --------------------------------------------------------------------------
const restoreMiddleware = (env: Record<string, string>) =>
  async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.method !== 'POST') return next();

    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const { fileId, repoName, owner, token, botToken: bodyBotToken } = body;

      const activeBotToken = bodyBotToken || env.TELEGRAM_BOT_TOKEN;
      if (!activeBotToken || activeBotToken === 'your_telegram_bot_token') {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Telegram Bot Token is not configured.' }));
        return;
      }

      if (activeBotToken && !/^\d+:[A-Za-z0-9_-]+$/.test(activeBotToken)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Invalid Telegram Bot Token format.' }));
        return;
      }

      if (!fileId || !repoName || !token) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Missing fileId, repoName, or token' }));
        return;
      }

      // Step 1: Get file path from Telegram
      const fileRes = await fetch(`https://api.telegram.org/bot${activeBotToken}/getFile?file_id=${fileId}`);
      const fileData = await fileRes.json() as {
        ok: boolean;
        description?: string;
        result?: {
          file_path?: string;
        };
      };
      if (!fileData.ok) {
        console.error('[Restore] Telegram getFile failed:', fileData);
        res.statusCode = 502;
        res.end(JSON.stringify({ ok: false, error: `Telegram error: ${fileData.description || 'file lookup failed'}` }));
        return;
      }

      const filePath = fileData.result?.file_path;
      if (!filePath) {
        res.statusCode = 502;
        res.end(JSON.stringify({ ok: false, error: 'Telegram file path not found' }));
        return;
      }
      const downloadUrl = `https://api.telegram.org/file/bot${activeBotToken}/${filePath}`;

      // Step 2: Download zip
      const zipRes = await fetch(downloadUrl);
      const zipBuffer = await zipRes.arrayBuffer();

      // Step 3: Unzip with JSZip
      const zip = new JSZip();
      const content = await zip.loadAsync(zipBuffer);
      const rootFolder = Object.keys(content.files).find(name => name.endsWith('/'));

      // Step 4: Create Repo on GitHub
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: repoName, private: true, auto_init: false }),
      });

      if (!createRes.ok) {
        res.statusCode = createRes.status;
        res.end(JSON.stringify({ ok: false, error: 'GitHub repo creation failed' }));
        return;
      }

      const newRepo = await createRes.json() as { html_url: string };

      // Step 5: Upload top files (demonstration/prototype logic)
      const filesToUpload = Object.keys(content.files)
        .filter(name => !content.files[name].dir && (rootFolder ? name.startsWith(rootFolder) : true))
        .slice(0, 20); // Limit for prototype

      for (const fileName of filesToUpload) {
        const fileContent = await content.files[fileName].async('base64');
        const relativePath = rootFolder ? fileName.replace(rootFolder, '') : fileName;
        
        await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${relativePath}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
          body: JSON.stringify({ message: `Restore ${relativePath}`, content: fileContent }),
        });
      }

      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true, url: newRepo.html_url }));
    } catch (e) {
      const err = e as Error;
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  };

// --------------------------------------------------------------------------
// Download middleware – proxies zip downloads from GitHub locally
// --------------------------------------------------------------------------
const downloadMiddleware = () =>
  async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.method !== 'POST') return next();

    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const { owner, repo, token, branch = 'main' } = body;

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
        redirect: 'follow',
      });

      const arrayBuffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${repo}.zip"`);
      res.end(Buffer.from(arrayBuffer));
    } catch {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  };

const apiPlugin = (env: Record<string, string>) => ({
  name: 'api-middleware',
  configureServer(server: ViteDevServer) {
    server.middlewares.use('/api/auth', authMiddleware(env));
    server.middlewares.use('/api/telegram', telegramMiddleware(env));
    server.middlewares.use('/api/restore', restoreMiddleware(env));
    server.middlewares.use('/api/download', downloadMiddleware());
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), apiPlugin(env)],
  };
});
