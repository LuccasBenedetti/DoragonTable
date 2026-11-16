// DoragonTable Friends API (Vercel Serverless)

let mockFriendships = [
  {
    friendshipId: 'fr_1',
    user: {
      id: 'usr_demo_2',
      username: 'Kaelen',
      tag: '1042',
      avatar_url: '',
      status: 'online',
      custom_status: 'Pronto para rolar 1d20',
      activity: 'Em Campanha: A Cidadela da Névoa',
    },
    status: 'accepted',
  },
  {
    friendshipId: 'fr_2',
    user: {
      id: 'usr_demo_3',
      username: 'Sylas_Ladino',
      tag: '3310',
      avatar_url: '',
      status: 'idle',
      custom_status: 'Nas sombras...',
      activity: 'No Hub Principal',
    },
    status: 'accepted',
  },
  {
    friendshipId: 'fr_3',
    user: {
      id: 'usr_demo_4',
      username: 'Elysia_Maga',
      tag: '8821',
      avatar_url: '',
      status: 'offline',
      custom_status: 'Estudando pergaminhos',
      activity: '',
    },
    status: 'accepted',
  },
  {
    friendshipId: 'fr_4',
    user: {
      id: 'usr_demo_5',
      username: 'Thorin_Anao',
      tag: '4450',
      avatar_url: '',
      status: 'online',
      custom_status: 'Afirando machados',
      activity: '',
    },
    status: 'pending', // Pedido pendente recebido
  }
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET FRIENDS LIST
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      friends: mockFriendships,
    });
  }

  // ADD FRIEND / ACCEPT
  if (req.method === 'POST') {
    const { action, targetTag, friendshipId } = req.body || {};

    if (action === 'add') {
      // Ex: targetTag = "Guerreiro#1234"
      if (!targetTag || !targetTag.includes('#')) {
        return res.status(400).json({ error: 'Informe a tag no formato Nome#1234' });
      }

      const [name, tag] = targetTag.split('#');
      const newFriend = {
        friendshipId: 'fr_' + Date.now(),
        user: {
          id: 'usr_' + Date.now(),
          username: name.trim(),
          tag: tag.trim(),
          avatar_url: '',
          status: 'online',
          custom_status: 'Amigo recém-adicionado',
          activity: '',
        },
        status: 'pending',
      };

      mockFriendships.push(newFriend);
      return res.status(201).json({ success: true, message: `Pedido de amizade enviado para ${targetTag}!`, friendship: newFriend });
    }

    if (action === 'accept') {
      const item = mockFriendships.find(f => f.friendshipId === friendshipId);
      if (item) {
        item.status = 'accepted';
        return res.status(200).json({ success: true, message: 'Pedido aceito!' });
      }
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
  }

  return res.status(400).json({ error: 'Operação não suportada' });
};
