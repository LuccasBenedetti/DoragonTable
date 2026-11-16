import React, { useState } from 'react';
import { Campaign, RulesetType, GameMode } from '../../types';
import { X, Sparkles, Shield, Bot, Users } from 'lucide-react';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (campaign: Campaign) => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏰');
  const [ruleset, setRuleset] = useState<RulesetType>('dnd5e');
  const [gameMode, setGameMode] = useState<GameMode>('ai_master');
  const [loreIntro, setLoreIntro] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const campaignId = 'camp_' + Date.now();
    const sceneId = 'scene_' + Date.now();

    const isGurps = ruleset === 'gurps';

    const newCampaign: Campaign = {
      id: campaignId,
      name: name.trim(),
      description: loreIntro || 'Uma nova campanha épica começa agora.',
      icon,
      ruleset,
      gameMode,
      hostName: 'Mestre da Sessão',
      isHost: true,
      channels: [
        { id: 'chan_scene_1', name: 'taverna-inicial', type: 'scene' },
        { id: 'chan_dice_1', name: 'dados-e-combate', type: 'dice' },
        { id: 'chan_ooc_1', name: 'geral-ooc', type: 'ooc' },
        { id: 'chan_gm_1', name: 'anotacoes-do-mestre', type: 'gm_notes', isPrivateGM: true },
      ],
      scenes: [
        {
          id: sceneId,
          name: 'Taverna do Javali Saltitante',
          description: 'Uma taverna rústica aquecida por uma lareira crepitante. Há mesas de madeira maciça, um balcão com canecas de hidromel e uma escada de madeira que sobe para o mezanino (+3m de altura).',
          gridType: 'hex',
          gridSize: 50,
          width: 25,
          height: 18,
          walls: [
            { id: 'w1', x1: 50, y1: 50, x2: 1200, y2: 50, height: 4, blocksSight: true, blocksMovement: true },
            { id: 'w2', x1: 50, y1: 50, x2: 50, y2: 850, height: 4, blocksSight: true, blocksMovement: true },
            { id: 'w3', x1: 1200, y1: 50, x2: 1200, y2: 850, height: 4, blocksSight: true, blocksMovement: true },
          ],
          elevationZones: [
            { id: 'z1', name: 'Mezanino Superior', x: 2, y: 2, width: 6, height: 4, elevation: 3, color: 'rgba(234, 179, 8, 0.25)' },
          ],
          tokens: [
            {
              id: 'tok_1',
              characterId: 'char_1',
              name: 'Thorne',
              avatar: '',
              x: 8,
              y: 8,
              elevation: 0,
              size: 1,
              sightRadius: 8,
              statusConditions: [],
              color: '#3b82f6',
            },
            {
              id: 'tok_2',
              characterId: 'char_2',
              name: 'Taverneiro Barnaby',
              avatar: '',
              x: 14,
              y: 4,
              elevation: 0,
              size: 1,
              sightRadius: 6,
              statusConditions: [],
              color: '#10b981',
            },
          ],
          fogOfWarEnabled: false,
        },
      ],
      activeSceneId: sceneId,
      activeChannelId: 'chan_scene_1',
      characters: [
        {
          id: 'char_1',
          name: 'Thorne Valen',
          avatar: '',
          isNPC: false,
          isGM: false,
          ruleset,
          hp: isGurps ? 12 : 24,
          maxHp: isGurps ? 12 : 24,
          energy: isGurps ? 11 : 12,
          maxEnergy: isGurps ? 11 : 12,
          defense: isGurps ? 10 : 16,
          elevation: 0,
          currentSceneId: sceneId,
          conditions: [],
          bio: 'Guerreiro veterano em busca de redenção nas fronteiras do reino.',
          notes: 'Possui uma dívida antiga com uma guilda de ladrões.',
          gurps: isGurps ? {
            pointTotal: 150,
            st: 13,
            dx: 12,
            iq: 10,
            ht: 12,
            hp: 13,
            fp: 12,
            basicSpeed: 6.0,
            basicMove: 6,
            thrustDmg: '1d',
            swingDmg: '2d-1',
            dodge: 9,
            parry: 10,
            block: 10,
            advantages: ['Aptidão Mágica 0', 'Reflexos em Combate'],
            disadvantages: ['Código de Honra dos Cavaleiros', 'Inimigo (Guilda Oculta)'],
            skills: [
              { name: 'Espada de Duas Mãos', level: 14, relLevel: 'DX+2' },
              { name: 'Táticas de Combate', level: 11, relLevel: 'IQ+1' },
              { name: 'Sobrevivência', level: 12, relLevel: 'Per+1' },
            ],
            equipment: [
              { name: 'Montante', weight: 3.0, cost: 800 },
              { name: 'Armadura de Couro Batido', weight: 8.0, cost: 500 },
            ],
          } : undefined,
          dnd: !isGurps ? {
            class: 'Paladino',
            level: 3,
            race: 'Humano',
            alignment: 'Leal e Bom',
            stats: { str: 16, dex: 10, con: 14, int: 10, wis: 12, cha: 15 },
            ac: 18,
            speed: 9,
            proficiencyBonus: 2,
            skills: { Atletismo: { proficient: true, bonus: 5 }, Persuasão: { proficient: true, bonus: 4 } },
            inventory: [{ name: 'Espada Longa', qty: 1, weight: 1.5, desc: '1d8 cortante' }, { name: 'Escudo', qty: 1, weight: 3, desc: '+2 CA' }],
            features: ['Cura pelas Mãos', 'Destruição Divina'],
          } : undefined,
        },
        {
          id: 'char_2',
          name: 'Taverneiro Barnaby',
          avatar: '',
          isNPC: true,
          isGM: false,
          ruleset,
          hp: 10,
          maxHp: 10,
          energy: 10,
          maxEnergy: 10,
          defense: 10,
          elevation: 0,
          currentSceneId: sceneId,
          conditions: [],
          bio: 'Dono da taverna local, homem robusto e falante com um avental de couro.',
          notes: 'Conhece quase todos os rumores da região.',
        },
      ],
      activeCharacterId: 'char_1',
      loreEntities: [
        {
          id: 'lore_1',
          name: 'Taverna do Javali Saltitante',
          category: 'location',
          description: 'Ponto de encontro central da vila de Oakhaven. Famosa pelo seu hidromel temperado e pela clientela de caçadores e viajantes.',
          tags: ['taverna', 'vila', 'ponto_de_encontro'],
          lastUpdated: new Date().toLocaleDateString('pt-BR'),
          knownByPlayers: true,
        },
        {
          id: 'lore_2',
          name: 'Barnaby o Taverneiro',
          category: 'npc',
          description: 'Ex-aventureiro aposentado após perder a flexibilidade do joelho esquerdo. Homem justo, mas não tolera brigas que quebrem suas mesas de carvalho.',
          tags: ['npc', 'taverneiro', 'ex_aventureiro'],
          lastUpdated: new Date().toLocaleDateString('pt-BR'),
          knownByPlayers: true,
        },
        {
          id: 'lore_3',
          name: 'Culto da Lua de Sangue',
          category: 'secret',
          description: 'Seita que opera nas criptas subterrâneas abaixo do cemitério da vila. Planejam sacrificar um forasteiro no solstício.',
          tags: ['seita', 'vilao', 'segredo_mestre'],
          lastUpdated: new Date().toLocaleDateString('pt-BR'),
          knownByPlayers: false,
        },
      ],
      gmSecretNotes: 'O taverneiro Barnaby está sendo extorquido pelo Culto da Lua de Sangue. Se os jogadores notarem seu nervosismo (Percepção CD 13 ou IQ no GURPS), ele pode pedir ajuda.',
      aiSettings: {
        model: 'fluffy/llama-3.1-8b-stheno-v3.4:latest',
        temperature: 0.7,
        systemPrompt: 'Você é um Mestre de RPG envolvente e dinâmico.',
        autoLogEntities: true,
      },
    };

    onCreate(newCampaign);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#313338] rounded-2xl border border-[#3f4147] shadow-2xl flex flex-col overflow-hidden text-[#dbdee1]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#2b2d31] border-b border-[#1f2023]">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#5865f2]" />
            <h2 className="text-base font-bold text-white">Criar Nova Campanha (Servidor)</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#35373c] text-[#949ba4] hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#949ba4] uppercase block mb-1">Ícone</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-12 h-10 bg-[#1e1f22] text-xl text-center rounded-lg border border-[#3f4147] text-white focus:outline-none focus:border-[#5865f2]"
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-bold text-[#949ba4] uppercase block mb-1">Nome da Campanha</label>
              <input
                type="text"
                required
                placeholder="Ex: As Crônicas de Aethelgard"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1e1f22] p-2.5 rounded-lg text-xs border border-[#3f4147] text-white focus:outline-none focus:border-[#5865f2]"
              />
            </div>
          </div>

          {/* Ruleset Choice */}
          <div>
            <label className="text-[11px] font-bold text-[#949ba4] uppercase block mb-1.5">
              Sistema de Regras (Modular)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRuleset('dnd5e')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  ruleset === 'dnd5e'
                    ? 'border-[#5865f2] bg-[#5865f2]/10 text-white'
                    : 'border-[#3f4147] bg-[#2b2d31] text-[#949ba4] hover:text-[#dbdee1]'
                }`}
              >
                <div className="font-bold text-xs text-white">D&D 5ª Edição</div>
                <div className="text-[10px] text-[#949ba4]">Sistema d20 com Vantagem/Desvantagem</div>
              </button>

              <button
                type="button"
                onClick={() => setRuleset('gurps')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  ruleset === 'gurps'
                    ? 'border-[#5865f2] bg-[#5865f2]/10 text-white'
                    : 'border-[#3f4147] bg-[#2b2d31] text-[#949ba4] hover:text-[#dbdee1]'
                }`}
              >
                <div className="font-bold text-xs text-white">GURPS 4ª Edição</div>
                <div className="text-[10px] text-[#949ba4]">Sistema 3d6 (menor ou igual a perícia)</div>
              </button>
            </div>
          </div>

          {/* Game Mode Choice */}
          <div>
            <label className="text-[11px] font-bold text-[#949ba4] uppercase block mb-1.5">
              Modo de Jogo Principal
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGameMode('ai_master')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  gameMode === 'ai_master'
                    ? 'border-[#5865f2] bg-[#5865f2]/15 text-white'
                    : 'border-[#3f4147] bg-[#2b2d31] text-[#949ba4]'
                }`}
              >
                <Bot size={18} className="text-[#5865f2]" />
                <div>
                  <div className="font-bold text-xs text-white">Modo IA Local</div>
                  <div className="text-[10px] text-[#949ba4]">Mestre IA Inteligente</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setGameMode('multiplayer')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  gameMode === 'multiplayer'
                    ? 'border-[#23a55a] bg-[#23a55a]/15 text-white'
                    : 'border-[#3f4147] bg-[#2b2d31] text-[#949ba4]'
                }`}
              >
                <Users size={18} className="text-[#23a55a]" />
                <div>
                  <div className="font-bold text-xs text-white">Multijogador (LAN)</div>
                  <div className="text-[10px] text-[#949ba4]">Mestre Humano / Amigos</div>
                </div>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold text-[#949ba4] uppercase block mb-1">
              Introdução do Mundo / Cenário
            </label>
            <textarea
              rows={3}
              placeholder="Descreva brevemente o tom do mundo, facções ou o ponto de partida..."
              value={loreIntro}
              onChange={(e) => setLoreIntro(e.target.value)}
              className="w-full bg-[#1e1f22] p-2.5 rounded-lg text-xs border border-[#3f4147] text-white focus:outline-none focus:border-[#5865f2] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1f2023]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#949ba4] hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg shadow-md"
            >
              Iniciar Campanha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
