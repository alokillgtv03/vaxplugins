const GITHUB_USER = 'alokillgtv02';
const GITHUB_REPO = 'jsonStore';
const GITHUB_BRANCH = 'main';

// Memory cache
let cachedCommitSha = {};
let lastFetchTime = {};

export default async function handler(req, res) {
    const { file, refresh } = req.query;

    if (!file) {
        return res.status(400).json({ error: 'Thiếu tham số "file". Ví dụ: /json?file=filex.json' });
    }

    const now = Date.now();
    const isForceRefresh = refresh === 'true' || refresh === '1';
    
    // Nếu có truyền ?refresh=true HOẶC chưa có cache HOẶC đã quá 10s
    let commitSha = cachedCommitSha[file];
    const lastTime = lastFetchTime[file] || 0;

    if (isForceRefresh || !commitSha || (now - lastTime) > 10000) {
        try {
            // Thêm timestamp_random để tránh GitHub API trả về cache HTTP
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

    // Cấu hình Cache-Control cho Vercel Edge:
    // Nếu ép refresh thì bảo Edge không được cache kết quả redirect này
    if (isForceRefresh) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    }

    return res.redirect(302, cdnUrl);
}