const crypto = require('crypto');

module.exports = async (req, res) => {
  // Bật CORS cho phép gọi từ mọi nơi
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, mediaType = 'movie', type = 'video', source = 'Valenox', play } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Thiếu tham số 'id' trên URL" });
  }

  try {
    const endpoint = (type === 'subtitle' || type === 'sub') ? 'subtitles' : 'resolve';

    // 1. Lấy challenge
    const challengeRes = await fetch("https://api.reallyfast.xyz/api/challenge");
    if (!challengeRes.ok) throw new Error("Không thể lấy challenge");
    
    const challengeData = await challengeRes.json();
    const { challenge, difficulty = 4 } = challengeData;

    // 2. Giải PoW bằng Node.js Native Crypto (Cực nhanh & Không bị limit thời gian)
    const nonce = solvePoWNode(challenge, difficulty);

    // 3. Chuẩn bị Payload
    const payload = {
      mediaType,
      id: isNaN(id) ? id : Number(id),
      challenge,
      nonce: nonce.toString()
    };

    if (endpoint === 'resolve') {
      payload.source = source;
    }

    // 4. Gọi API thật
    const apiRes = await fetch(`https://api.reallyfast.xyz/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await apiRes.json();

    // 5. Nếu có tham số play -> Chuyển hướng 302
    if (play && endpoint === 'resolve') {
      const videoUrl = data?.url || data?.link;
      if (videoUrl && typeof videoUrl === 'string') {
        return res.redirect(302, videoUrl);
      }
    }

    // Trả về JSON
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: "Xử lý thất bại", details: error.message });
  }
};

// Hàm giải PoW bằng C++ Crypto gốc của Node.js (Siêu tốc)
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
