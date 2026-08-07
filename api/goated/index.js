const crypto = require('crypto');

// Khóa bí mật cho App Android
const APP_SECRET_KEY = "VAXPLAYER";
// Mã debug để xem trực tiếp trên trình duyệt
const DEBUG_KEY = "9780752";

// -------------------------------------------------------------
// BỘ NHỚ CACHE TRONG RAM (Tồn tại giữa các lượt gọi)
// -------------------------------------------------------------
const cache = new Map();
const CACHE_TTL = 12 * 60 * 60 * 1000; // Thời gian lưu Cache: 12 tiếng (tính bằng millisecond)

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, mediaType = 'movie', type = 'video', source = 'Valenox', play, debug } = req.query;

  // -------------------------------------------------------------
  // KIỂM TRA BẢO MẬT: X-App-Secret HOẶC debug=9780752
  // -------------------------------------------------------------
  const clientSecret = req.headers['x-app-secret'];
  const isHeaderValid = clientSecret === APP_SECRET_KEY;
  const isDebugValid = debug === DEBUG_KEY;

  if (!isHeaderValid && !isDebugValid) {
    return res.status(403).json({ 
      error: "Truy cập bị từ chối! Bạn không có quyền gọi API này." 
    });
  }

  if (!id) {
    return res.status(400).json({ error: "Thiếu tham số 'id' trên URL" });
  }

  // Tạo Cache Key độc nhất dựa trên các tham số request
  const cacheKey = `${mediaType}_${id}_${type}_${source}`;

  // -------------------------------------------------------------
  // BƯỚC 1: KIỂM TRA CACHE TRONG RAM
  // -------------------------------------------------------------
  if (cache.has(cacheKey)) {
    const cachedItem = cache.get(cacheKey);
    // Nếu cache còn hạn sử dụng (dưới 12 tiếng)
    if (Date.now() - cachedItem.timestamp < CACHE_TTL) {
      res.setHeader('X-Cache', 'HIT'); // Đánh dấu lấy từ RAM Cache
      
      // Nếu có tham số play=true
      if (play && source !== 'true' && (type === 'video')) {
        const videoUrl = cachedItem.data?.url || cachedItem.data?.link;
        if (videoUrl && typeof videoUrl === 'string') {
          return res.redirect(302, videoUrl);
        }
      }

      return res.status(200).json(cachedItem.data);
    } else {
      cache.delete(cacheKey); // Xóa nếu đã hết hạn
    }
  }

  try {
    let resultData;

    // -------------------------------------------------------------
    // BƯỚC 2: NẾU CHƯA CÓ CACHE -> GỌI API & GIẢI POW
    // -------------------------------------------------------------
    if (source === 'true') {
      // Chế độ gộp Video + Phụ đề
      const [videoData, subData] = await Promise.all([
        fetchApiWithPoW('resolve', mediaType, id, { source: 'Valenox' }),
        fetchApiWithPoW('subtitles', mediaType, id)
      ]);

      resultData = {
        ...videoData,
        subtitles: subData?.subtitles || subData
      };
    } else {
      // Chế độ thường (Lấy riêng Video hoặc Phụ đề)
      const endpoint = (type === 'subtitle' || type === 'sub') ? 'subtitles' : 'resolve';
      const extraPayload = endpoint === 'resolve' ? { source } : {};

      resultData = await fetchApiWithPoW(endpoint, mediaType, id, extraPayload);
    }

    // -------------------------------------------------------------
    // BƯỚC 3: KIỂM TRA DỮ LIỆU HOÀN CHỈNH & LƯU VÀO CACHE
    // -------------------------------------------------------------
    const isVideoOk = resultData && !resultData.error;
    const isSubOk = !resultData?.subtitles?.error;

    // Chỉ lưu vào Cache khi CẢ HAI luồng dữ liệu đều thành công không có lỗi
    if (isVideoOk && isSubOk) {
      cache.set(cacheKey, {
        timestamp: Date.now(),
        data: resultData
      });
      res.setHeader('X-Cache', 'MISS'); // Đánh dấu lần đầu tạo Cache
    }

    // Xử lý chuyển hướng nếu có tham số play=true
    if (play && source !== 'true' && (type === 'video')) {
      const videoUrl = resultData?.url || resultData?.link;
      if (videoUrl && typeof videoUrl === 'string') {
        return res.redirect(302, videoUrl);
      }
    }

    // Cấu hình HTTP Cache-Control cho mạng lưới CDN của Vercel (Lưu 12 tiếng)
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');

    return res.status(200).json(resultData);

  } catch (error) {
    return res.status(500).json({ error: "Xử lý thất bại", details: error.message });
  }
};

// -------------------------------------------------------------
// HÀM BỔ TRỢ: Tự động lấy Challenge -> Giải PoW -> Gọi API
// -------------------------------------------------------------
async function fetchApiWithPoW(endpoint, mediaType, id, extraParams = {}) {
  const challengeRes = await fetch("https://api.reallyfast.xyz/api/challenge");
  if (!challengeRes.ok) throw new Error("Không thể lấy challenge");
  
  const challengeData = await challengeRes.json();
  const { challenge, difficulty = 4 } = challengeData;

  const nonce = solvePoWNode(challenge, difficulty);

  const payload = {
    mediaType,
    id: isNaN(id) ? id : Number(id),
    challenge,
    nonce: nonce.toString(),
    ...extraParams
  };

  const apiRes = await fetch(`https://api.reallyfast.xyz/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return await apiRes.json();
}

function solvePoWNode(challenge, difficulty) {
  const targetPrefix = '0'.repeat(difficulty);
  let nonce = 0;

  while (nonce < 1000000) {
    const hash = crypto.createHash('sha256').update(challenge + nonce).digest('hex');
    if (hash.startsWith(targetPrefix)) {
      return nonce;
    }
    nonce++;
  }
  return nonce;
}
