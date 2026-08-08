// Thông tin GitHub Repository
const GITHUB_USER = 'alokillgtv02';
const GITHUB_REPO = 'jsonStore';
const GITHUB_BRANCH = 'main';

// Lưu cache SHA trong bộ nhớ tạm của Serverless (để tối ưu tốc độ)
let cachedCommitSha = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // Kiểm tra commit mới sau mỗi 30 giây

export default async function handler(req, res) {
    const { file } = req.query;

    if (!file) {
        return res.status(400).json({ error: 'Thiếu tham số "file". Ví dụ: /json?file=filex.json' });
    }

    const now = Date.now();
    let commitSha = cachedCommitSha;

    // Chỉ gọi GitHub API nếu chưa có SHA hoặc cache đã quá 30 giây
    if (!commitSha || (now - lastFetchTime) > CACHE_TTL) {
        try {
            const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/commits?sha=${GITHUB_BRANCH}&path=${file}&page=1&per_page=1`;
            
            const headers = {
                'User-Agent': 'Vercel-CDN-Proxy',
                'Accept': 'application/vnd.github.v3+json'
            };

            // Nếu bạn có cấu hình GITHUB_TOKEN trong Vercel Environment Variables
            if (process.env.GITHUB_TOKEN) {
                headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
            }

            const response = await fetch(apiUrl, { headers });

            if (response.ok) {
                const commits = await response.json();
                if (commits && commits.length > 0) {
                    commitSha = commits[0].sha;
                    cachedCommitSha = commitSha;
                    lastFetchTime = now;
                }
            }
        } catch (error) {
            console.error('Lỗi khi lấy Commit SHA từ GitHub:', error);
        }
    }

    // Nếu không lấy được Commit SHA (lỗi mạng/API limit) -> Fallback về Branch
    const ref = commitSha || GITHUB_BRANCH;

    // Link CDN chính xác kèm SHA (Đảm bảo luôn load đúng file mới nhất khi có commit)
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${ref}/${file}`;

    // Đặt Cache Header cho Vercel Edge Cache:
    // Nếu có SHA -> Cache Edge 1 năm (vì SHA là duy nhất cho mỗi bản sửa đổi)
    // Nếu fallback dùng Branch -> Cache ngắn hạn 60 giây
    const cacheHeader = commitSha 
        ? 'public, max-age=31536000, s-maxage=31536000, immutable'
        : 'public, max-age=60, s-maxage=60, stale-while-revalidate=30';

    res.setHeader('Cache-Control', cacheHeader);

    // Chuyển hướng 302 sang CDN
    return res.redirect(302, cdnUrl);
}