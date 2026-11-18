import React, { useState, useEffect } from 'react';
import { 
  Campaign, 
  CharacterSheet, 
  ChatMessage, 
  GameMode, 
  RulesetType, 
  Scene, 
  LoreEntity,
  Combatant,
  CombatState 
} from './types';
import { CampaignSidebar } from './components/Sidebar/CampaignSidebar';
import { ChannelSidebar } from './components/Sidebar/ChannelSidebar';
import { ChatArea } from './components/Chat/ChatArea';
import { TacticalMap } from './components/Map/TacticalMap';
import { SceneTokensBar } from './components/Sheets/SceneTokensBar';
import { CharacterSheetModal } from './components/Sheets/CharacterSheetModal';
import { LoreBibleModal } from './components/GM/LoreBibleModal';
import { GMScreen } from './components/GM/GMScreen';
import { OllamaConfigModal } from './components/GM/OllamaConfigModal';
import { LANServerModal } from './components/GM/LANServerModal';
import { CreateCampaignModal } from './components/Sidebar/CreateCampaignModal';
import { AuthScreen, UserProfile } from './components/Auth/AuthScreen';
import { HomeHub, FriendItem } from './components/Home/HomeHub';
import { RightDock, RightDockTab } from './components/Dock/RightDock';
import { rollDice } from './services/dice';
import { AiMasterEngine } from './services/aiMaster';
import { 
  Map as MapIcon, 
  MessageSquare, 
  Columns, 
  X, 
  Copy, 
  Check, 
  UserPlus,
  PanelLeftOpen,
  PanelLeftClose,
  PanelRightOpen,
  PanelRightClose,
  Shield,
  Book,
  Crown
} from 'lucide-react';

// Starter Campaigns Data to show D&D and GURPS
const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp_dnd',
    name: 'A Cidadela da Névoa',
    description: 'Campanha de fantasia medieval nas terras sombrias de Baróvia e arredores.',
    icon: '⚔️',
    ruleset: 'dnd5e',
    gameMode: 'ai_master',
    hostName: 'Mestre da Mesa',
    isHost: true,
    channels: [
      { id: 'chan_dnd_1', name: 'taverna-do-corvo', type: 'scene' },
      { id: 'chan_dnd_2', name: 'criptas-antigas', type: 'scene' },
      { id: 'chan_dnd_3', name: 'dados-e-combate', type: 'dice' },
      { id: 'chan_dnd_4', name: 'geral-ooc', type: 'ooc' },
      { id: 'chan_dnd_5', name: 'anotacoes-do-mestre', type: 'gm_notes', isPrivateGM: true },
    ],
    scenes: [
      {
        id: 'scene_dnd_1',
        name: 'Taverna do Corvo Sangrento',
        description: 'Taverna iluminada por velas de cera negra. No fundo, há um mezanino de madeira a +3m de altura de onde guardas arqueiros vigiam a entrada.',
        gridType: 'hex',
        gridSize: 50,
        width: 26,
        height: 18,
        walls: [
          { id: 'w1', x1: 50, y1: 50, x2: 1250, y2: 50, height: 4, blocksSight: true, blocksMovement: true },
          { id: 'w2', x1: 50, y1: 50, x2: 50, y2: 850, height: 4, blocksSight: true, blocksMovement: true },
          { id: 'w3', x1: 1250, y1: 50, x2: 1250, y2: 850, height: 4, blocksSight: true, blocksMovement: true },
        ],
        elevationZones: [
          { id: 'z1', name: 'Mezanino Superior', x: 2, y: 2, width: 7, height: 4, elevation: 3, color: 'rgba(234, 179, 8, 0.25)' },
          { id: 'z2', name: 'Fosso da Lareira', x: 12, y: 12, width: 4, height: 3, elevation: -1, color: 'rgba(239, 68, 68, 0.2)' },
        ],
        tokens: [
          {
            id: 'tok_dnd_1',
            characterId: 'char_dnd_1',
            name: 'Kaelen',
            avatar: '',
            x: 6,
            y: 8,
            elevation: 0,
            size: 1,
            sightRadius: 9,
            statusConditions: [],
            color: '#3b82f6',
          },
          {
            id: 'tok_dnd_2',
            characterId: 'char_dnd_2',
            name: 'Arqueiro da Guarda',
            avatar: '',
            x: 4,
            y: 3,
            elevation: 3,
            size: 1,
            sightRadius: 10,
            statusConditions: [],
            color: '#eab308',
          },
        ],
        fogOfWarEnabled: false,
      },
    ],
    activeSceneId: 'scene_dnd_1',
    activeChannelId: 'chan_dnd_1',
    characters: [
      {
        id: 'char_dnd_1',
        name: 'Kaelen Sombra-de-Aço',
        avatar: '',
        isNPC: false,
        isGM: false,
        ruleset: 'dnd5e',
        hp: 28,
        maxHp: 28,
        energy: 14,
        maxEnergy: 14,
        defense: 17,
        elevation: 0,
        currentSceneId: 'scene_dnd_1',
        conditions: [],
        bio: 'Paladino errante do Juramento da Vingança.',
        notes: 'Carrega o medalhão de prata de sua ordem destruída.',
        dnd: {
          class: 'Paladino',
          level: 3,
          race: 'Meio-Elfo',
          alignment: 'Caótico e Bom',
          stats: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 16 },
          ac: 17,
          speed: 9,
          proficiencyBonus: 2,
          skills: { Atletismo: { proficient: true, bonus: 5 }, Persuasão: { proficient: true, bonus: 5 } },
          inventory: [{ name: 'Espada Longa', qty: 1, weight: 1.5, desc: '1d8 cortante' }],
          features: ['Sentido Divino', 'Cura pelas Mãos'],
        },
      },
      {
        id: 'char_dnd_2',
        name: 'Arqueiro da Guarda',
        avatar: '',
        isNPC: true,
        isGM: false,
        ruleset: 'dnd5e',
        hp: 16,
        maxHp: 16,
        energy: 10,
        maxEnergy: 10,
        defense: 14,
        elevation: 3,
        currentSceneId: 'scene_dnd_1',
        conditions: [],
        bio: 'Sentinela posicionado no mezanino vigiando quem entra e sai.',
        notes: 'Tem visão clara de toda a entrada.',
        dnd: {
          class: 'Patrulheiro',
          level: 2,
          race: 'Humano',
          alignment: 'Neutro',
          stats: { str: 11, dex: 16, con: 12, int: 10, wis: 13, cha: 10 },
          ac: 14,
          speed: 9,
          proficiencyBonus: 2,
          skills: { Percepção: { proficient: true, bonus: 5 }, Furtividade: { proficient: true, bonus: 5 } },
          inventory: [{ name: 'Arco Longo', qty: 1, weight: 1.0, desc: '1d8 perfurante (alcance 45m)' }],
          features: ['Inimigo Favorito', 'Tiro Certeiro (+2 dano à distância)'],
        },
      },
    ],
    activeCharacterId: 'char_dnd_1',
    loreEntities: [
      {
        id: 'lore_1',
        name: 'Taverna do Corvo Sangrento',
        category: 'location',
        description: 'Ponto de encontro isolado na encruzilhada de Baróvia. O estalajadeiro é um anão chamado Borgan que ouve de tudo mas finge não saber de nada.',
        tags: ['taverna', 'baróvia', 'ponto_de_encontro'],
        lastUpdated: '16/11/2026',
        knownByPlayers: true,
      },
      {
        id: 'lore_2',
        name: 'A Ordem da Lâmina Escarlate',
        category: 'secret',
        description: 'Culto secreto que opera nos subterrâneos da cidadela realizando rituais de sangue sob a lua cheia.',
        tags: ['culto', 'segredo', 'inimigos'],
        lastUpdated: '16/11/2026',
        knownByPlayers: false,
      },
    ],
    gmSecretNotes: 'O arqueiro no mezanino tem ordens de não deixar ninguém sair se a campainha do sino tocar.',
    aiSettings: {
      model: 'fluffy/llama-3.1-8b-stheno-v3.4:latest',
      temperature: 0.7,
      systemPrompt: 'Você é o Mestre de RPG do DoragonTable narrando em fantasia medieval sombria.',
      autoLogEntities: true,
    },
  },
  {
    id: 'camp_gurps',
    name: 'Neo-São Paulo 2088',
    description: 'Campanha de ficção cyberpunk futurista com regras realistas de GURPS 4ª Edição.',
    icon: '🌆',
    ruleset: 'gurps',
    gameMode: 'ai_master',
    hostName: 'Mestre da Mesa',
    isHost: true,
    channels: [
      { id: 'chan_gurps_1', name: 'beco-do-neon', type: 'scene' },
      { id: 'chan_gurps_2', name: 'rolagens-3d6', type: 'dice' },
      { id: 'chan_gurps_3', name: 'frequencia-livre', type: 'ooc' },
    ],
    scenes: [
      {
        id: 'scene_gurps_1',
        name: 'Beco dos Implantes',
        description: 'Um beco estreito banhado por chuva ácida e luzes neon cor-de-rosa. Passarelas elevadas cruzam entre os edifícios a 4 metros de altura.',
        gridType: 'square',
        gridSize: 45,
        width: 24,
        height: 16,
        walls: [],
        elevationZones: [
          { id: 'zg1', name: 'Passarela de Tubulações', x: 2, y: 1, width: 20, height: 2, elevation: 4, color: 'rgba(59, 130, 246, 0.25)' },
        ],
        tokens: [
          {
            id: 'tok_g1',
            characterId: 'char_g1',
            name: 'Vance',
            avatar: '',
            x: 5,
            y: 8,
            elevation: 0,
            size: 1,
            sightRadius: 8,
            statusConditions: [],
            color: '#10b981',
          },
        ],
        fogOfWarEnabled: false,
      },
    ],
    activeSceneId: 'scene_gurps_1',
    activeChannelId: 'chan_gurps_1',
    characters: [
      {
        id: 'char_g1',
        name: 'Vance "Glitch"',
        avatar: '',
        isNPC: false,
        isGM: false,
        ruleset: 'gurps',
        hp: 13,
        maxHp: 13,
        energy: 11,
        maxEnergy: 11,
        defense: 10,
        elevation: 0,
        currentSceneId: 'scene_gurps_1',
        conditions: [],
        bio: 'Infiltrador cibernético com reflexos aumentados.',
        notes: 'Procurado por megacorporações por extração de dados.',
        gurps: {
          pointTotal: 175,
          st: 11,
          dx: 13,
          iq: 12,
          ht: 11,
          hp: 13,
          fp: 11,
          basicSpeed: 6.0,
          basicMove: 6,
          thrustDmg: '1d-1',
          swingDmg: '1d+1',
          dodge: 10,
          parry: 10,
          block: 0,
          advantages: ['Reflexos em Combate (+1 defesa)', 'Visão Noturna 4'],
          disadvantages: ['Inimigo (Megacorp)', 'Código de Honra (Mercenário)'],
          skills: [
            { name: 'Armas de Fogo (Pistola)', level: 15, relLevel: 'DX+2' },
            { name: 'Infiltração', level: 14, relLevel: 'DX+1' },
            { name: 'Computadores (Hacking)', level: 13, relLevel: 'IQ+1' },
          ],
          equipment: [
            { name: 'Pistola Pesada Gauss', weight: 1.2, cost: 900 },
            { name: 'Jaqueta de Kevlar Balística', weight: 2.0, cost: 600 },
          ],
        },
      },
    ],
    activeCharacterId: 'char_g1',
    loreEntities: [
      {
        id: 'lore_g1',
        name: 'Distrito 9 (Baixa Cidade)',
        category: 'location',
        description: 'Setor degradado e sem lei onde hackers e mercenários negociam no mercado negro.',
        tags: ['cyberpunk', 'distrito', 'mercado_negro'],
        lastUpdated: '16/11/2026',
        knownByPlayers: true,
      },
    ],
    gmSecretNotes: 'O alvo de Vance está no topo da passarela suspensa (+4m de altura) com um rifle sniper.',
    aiSettings: {
      model: 'fluffy/llama-3.1-8b-stheno-v3.4:latest',
      temperature: 0.7,
      systemPrompt: 'Você é o Mestre de RPG do GURPS Cyberpunk.',
      autoLogEntities: true,
    },
  },
];

export const App: React.FC = () => {
  // Current logged user
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('doragontable_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  
  // activeCampaignId is null when in Home (Friends & DMs hub)
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  
  // Layout Controls
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isRightDockOpen, setIsRightDockOpen] = useState<boolean>(true);
  const [activeRightDockTab, setActiveRightDockTab] = useState<RightDockTab>('chat');
  
  // Modals
  const [showFullSheet, setShowFullSheet] = useState<CharacterSheet | null>(null);
  const [showLoreBible, setShowLoreBible] = useState<boolean>(false);
  const [showGMScreen, setShowGMScreen] = useState<boolean>(false);
  const [showOllamaConfig, setShowOllamaConfig] = useState<boolean>(false);
  const [showLANModal, setShowLANModal] = useState<boolean>(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState<boolean>(false);
  const [showInviteCampaignModal, setShowInviteCampaignModal] = useState<boolean>(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Selected Token / Character in Scene
  const [selectedTokenId, setSelectedTokenId] = useState<string | undefined>('tok_dnd_1');

  // Auto-Updater State
  const [updateInfo, setUpdateInfo] = useState<{
    status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
    percent?: number;
    version?: string;
  }>({ status: 'idle' });

  // Initial Session & Auto-Updater listener setup
  useEffect(() => {
    const win = window as any;

    // Restore persistent session from Electron's native userData if available
    if (win.doragonAPI?.getUserSession) {
      win.doragonAPI.getUserSession().then((savedUser: UserProfile | null) => {
        if (savedUser) {
          setCurrentUser(savedUser);
          try {
            localStorage.setItem('doragontable_user', JSON.stringify(savedUser));
          } catch {}
        }
      }).catch((err: any) => console.warn('[App] Could not read native session:', err));
    }

    // Subscribe to Auto-Updater IPC events
    if (win.doragonAPI?.onUpdaterStatus) {
      const unsubscribe = win.doragonAPI.onUpdaterStatus((data: any) => {
        if (data.status === 'downloading') {
          setUpdateInfo({ status: 'downloading', percent: data.percent });
        } else if (data.status === 'downloaded') {
          setUpdateInfo({ status: 'downloaded', version: data.info?.version });
        } else if (data.status === 'available') {
          setUpdateInfo({ status: 'available', version: data.info?.version });
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('doragontable_user', JSON.stringify(user));
    } catch {}
    const win = window as any;
    if (win.doragonAPI?.saveUserSession) {
      win.doragonAPI.saveUserSession(user).catch(console.warn);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('doragontable_user');
    } catch {}
    const win = window as any;
    if (win.doragonAPI?.clearUserSession) {
      win.doragonAPI.clearUserSession().catch(console.warn);
    }
  };

  // Messages State Map: [campaignId_channelId]: ChatMessage[]
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({
    'camp_dnd_chan_dnd_1': [
      {
        id: 'm1',
        channelId: 'chan_dnd_1',
        senderId: 'ai',
        senderName: 'Mestre IA',
        senderAvatar: '',
        type: 'narration',
        content: 'As portas duplas da Taverna do Corvo Sangrento estalam com a ventania gélida de Baróvia. O aroma de carne assada e vinho temperado aquece o ar. No alto do mezanino (+3m de altura), um arqueiro vigia atentamente quem entra. O que vocês fazem?',
        isAI: true,
        timestamp: Date.now() - 60000,
      },
    ],
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  // Active Campaign & Scene getters (when a campaign is selected)
  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId) || campaigns[0];
  const activeScene = activeCampaign.scenes.find((s) => s.id === activeCampaign.activeSceneId) || activeCampaign.scenes[0];
  const activeChannel = activeCampaign.channels.find((c) => c.id === activeCampaign.activeChannelId) || activeCampaign.channels[0];

  const currentMessagesKey = `${activeCampaign.id}_${activeChannel.id}`;
  const currentMessages = messagesMap[currentMessagesKey] || [];

  const charactersInScene = activeCampaign.characters.filter((c) => c.currentSceneId === activeScene.id);
  const selectedToken = activeScene.tokens.find((t) => t.id === selectedTokenId);
  const selectedCharacter = activeCampaign.characters.find((c) => c.id === selectedToken?.characterId) || charactersInScene[0] || activeCampaign.characters[0];

  // Keyboard Shortcuts (Ctrl+B = toggle left channels, Ctrl+J = toggle right dock)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsLeftSidebarOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsRightDockOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectCampaign = (id: string) => {
    setActiveCampaignId(id);
    const camp = campaigns.find((c) => c.id === id);
    if (camp && camp.scenes[0]?.tokens[0]) {
      setSelectedTokenId(camp.scenes[0].tokens[0].id);
    }
  };

  const handleSelectChannel = (channelId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === activeCampaign.id ? { ...c, activeChannelId: channelId } : c))
    );
  };

  const handleToggleGameMode = (mode: GameMode) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === activeCampaign.id ? { ...c, gameMode: mode } : c))
    );
  };

  const handleSendMessage = async (
    content: string,
    type: ChatMessage['type'],
    characterId?: string
  ) => {
    const sender = activeCampaign.characters.find((c) => c.id === characterId) || activeCampaign.characters[0];
    
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      channelId: activeChannel.id,
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      type,
      content,
      isAI: false,
      isGM: activeCampaign.isHost && sender.isGM,
      timestamp: Date.now(),
    };

    const nextMessages = [...currentMessages, userMsg];
    setMessagesMap((prev) => ({
      ...prev,
      [currentMessagesKey]: nextMessages,
    }));

    if (activeCampaign.gameMode === 'ai_master' && activeChannel.type === 'scene') {
      setIsGeneratingAI(true);
      try {
        const aiResponseText = await AiMasterEngine.narrate(
          activeCampaign,
          activeScene,
          charactersInScene,
          nextMessages,
          content
        );

        // Execute action tags issued by AI
        const execResult = AiMasterEngine.parseAndExecuteTacticalActions(
          aiResponseText,
          activeScene,
          activeCampaign.characters
        );

        // Update scene tokens and characters if modified
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === activeCampaign.id
              ? {
                  ...c,
                  characters: execResult.updatedCharacters,
                  scenes: c.scenes.map((s) => (s.id === execResult.updatedScene.id ? execResult.updatedScene : s)),
                }
              : c
          )
        );

        // Execute any rolls the AI requested
        for (const r of execResult.rollsToExecute) {
          handleRollDice(r.formula, r.desc);
        }

        const actionNotices = execResult.actionsExecuted.length > 0
          ? '\n\n' + execResult.actionsExecuted.map(a => a.description).join('\n')
          : '';

        const aiMsg: ChatMessage = {
          id: 'ai_' + Date.now(),
          channelId: activeChannel.id,
          senderId: 'ai_master',
          senderName: 'Mestre IA',
          senderAvatar: '',
          type: 'narration',
          content: execResult.cleanedText + actionNotices,
          isAI: true,
          timestamp: Date.now(),
        };

        setMessagesMap((prev) => ({
          ...prev,
          [currentMessagesKey]: [...(prev[currentMessagesKey] || []), aiMsg],
        }));

        if (activeCampaign.aiSettings?.autoLogEntities) {
          AiMasterEngine.extractNewEntities(activeCampaign, execResult.cleanedText).then((newEntities) => {
            if (newEntities.length > 0) {
              setCampaigns((prev) =>
                prev.map((c) =>
                  c.id === activeCampaign.id
                    ? { ...c, loreEntities: [...c.loreEntities, ...newEntities] }
                    : c
                )
              );
            }
          });
        }
      } catch (err: any) {
        console.error('AI Narration error:', err);
      } finally {
        setIsGeneratingAI(false);
      }
    }
  };

  const handleRollDice = (formula: string, desc?: string, target?: number) => {
    const token = activeScene.tokens.find((t) => t.id === selectedTokenId);
    const elevation = token ? token.elevation : 0;

    const rollResult = rollDice(formula, activeCampaign.ruleset, target, elevation);

    const sender = activeCampaign.characters.find((c) => c.id === token?.characterId) || activeCampaign.characters[0];

    const rollMsg: ChatMessage = {
      id: 'roll_' + Date.now(),
      channelId: activeChannel.id,
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      type: 'roll',
      content: desc || `Rolou ${formula}`,
      roll: rollResult,
      timestamp: Date.now(),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [currentMessagesKey]: [...(prev[currentMessagesKey] || []), rollMsg],
    }));
  };

  const handleUpdateTokenPosition = (tokenId: string, x: number, y: number, elevation: number) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== activeCampaign.id) return c;
        return {
          ...c,
          scenes: c.scenes.map((s) => {
            if (s.id !== activeScene.id) return s;
            return {
              ...s,
              tokens: s.tokens.map((t) => (t.id === tokenId ? { ...t, x, y, elevation } : t)),
            };
          }),
        };
      })
    );
  };

  const handleUpdateHp = (characterId: string, delta: number) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== activeCampaign.id) return c;
        return {
          ...c,
          characters: c.characters.map((char) => {
            if (char.id !== characterId) return char;
            const newHp = Math.max(0, Math.min(char.maxHp, char.hp + delta));
            return { ...char, hp: newHp };
          }),
        };
      })
    );
  };

  // --- COMBAT & INITIATIVE TURN ORDER HANDLERS ---
  const triggerAiNpcTurn = async (npcCharId: string, roundNumber: number) => {
    const npcChar = activeCampaign.characters.find((c) => c.id === npcCharId);
    if (!npcChar) return;

    setIsGeneratingAI(true);
    try {
      const response = await AiMasterEngine.narrateNpcTurn(
        activeCampaign,
        activeScene,
        charactersInScene,
        currentMessages,
        npcChar,
        roundNumber
      );

      const execResult = AiMasterEngine.parseAndExecuteTacticalActions(
        response,
        activeScene,
        activeCampaign.characters
      );

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === activeCampaign.id
            ? {
                ...c,
                characters: execResult.updatedCharacters,
                scenes: c.scenes.map((s) => (s.id === execResult.updatedScene.id ? execResult.updatedScene : s)),
              }
            : c
        )
      );

      for (const r of execResult.rollsToExecute) {
        handleRollDice(r.formula, r.desc);
      }

      const actionNotices = execResult.actionsExecuted.length > 0
        ? '\n\n' + execResult.actionsExecuted.map((a) => a.description).join('\n')
        : '';

      const aiMsg: ChatMessage = {
        id: 'ai_turn_' + Date.now(),
        channelId: activeChannel.id,
        senderId: 'ai_master',
        senderName: `${npcChar.name} (IA)`,
        senderAvatar: npcChar.avatar,
        type: 'narration',
        content: execResult.cleanedText + actionNotices,
        isAI: true,
        timestamp: Date.now(),
      };

      setMessagesMap((prev) => ({
        ...prev,
        [currentMessagesKey]: [...(prev[currentMessagesKey] || []), aiMsg],
      }));
    } catch (err) {
      console.error('Failed to execute AI NPC Turn:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleStartCombat = () => {
    if (charactersInScene.length === 0) return;

    const turnOrder: Combatant[] = charactersInScene.map((char) => {
      let init = 10;
      if (char.ruleset === 'dnd5e') {
        const dexMod = char.dnd?.stats?.dex !== undefined ? Math.floor((char.dnd.stats.dex - 10) / 2) : 0;
        init = Math.floor(Math.random() * 20) + 1 + dexMod;
      } else if (char.ruleset === 'gurps') {
        const speed = char.gurps?.basicSpeed || 5.0;
        const tiebreaker = (Math.floor(Math.random() * 6) + 1) / 10;
        init = speed + tiebreaker;
      } else {
        init = Math.floor(Math.random() * 20) + 1;
      }
      return {
        characterId: char.id,
        name: char.name,
        avatar: char.avatar,
        initiative: init,
        isNPC: char.isNPC,
      };
    }).sort((a, b) => b.initiative - a.initiative);

    const newCombat: CombatState = {
      isActive: true,
      round: 1,
      currentTurnIndex: 0,
      turnOrder,
    };

    setCampaigns((prev) =>
      prev.map((c) => (c.id === activeCampaign.id ? { ...c, combat: newCombat } : c))
    );

    const firstCombatant = turnOrder[0];
    const firstToken = activeScene.tokens.find((t) => t.characterId === firstCombatant?.characterId);
    if (firstToken) {
      setSelectedTokenId(firstToken.id);
    }

    const orderList = turnOrder
      .map((c, i) => `${i + 1}. **${c.name}** (${c.isNPC ? 'NPC' : 'PJ'}): Iniciativa ${c.initiative.toFixed(1)}`)
      .join('\n');

    const combatAnnounceMsg: ChatMessage = {
      id: 'combat_' + Date.now(),
      channelId: activeChannel.id,
      senderId: 'system',
      senderName: 'Mesa Tática',
      senderAvatar: '',
      type: 'system',
      content: `⚔️ **INICIANDO COMBATE — RODADA 1**\n\n${orderList}\n\n⏱️ Primeiro a agir: **${firstCombatant.name}**!`,
      timestamp: Date.now(),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [currentMessagesKey]: [...(prev[currentMessagesKey] || []), combatAnnounceMsg],
    }));

    if (firstCombatant.isNPC && activeCampaign.gameMode === 'ai_master') {
      setTimeout(() => {
        triggerAiNpcTurn(firstCombatant.characterId, 1);
      }, 500);
    }
  };

  const handleNextTurn = () => {
    if (!activeCampaign.combat?.isActive || !activeCampaign.combat.turnOrder.length) return;

    const combat = activeCampaign.combat;
    const nextIndex = (combat.currentTurnIndex + 1) % combat.turnOrder.length;
    const nextRound = nextIndex === 0 ? combat.round + 1 : combat.round;

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === activeCampaign.id
          ? {
              ...c,
              combat: {
                ...combat,
                round: nextRound,
                currentTurnIndex: nextIndex,
              },
            }
          : c
      )
    );

    const nextCombatant = combat.turnOrder[nextIndex];
    const token = activeScene.tokens.find((t) => t.characterId === nextCombatant.characterId);
    if (token) {
      setSelectedTokenId(token.id);
    }

    const roundNotice = nextRound !== combat.round ? `\n\n🔔 **INÍCIO DA RODADA ${nextRound}!**` : '';
    const turnMsg: ChatMessage = {
      id: 'turn_' + Date.now(),
      channelId: activeChannel.id,
      senderId: 'system',
      senderName: 'Mesa Tática',
      senderAvatar: '',
      type: 'system',
      content: `⏱️ Turno de **${nextCombatant.name}** (${nextCombatant.isNPC ? 'NPC' : 'PJ'})!${roundNotice}`,
      timestamp: Date.now(),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [currentMessagesKey]: [...(prev[currentMessagesKey] || []), turnMsg],
    }));

    if (nextCombatant.isNPC && activeCampaign.gameMode === 'ai_master') {
      setTimeout(() => {
        triggerAiNpcTurn(nextCombatant.characterId, nextRound);
      }, 600);
    }
  };

  const handlePrevTurn = () => {
    if (!activeCampaign.combat?.isActive || !activeCampaign.combat.turnOrder.length) return;
    const combat = activeCampaign.combat;
    const prevIndex = (combat.currentTurnIndex - 1 + combat.turnOrder.length) % combat.turnOrder.length;
    const prevRound = combat.currentTurnIndex === 0 ? Math.max(1, combat.round - 1) : combat.round;

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === activeCampaign.id
          ? {
              ...c,
              combat: {
                ...combat,
                round: prevRound,
                currentTurnIndex: prevIndex,
              },
            }
          : c
      )
    );

    const prevCombatant = combat.turnOrder[prevIndex];
    const token = activeScene.tokens.find((t) => t.characterId === prevCombatant.characterId);
    if (token) {
      setSelectedTokenId(token.id);
    }
  };

  const handleEndCombat = () => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === activeCampaign.id ? { ...c, combat: undefined } : c))
    );

    const endMsg: ChatMessage = {
      id: 'combat_end_' + Date.now(),
      channelId: activeChannel.id,
      senderId: 'system',
      senderName: 'Mesa Tática',
      senderAvatar: '',
      type: 'system',
      content: `🏳️ **O combate foi encerrado.** Todos os combatentes saíram da ordem de iniciativa.`,
      timestamp: Date.now(),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [currentMessagesKey]: [...(prev[currentMessagesKey] || []), endMsg],
    }));
  };

  // If user is not authenticated, show AuthScreen
  if (!currentUser) {
    return <AuthScreen onSuccessLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d0f12] text-[#e2e8f0] font-sans">
      {/* Auto-Updater Notification Banner */}
      {updateInfo.status === 'downloaded' && (
        <div className="bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold shadow-2xl z-50 animate-in slide-in-from-top border-b border-[#059669]/50 select-none">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-yellow-300 animate-pulse" />
            <span>
              Nova versão do DoragonTable ({updateInfo.version || 'mais recente'}) pronta para instalar!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => (window as any).doragonAPI?.installUpdate?.()}
              className="px-3 py-1 bg-white hover:bg-[#f1f5f9] text-[#047857] text-xs font-black rounded-lg shadow transition-all transform hover:scale-105"
            >
              Reiniciar e Atualizar Agora
            </button>
            <button
              onClick={() => setUpdateInfo({ status: 'idle' })}
              className="p-1 text-white/80 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {updateInfo.status === 'downloading' && (
        <div className="bg-[#151922] border-b border-[#242b3b] text-[#94a3b8] px-4 py-2 flex items-center justify-between text-xs z-50 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-ping" />
            <span className="font-semibold text-white">
              Baixando atualização em segundo plano... {updateInfo.percent || 0}%
            </span>
          </div>
          <div className="w-32 bg-[#0d0f14] h-2 rounded-full overflow-hidden border border-[#262c38]">
            <div
              className="bg-[#3b82f6] h-full transition-all duration-300"
              style={{ width: `${updateInfo.percent || 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* 1. Leftmost Server / Navigation Column */}
        <CampaignSidebar
          campaigns={campaigns}
          activeCampaignId={activeCampaignId}
          onSelectHome={() => setActiveCampaignId(null)}
          onSelectCampaign={handleSelectCampaign}
          onOpenCreateModal={() => setShowCreateCampaign(true)}
          onOpenOllamaConfig={() => setShowOllamaConfig(true)}
        />

        {/* 2. Main Center Body: Home Hub OR Campaign View */}
        {activeCampaignId === null ? (
          /* HOME / FRIENDS & DMS VIEW */
          <HomeHub
            currentUser={currentUser}
            campaigns={campaigns}
            onSelectCampaign={handleSelectCampaign}
            onInviteFriendToCampaign={(friend, cId) => {
              // Handled inside modal
            }}
            onLogout={handleLogout}
          />
        ) : (
          /* CAMPAIGN INTERFACE VIEW */
          <div className="flex-1 flex overflow-hidden">
            {/* Collapsible Campaign Channels & Navigation */}
            {isLeftSidebarOpen && (
              <ChannelSidebar
                campaign={activeCampaign}
                activeChannelId={activeChannel.id}
                currentUser={currentUser}
                onSelectChannel={handleSelectChannel}
                onToggleGameMode={handleToggleGameMode}
                onOpenMap={() => {
                  // Toggle right dock to give pure map focus
                  setIsRightDockOpen((prev) => !prev);
                }}
                onOpenLoreBible={() => {
                  setActiveRightDockTab('lore');
                  setIsRightDockOpen(true);
                }}
                onOpenGMScreen={() => {
                  setActiveRightDockTab('gm');
                  setIsRightDockOpen(true);
                }}
                onOpenCharacterSheet={() => {
                  setActiveRightDockTab('sheet');
                  setIsRightDockOpen(true);
                }}
                onOpenInviteModal={() => setShowInviteCampaignModal(true)}
                onCollapse={() => setIsLeftSidebarOpen(false)}
                onLogout={handleLogout}
              />
            )}

          {/* Center Tactical Canvas & Right Multi-Dock */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0c10]">
            {/* Top Command Bar */}
            <div className="h-11 px-3 bg-[#131720] border-b border-[#1f2533] flex items-center justify-between text-xs select-none shadow-sm">
              {/* Left Part: Expand Left Sidebar button + Active Scene Info */}
              <div className="flex items-center gap-2">
                {!isLeftSidebarOpen && (
                  <button
                    onClick={() => setIsLeftSidebarOpen(true)}
                    className="p-1.5 rounded-lg bg-[#1a1f2c] hover:bg-[#242b3d] text-[#94a3b8] hover:text-white border border-[#262d3c] transition-colors"
                    title="Expandir Canais (Ctrl+B)"
                  >
                    <PanelLeftOpen size={14} />
                  </button>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#e63946] shadow-[0_0_8px_#e63946]" />
                  <span className="font-extrabold text-xs text-white truncate max-w-[150px]">
                    {activeScene.name}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#94a3b8] bg-[#0d0f14] px-1.5 py-0.5 rounded border border-[#1f2533]">
                    {activeScene.gridType === 'hex' ? 'Hex' : 'Quad'} {activeScene.gridSize}px
                  </span>
                </div>
              </div>

              {/* Center Part: Tactical Initiative / Scene Tokens Bar */}
              <div className="flex-1 overflow-hidden mx-3 max-w-xl">
                <SceneTokensBar
                  characters={charactersInScene}
                  selectedCharacterId={selectedCharacter?.id}
                  combat={activeCampaign.combat}
                  isGM={activeCampaign.isHost}
                  onSelectCharacter={(charId) => {
                    const token = activeScene.tokens.find((t) => t.characterId === charId);
                    if (token) setSelectedTokenId(token.id);
                  }}
                  onOpenFullSheet={(char) => setShowFullSheet(char)}
                  onUpdateHp={handleUpdateHp}
                  onStartCombat={handleStartCombat}
                  onEndCombat={handleEndCombat}
                  onNextTurn={handleNextTurn}
                  onPrevTurn={handlePrevTurn}
                />
              </div>

              {/* Right Part: Direct Dock Tab Buttons & Toggle */}
              <div className="flex items-center gap-1 bg-[#0d0f14] p-1 rounded-xl border border-[#1f2533]">
                <button
                  onClick={() => {
                    setActiveRightDockTab('chat');
                    setIsRightDockOpen(true);
                  }}
                  className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[11px] font-bold transition-all ${
                    isRightDockOpen && activeRightDockTab === 'chat'
                      ? 'bg-[#e63946] text-white shadow-sm'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                  title="Abrir Chat da Sessão"
                >
                  <MessageSquare size={13} />
                  <span>Chat</span>
                </button>
                <button
                  onClick={() => {
                    setActiveRightDockTab('sheet');
                    setIsRightDockOpen(true);
                  }}
                  className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[11px] font-bold transition-all ${
                    isRightDockOpen && activeRightDockTab === 'sheet'
                      ? 'bg-[#e63946] text-white shadow-sm'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                  title="Abrir Ficha de Personagem"
                >
                  <Shield size={13} />
                  <span>Ficha</span>
                </button>
                <button
                  onClick={() => {
                    setActiveRightDockTab('lore');
                    setIsRightDockOpen(true);
                  }}
                  className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[11px] font-bold transition-all ${
                    isRightDockOpen && activeRightDockTab === 'lore'
                      ? 'bg-[#e63946] text-white shadow-sm'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                  title="Abrir Bíblia de Lore"
                >
                  <Book size={13} />
                  <span>Lore</span>
                </button>
                {activeCampaign.isHost && (
                  <button
                    onClick={() => {
                      setActiveRightDockTab('gm');
                      setIsRightDockOpen(true);
                    }}
                    className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[11px] font-bold transition-all ${
                      isRightDockOpen && activeRightDockTab === 'gm'
                        ? 'bg-[#d4af37] text-black shadow-sm font-black'
                        : 'text-[#d4af37] hover:bg-[#d4af37]/20'
                    }`}
                    title="Escudo do Mestre (Segredos)"
                  >
                    <Crown size={13} />
                    <span>Mestre</span>
                  </button>
                )}

                <div className="w-[1px] h-3.5 bg-[#232838] mx-0.5" />

                <button
                  onClick={() => setIsRightDockOpen(!isRightDockOpen)}
                  className={`p-1 rounded-lg transition-colors ${
                    !isRightDockOpen
                      ? 'text-[#e63946] hover:bg-[#1a1f2c]'
                      : 'text-[#64748b] hover:text-white'
                  }`}
                  title={isRightDockOpen ? 'Recolher Painel (Maximizar Mapa)' : 'Expandir Painel'}
                >
                  {isRightDockOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                </button>
              </div>
            </div>

            {/* Viewport: Tactical Map Canvas + Right Multi-Dock */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Tactical Map (Takes all remaining width) */}
              <div className="flex-1 h-full overflow-hidden relative">
                <TacticalMap
                  scene={activeScene}
                  isGM={activeCampaign.isHost}
                  playerCharacterId={activeCampaign.activeCharacterId}
                  selectedTokenId={selectedTokenId}
                  activeCombatTokenId={
                    activeCampaign.combat?.isActive
                      ? activeScene.tokens.find(
                          (t) =>
                            t.characterId ===
                            activeCampaign.combat?.turnOrder[activeCampaign.combat.currentTurnIndex]?.characterId
                        )?.id
                      : undefined
                  }
                  onSelectToken={(id) => {
                    setSelectedTokenId(id);
                  }}
                  onUpdateTokenPosition={handleUpdateTokenPosition}
                  onUpdateScene={(newScene) => {
                    setCampaigns((prev) =>
                      prev.map((c) =>
                        c.id === activeCampaign.id
                          ? {
                              ...c,
                              scenes: c.scenes.map((s) => (s.id === newScene.id ? newScene : s)),
                            }
                          : c
                      )
                    );
                  }}
                  onOpenSheet={(charId) => {
                    const char = activeCampaign.characters.find((c) => c.id === charId);
                    if (char) setShowFullSheet(char);
                  }}
                />
              </div>

              {/* Right Multi-Dock */}
              <RightDock
                isOpen={isRightDockOpen}
                activeTab={activeRightDockTab}
                onSelectTab={setActiveRightDockTab}
                onToggleOpen={() => setIsRightDockOpen(!isRightDockOpen)}
                campaign={activeCampaign}
                activeChannel={activeChannel}
                activeScene={activeScene}
                selectedCharacter={selectedCharacter}
                messages={currentMessages}
                isGeneratingAI={isGeneratingAI}
                onSendMessage={handleSendMessage}
                onRollDice={handleRollDice}
                onOpenFullSheet={(char) => setShowFullSheet(char)}
                onUpdateHp={handleUpdateHp}
                onUpdateGmNotes={(notes) => {
                  setCampaigns((prev) =>
                    prev.map((c) => (c.id === activeCampaign.id ? { ...c, gmSecretNotes: notes } : c))
                  );
                }}
                onAddNPC={(npc) => {
                  setCampaigns((prev) =>
                    prev.map((c) => {
                      if (c.id !== activeCampaign.id) return c;
                      const newToken = {
                        id: 'tok_' + Date.now(),
                        characterId: npc.id,
                        name: npc.name,
                        avatar: '',
                        x: Math.floor(Math.random() * 8 + 5),
                        y: Math.floor(Math.random() * 8 + 5),
                        elevation: 0,
                        size: 1,
                        sightRadius: 6,
                        statusConditions: [],
                        color: '#f59e0b',
                      };
                      return {
                        ...c,
                        characters: [...c.characters, npc],
                        scenes: c.scenes.map((s) =>
                          s.id === activeScene.id ? { ...s, tokens: [...s.tokens, newToken] } : s
                        ),
                      };
                    })
                  );
                }}
                onAddLoreEntity={(entity) => {
                  setCampaigns((prev) =>
                    prev.map((c) =>
                      c.id === activeCampaign.id ? { ...c, loreEntities: [...c.loreEntities, entity] } : c
                    )
                  );
                }}
                onDeleteLoreEntity={(id) => {
                  setCampaigns((prev) =>
                    prev.map((c) =>
                      c.id === activeCampaign.id
                        ? { ...c, loreEntities: c.loreEntities.filter((e) => e.id !== id) }
                        : c
                    )
                  );
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Campaign Invite Modal */}
      {showInviteCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in select-none">
          <div className="w-full max-w-md bg-[#14171e] rounded-2xl border border-[#262c38] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222732] mb-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <UserPlus size={18} className="text-[#10b981]" />
                Convidar Amigos para "{activeCampaign.name}"
              </h3>
              <button
                onClick={() => setShowInviteCampaignModal(false)}
                className="text-[#64748b] hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#94a3b8] mb-4">
              Envie o código de convite abaixo para que seus amigos possam entrar nesta campanha pelo DoragonTable:
            </p>

            <div className="flex items-center gap-2 bg-[#1b2029] p-3 rounded-xl border border-[#282f3c] mb-6">
              <span className="text-xs font-mono font-bold text-[#10b981] flex-1">
                DRGN-{activeCampaign.id.toUpperCase()}-2026
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`DRGN-${activeCampaign.id.toUpperCase()}-2026`);
                  setCopiedInvite(true);
                  setTimeout(() => setCopiedInvite(false), 2000);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#242b37] hover:bg-[#2d3645] text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
              >
                {copiedInvite ? <Check size={14} className="text-[#10b981]" /> : <Copy size={14} />}
                <span>{copiedInvite ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <button
              onClick={() => setShowInviteCampaignModal(false)}
              className="w-full py-2.5 bg-[#222834] hover:bg-[#2b3240] text-white text-xs font-bold rounded-xl transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Character Sheet Modal */}
      {showFullSheet && (
        <CharacterSheetModal
          character={showFullSheet}
          isOpen={!!showFullSheet}
          onClose={() => setShowFullSheet(null)}
          onSave={(updated) => {
            setCampaigns((prev) =>
              prev.map((c) =>
                c.id === activeCampaign.id
                  ? {
                      ...c,
                      characters: c.characters.map((char) =>
                        char.id === updated.id ? updated : char
                      ),
                    }
                  : c
              )
            );
            setShowFullSheet(null);
          }}
          onRollCheck={(formula, desc, target) => {
            handleRollDice(formula, desc, target);
          }}
        />
      )}

      {/* Lore Bible Modal */}
      <LoreBibleModal
        isOpen={showLoreBible}
        onClose={() => setShowLoreBible(false)}
        loreEntities={activeCampaign.loreEntities}
        onAddEntity={(entity) => {
          setCampaigns((prev) =>
            prev.map((c) =>
              c.id === activeCampaign.id
                ? { ...c, loreEntities: [...c.loreEntities, entity] }
                : c
            )
          );
        }}
        onDeleteEntity={(id) => {
          setCampaigns((prev) =>
            prev.map((c) =>
              c.id === activeCampaign.id
                ? { ...c, loreEntities: c.loreEntities.filter((e) => e.id !== id) }
                : c
            )
          );
        }}
      />

      {/* GM Screen Modal */}
      {showGMScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-4xl bg-[#14171e] rounded-2xl border border-[#262c38] shadow-2xl flex flex-col h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-[#101318] border-b border-[#1f242e]">
              <span className="font-bold text-sm text-white">Escudo do Mestre — {activeCampaign.name}</span>
              <button
                onClick={() => setShowGMScreen(false)}
                className="p-1.5 rounded-lg hover:bg-[#1c212b] text-[#94a3b8] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <GMScreen
                campaign={activeCampaign}
                onUpdateNotes={(notes) => {
                  setCampaigns((prev) =>
                    prev.map((c) =>
                      c.id === activeCampaign.id ? { ...c, gmSecretNotes: notes } : c
                    )
                  );
                }}
                onHiddenRoll={(formula, desc) => {
                  const roll = rollDice(formula, activeCampaign.ruleset);
                  alert(`[ROLAGEM OCULTA DO MESTRE]\n${desc}: ${formula}\nResultado: ${roll.total} ${roll.breakdown}`);
                }}
                onAddNPC={(npc) => {
                  setCampaigns((prev) =>
                    prev.map((c) => {
                      if (c.id !== activeCampaign.id) return c;
                      const newToken = {
                        id: 'tok_' + Date.now(),
                        characterId: npc.id,
                        name: npc.name,
                        avatar: '',
                        x: Math.floor(Math.random() * 8 + 5),
                        y: Math.floor(Math.random() * 8 + 5),
                        elevation: 0,
                        size: 1,
                        sightRadius: 6,
                        statusConditions: [],
                        color: '#f59e0b',
                      };
                      return {
                        ...c,
                        characters: [...c.characters, npc],
                        scenes: c.scenes.map((s) =>
                          s.id === activeScene.id
                            ? { ...s, tokens: [...s.tokens, newToken] }
                            : s
                        ),
                      };
                    })
                  );
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Ollama Local AI Config Modal */}
      <OllamaConfigModal
        isOpen={showOllamaConfig}
        onClose={() => setShowOllamaConfig(false)}
        currentModel={activeCampaign.aiSettings?.model || 'fluffy/llama-3.1-8b-stheno-v3.4:latest'}
        temperature={activeCampaign.aiSettings?.temperature ?? 0.7}
        onSave={(model, temp) => {
          setCampaigns((prev) =>
            prev.map((c) =>
              c.id === activeCampaign.id
                ? {
                    ...c,
                    aiSettings: {
                      ...c.aiSettings,
                      model,
                      temperature: temp,
                    },
                  }
                : c
            )
          );
        }}
      />

      {/* Create New Campaign Modal */}
      <CreateCampaignModal
        isOpen={showCreateCampaign}
        onClose={() => setShowCreateCampaign(false)}
        onCreate={(newCamp) => {
          setCampaigns((prev) => [...prev, newCamp]);
          setActiveCampaignId(newCamp.id);
        }}
      />
      </div>
    </div>
  );
};
