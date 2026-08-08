// Thông tin GitHub Repository
const GITHUB_USER = 'alokillgtv02';
const GITHUB_REPO = 'jsonStore';
const GITHUB_BRANCH = 'main';

export default function handler(req, res) {
    // Lấy tên file từ tham số "file" (?file=filex.json)
    const { file } = req.query;

    if (!file) {
        return res.status(400).json({ 
            error: 'Thiếu tham số "file". Ví dụ: /json?file=filex.json' 
        });
    }

    // Tạo link CDN JsDelivr chuẩn từ GitHub
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${GITHUB_BRANCH}/${file}`;

    // Thiết lập Cache-Control cho Edge Network của Vercel
    // Các lần truy cập sau Vercel sẽ tự động trả về Cache mà KHÔNG CẦN CHẠY LẠI CODE
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400');

    // Chuyển hướng người dùng sang CDN (mã 301)
    return res.redirect(301, cdnUrl);
}