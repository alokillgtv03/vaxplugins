const crypto = require('crypto');

// Khóa bí mật cho App Android
const APP_SECRET_KEY = "VAXPLAYER";
// Mã debug để xem trực tiếp trên trình duyệt
const DEBUG_KEY = "9780752";

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

  try {
    const endpoint = (type === 'subtitle' || type === 'sub') ? 'subtitles' : 'resolve';

    const challengeRes = await fetch("https://api.reallyfast.xyz/api/challenge");
    if (!challengeRes.ok) throw new Error("Không thể lấy challenge");
    
    const challengeData = await challengeRes.json();
    const { challenge, difficulty = 4 } = challengeData;

    const nonce = solvePoWNode(challenge, difficulty);

    const payload = {
      mediaType,
      id: isNaN(id) ? id : Number(id),
      challenge,
      nonce: nonce.toString()
    };

    if (endpoint === 'resolve') {
      payload.source = source;
    }

    const apiRes = await fetch(`https://api.reallyfast.xyz/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await apiRes.json();

    if (play && endpoint === 'resolve') {
      const videoUrl = data?.url || data?.link;
      if (videoUrl && typeof videoUrl === 'string') {
        return res.redirect(302, videoUrl);
      }
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: "Xử lý thất bại", details: error.message });
  }
};

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
