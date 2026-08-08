// File: /api/json.js
// script github json cdn proxy version: 1.1 (Direct Endpoint Compatible)

const GITHUB_USER = 'alokillgtv02';
const GITHUB_REPO = 'jsonStore';
const GITHUB_BRANCH = 'main';

// Memory cache lưu SHA
let cachedCommitSha = {};
let lastFetchTime = {};

module.exports = async (req, res) => {
  // Cấu hình CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Bóc tách tên file từ query 'file' hoặc từ URL path
  let file = req.query.file;

  if (!file) {
    let rawPath = req.url.split('?')[0].replace(/^\/api\/json/i, "");
    file = rawPath.replace(/^\/+/g, '');
  }

  if (!file) {
    return res.status(400).json({ 
      status: "error", 
      error: 'Thiếu tham số "file". Ví dụ: /api/json?file=filex.json hoặc /api/json/filex.json' 
    });
  }

  const { refresh } = req.query;
  const now = Date.now();
  const isForceRefresh = refresh === 'true' || refresh === '1';

  let commitSha = cachedCommitSha[file];
  const lastTime = lastFetchTime[file] || 0;

  // Nếu ép refresh HOẶC chưa có cache HOẶC đã quá 10 giây
  if (isForceRefresh || !commitSha || (now - lastTime) > 10000) {
    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/commits?sha=${GITHUB_BRANCH}&path=${file}&page=1&per_page=1&_t=${now}`;
      
      const headers = {
        'User-Agent': 'Vercel-CDN-Proxy',
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache'
      };

      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
      }

      const response = await fetch(apiUrl, { headers });

      if (response.ok) {
        const commits = await response.json();
        if (commits && commits.length > 0) {
          commitSha = commits[0].sha;
          cachedCommitSha[file] = commitSha;
          lastFetchTime[file] = now;
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy Commit SHA từ GitHub:', error);
    }
  }

  const ref = commitSha || GITHUB_BRANCH;
  const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${ref}/${file}`;

  // Cấu hình Cache-Control cho Edge CDN
  if (isForceRefresh) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  }

  return res.redirect(302, cdnUrl);
};