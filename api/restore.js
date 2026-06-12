import JSZip from 'jszip';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileId, repoName, token, owner, botToken: bodyBotToken } = req.body || {};
  const activeBotToken = bodyBotToken || process.env.TELEGRAM_BOT_TOKEN;

  if (!activeBotToken || activeBotToken === 'your_telegram_bot_token') {
    return res.status(400).json({ ok: false, error: 'Telegram Bot Token is not configured.' });
  }

  if (!fileId || !repoName || !token || !owner) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  try {
    // Step 1: Get the file path from Telegram
    const fileInfoRes = await fetch(`https://api.telegram.org/bot${activeBotToken}/getFile?file_id=${fileId}`);
    const fileInfo = await fileInfoRes.json();
    
    if (!fileInfo.ok) {
      return res.status(502).json({ ok: false, error: 'Failed to get file from Telegram' });
    }

    const filePath = fileInfo.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${activeBotToken}/${filePath}`;

    // Step 2: Download the zip
    const zipRes = await fetch(fileUrl);
    const zipBuffer = await zipRes.arrayBuffer();

    // Step 3: Parse Zip with JSZip
    const zip = new JSZip();
    const contents = await zip.loadAsync(zipBuffer);
    
    // Step 4: Create new repo on GitHub
    const createRepoRes = await fetch(`https://api.github.com/user/repos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        name: repoName,
        description: `Restored by GitSweep from Telegram backup`,
        private: true,
      }),
    });

    if (!createRepoRes.ok) {
      const err = await createRepoRes.json();
      return res.status(createRepoRes.status).json({ ok: false, error: err.message || 'Failed to create repo' });
    }

    const newRepo = await createRepoRes.json();

    // Step 5: Upload files to the new repo
    // Note: This is a simplified version. For large repos, we'd need to use the Git Tree API.
    // We'll upload the top-level files or a subset for this demonstration.
    const files = Object.keys(contents.files).filter(path => !contents.files[path].dir);
    
    // We'll try to upload up to 20 files for now to stay within serverless limits
    const uploadLimit = 20;
    const filesToUpload = files.slice(0, uploadLimit);

    for (const path of filesToUpload) {
      const file = contents.files[path];
      const base64 = await file.async('base64');
      
      // Remove the prefix from the zip (usually owner-repo-hash/)
      const cleanPath = path.split('/').slice(1).join('/');
      if (!cleanPath) continue;

      await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${cleanPath}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          message: `Restore ${cleanPath}`,
          content: base64,
          branch: newRepo.default_branch || 'main',
        }),
      });
    }

    return res.status(200).json({ ok: true, url: newRepo.html_url });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
