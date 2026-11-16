// In-memory campaign state storage for Vercel Serverless Function demo
// For persistent database in production, connect to Supabase, Upstash Redis, or Neon Postgres
const campaigns = {
  'CAMP-NEXUS-2026': {
    id: 'CAMP-NEXUS-2026',
    name: 'A Cidadela da Névoa (Online)',
    ruleset: 'dnd5e',
    createdAt: new Date().toISOString(),
    players: [],
    messages: [
      {
        id: 'msg_1',
        senderName: 'Servidor Central (Vercel)',
        type: 'system',
        content: 'Servidor Discord-Like conectado via Vercel Edge API.',
        timestamp: new Date().toLocaleTimeString(),
      }
    ],
  }
};

module.exports = (req, res) => {
  // Enable CORS for the desktop Electron app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    if (id && campaigns[id]) {
      return res.status(200).json({ success: true, campaign: campaigns[id] });
    }
    return res.status(200).json({ success: true, campaigns: Object.values(campaigns) });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const code = body.code || 'CAMP-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    
    campaigns[code] = {
      id: code,
      name: body.name || 'Nova Campanha Online',
      ruleset: body.ruleset || 'dnd5e',
      createdAt: new Date().toISOString(),
      players: body.players || [],
      messages: [],
    };

    return res.status(201).json({ success: true, campaign: campaigns[code] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
