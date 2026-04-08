// POST /api/lead — save user contact info
// GET  /api/lead — download Excel of all collected leads

const fs   = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const LEADS_FILE = '/tmp/hiboost-leads.json';

function readLeads() {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
    }
  } catch {}
  return [];
}

function writeLeads(leads) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── POST: save a new lead ──────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { firstName, lastName, email, phone, sport, eventName, durationHrs } = req.body || {};

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName, email are required' });
    }

    const lead = {
      id:          Date.now(),
      submittedAt: new Date().toISOString(),
      firstName:   firstName?.trim(),
      lastName:    lastName?.trim(),
      fullName:    `${lastName?.trim()} ${firstName?.trim()}`,
      email:       email?.trim(),
      phone:       phone?.trim() || '',
      sport:       sport || '',
      eventName:   eventName || '',
      durationHrs: durationHrs || '',
    };

    const leads = readLeads();
    leads.push(lead);
    writeLeads(leads);

    console.log(`[lead] saved: ${lead.fullName} <${lead.email}>`);
    return res.status(200).json({ success: true, id: lead.id });
  }

  // ── GET: download Excel of all leads ──────────────────────────────────────
  if (req.method === 'GET') {
    const leads = readLeads();

    if (leads.length === 0) {
      return res.status(200).json({ message: 'No leads yet', count: 0 });
    }

    // Build Excel
    const rows = leads.map((l, i) => ({
      'STT':            i + 1,
      'Ngày':           new Date(l.submittedAt).toLocaleString('vi-VN'),
      'Họ và Tên':      l.fullName,
      'Email':          l.email,
      'Số ĐT':          l.phone,
      'Môn':            l.sport,
      'Sự Kiện':        l.eventName,
      'Thời Gian (h)':  l.durationHrs,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 5 }, { wch: 20 }, { wch: 24 }, { wch: 28 },
      { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="hiboost-leads-${date}.xlsx"`);
    return res.status(200).send(buf);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
