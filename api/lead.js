// POST /api/lead — save contact lead to Notion database
// GET  /api/lead — health check / count

const https = require('https');

const NOTION_TOKEN       = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '662679eb964c416e9565826be7c4ba99';

// ── Minimal Notion API helper ──────────────────────────────────────────────────
function notionRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.notion.com',
      port: 443,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Map sport value → Notion select option ────────────────────────────────────
function mapSport(sport) {
  const map = {
    running:   'Running',
    cycling:   'Cycling',
    triathlon: 'Triathlon',
    swimming:  'Swimming',
    other:     'Other',
  };
  return map[sport?.toLowerCase()] || 'Other';
}

// ── Format duration: 4.833... → "4h50min" ─────────────────────────────────────
function fmtHrs(h) {
  const num = parseFloat(h);
  if (!num || num <= 0) return '';
  const hrs  = Math.floor(num);
  const mins = Math.round((num - hrs) * 60);
  if (hrs === 0) return `${mins}min`;
  return mins === 0 ? `${hrs}h` : `${hrs}h${mins}min`;
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: health check ──────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const configured = !!NOTION_TOKEN;
    return res.status(200).json({
      ok: true,
      notion: configured ? 'connected' : 'missing NOTION_TOKEN env var',
      database: NOTION_DATABASE_ID,
    });
  }

  // ── POST: save lead to Notion ──────────────────────────────────────────────
  if (req.method === 'POST') {
    if (!NOTION_TOKEN) {
      console.error('[lead] NOTION_TOKEN not set');
      return res.status(500).json({ error: 'Notion not configured' });
    }

    const { firstName, lastName, email, phone, sport, eventName, durationHrs, orderText } = req.body || {};

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName, email are required' });
    }

    const fullName = `${lastName?.trim()} ${firstName?.trim()}`;

    // Optional blocks containing the order summary
    let childrenBlocks = [];
    if (orderText) {
      childrenBlocks = [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: [{ type: 'text', text: { content: 'Yêu Cầu Mua Y Phục / Dinh Dưỡng' } }] },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: orderText } }] },
        }
      ];
    }

    const page = {
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        'Họ và Tên': {
          title: [{ text: { content: fullName } }],
        },
        'Email': {
          email: email?.trim(),
        },
        'Số ĐT': {
          phone_number: phone?.trim() || null,
        },
        'Môn': {
          select: { name: mapSport(sport) },
        },
        'Sự Kiện': {
          rich_text: [{ text: { content: eventName || '' } }],
        },
        'Thời Gian': {
          rich_text: [{ text: { content: fmtHrs(durationHrs) } }],
        },
        'Đơn hàng': {
          rich_text: [{ text: { content: orderText || '' } }],
        },
      },
      children: childrenBlocks.length > 0 ? childrenBlocks : undefined,
    };

    const result = await notionRequest('POST', '/v1/pages', page);

    if (result.status !== 200) {
      console.error('[lead] Notion error:', JSON.stringify(result.body));
      return res.status(500).json({ error: 'Failed to save to Notion', details: result.body?.message });
    }

    console.log(`[lead] ✅ saved: ${fullName} <${email}>`);
    return res.status(200).json({ success: true, notionPageId: result.body.id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
