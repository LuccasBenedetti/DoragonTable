// DoragonTable Direct Messages API (Vercel Serverless)

let mockDMs = {
  // Key: friendUserId
  'usr_demo_2': [
    {
      id: 'dm_1',
      senderId: 'usr_demo_2',
      senderName: 'Kaelen',
      content: 'E aí, mestre! Vai ter sessão hoje às 20h?',
      timestamp: '17:30',
    },
    {
      id: 'dm_2',
      senderId: 'usr_demo_1',
      senderName: 'MestreDraconico',
      content: 'Com certeza! Prepare a ficha do seu Paladino, a masmorra vai ser perigosa hoje.',
      timestamp: '17:32',
    },
    {
      id: 'dm_3',
      senderId: 'usr_demo_2',
      senderName: 'Kaelen',
      content: 'Show! Já estou com meu 1d20 afiado. Me manda o convite da campanha!',
      timestamp: '17:35',
    }
  ],
  'usr_demo_3': [
    {
      id: 'dm_4',
      senderId: 'usr_demo_3',
      senderName: 'Sylas_Ladino',
      content: 'Consegui comprar adagas novas pro meu personagem.',
      timestamp: 'Ontem às 22:15',
    }
  ]
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { friendId } = req.query;

  // GET DMs for a friend
  if (req.method === 'GET') {
    if (!friendId) {
      return res.status(400).json({ error: 'friendId é obrigatório' });
    }
    const messages = mockDMs[friendId] || [];
    return res.status(200).json({ success: true, messages });
  }

  // SEND DM
  if (req.method === 'POST') {
    const { friendId: targetId, content } = req.body || {};
    if (!targetId || !content) {
      return res.status(400).json({ error: 'friendId e content são obrigatórios' });
    }

    if (!mockDMs[targetId]) {
      mockDMs[targetId] = [];
    }

    const newMsg = {
      id: 'dm_' + Date.now(),
      senderId: 'usr_demo_1',
      senderName: 'MestreDraconico',
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    mockDMs[targetId].push(newMsg);
    return res.status(201).json({ success: true, message: newMsg });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
