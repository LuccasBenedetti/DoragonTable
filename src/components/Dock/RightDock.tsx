import React, { useState } from 'react';
import { Campaign, Channel, CharacterSheet, ChatMessage, LoreEntity, Scene } from '../../types';
import { ChatArea } from '../Chat/ChatArea';
import { 
  MessageSquare, 
  Shield, 
  Book, 
  Crown, 
  ChevronRight, 
  Maximize2, 
  Dices, 
  Heart, 
  Zap, 
  Plus, 
  Trash2, 
  Search, 
  Eye, 
  EyeOff, 
  Save, 
  Check, 
  Sparkles,
  Swords,
  Scroll
} from 'lucide-react';

export type RightDockTab = 'chat' | 'sheet' | 'lore' | 'gm';

interface RightDockProps {
  isOpen: boolean;
  activeTab: RightDockTab;
  onSelectTab: (tab: RightDockTab) => void;
  onToggleOpen: () => void;
  campaign: Campaign;
  activeChannel: Channel;
  activeScene: Scene;
  selectedCharacter?: CharacterSheet;
  messages: ChatMessage[];
  isGeneratingAI: boolean;
  onSendMessage: (content: string, type: ChatMessage['type'], characterId?: string) => void;
  onRollDice: (formula: string, desc?: string, target?: number) => void;
  onOpenFullSheet: (char: CharacterSheet) => void;
  onUpdateHp: (charId: string, delta: number) => void;
  onUpdateGmNotes: (notes: string) => void;
  onAddNPC: (npc: CharacterSheet) => void;
  onAddLoreEntity: (entity: LoreEntity) => void;
  onDeleteLoreEntity: (id: string) => void;
}

export const RightDock: React.FC<RightDockProps> = ({
  isOpen,
  activeTab,
  onSelectTab,
  onToggleOpen,
  campaign,
  activeChannel,
  activeScene,
  selectedCharacter,
  messages,
  isGeneratingAI,
  onSendMessage,
  onRollDice,
  onOpenFullSheet,
  onUpdateHp,
  onUpdateGmNotes,
  onAddNPC,
  onAddLoreEntity,
  onDeleteLoreEntity,
}) => {
  // GM notes local state
  const [gmNotes, setGmNotes] = useState(campaign.gmSecretNotes || '');
  const [gmSaved, setGmSaved] = useState(false);
  const [hiddenRollFormula, setHiddenRollFormula] = useState('1d20+3');
  const [hiddenRollDesc, setHiddenRollDesc] = useState('Percepção Oculta');

  // Lore search & filter local state
  const [loreSearch, setLoreSearch] = useState('');
  const [loreCategory, setLoreCategory] = useState<string>('all');
  const [isAddingLore, setIsAddingLore] = useState(false);
  const [newLoreName, setNewLoreName] = useState('');
  const [newLoreCategory, setNewLoreCategory] = useState<LoreEntity['category']>('npc');
  const [newLoreDesc, setNewLoreDesc] = useState('');
  const [newLoreTags, setNewLoreTags] = useState('');

  if (!isOpen) return null;

  const currentSheet = selectedCharacter || campaign.characters[0];

  const handleSaveGmNotes = () => {
    onUpdateGmNotes(gmNotes);
    setGmSaved(true);
    setTimeout(() => setGmSaved(false), 2000);
  };

  const handleCreateLore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoreName.trim() || !newLoreDesc.trim()) return;

    const entity: LoreEntity = {
      id: 'lore_' + Date.now(),
      name: newLoreName.trim(),
      category: newLoreCategory,
      description: newLoreDesc.trim(),
      tags: newLoreTags.split(',').map((t) => t.trim()).filter(Boolean),
      lastUpdated: new Date().toLocaleDateString('pt-BR'),
      knownByPlayers: true,
    };

    onAddLoreEntity(entity);
    setNewLoreName('');
    setNewLoreDesc('');
    setNewLoreTags('');
    setIsAddingLore(false);
  };

  const handleQuickNPC = () => {
    const isGurps = campaign.ruleset === 'gurps';
    const newNPC: CharacterSheet = {
      id: 'npc_' + Date.now(),
      name: `Guarda da Patrulha #${Math.floor(Math.random() * 90 + 10)}`,
      avatar: '',
      isNPC: true,
      isGM: false,
      ruleset: campaign.ruleset,
      hp: isGurps ? 11 : 16,
      maxHp: isGurps ? 11 : 16,
      energy: 10,
      maxEnergy: 10,
      defense: isGurps ? 9 : 14,
      elevation: 0,
      currentSceneId: campaign.activeSceneId,
      conditions: [],
      bio: 'Guarda armado com espada e escudo.',
      notes: 'Sentinela patrulhando a área.',
      gurps: isGurps
        ? {
            pointTotal: 75,
            st: 11,
            dx: 11,
            iq: 10,
            ht: 11,
            hp: 11,
            fp: 10,
            basicSpeed: 5.5,
            basicMove: 5,
            thrustDmg: '1d-1',
            swingDmg: '1d+1',
            dodge: 9,
            parry: 9,
            block: 8,
            advantages: ['Prontidão +1'],
            disadvantages: ['Dever (Guarda)'],
            skills: [{ name: 'Espada Curta', level: 12, relLevel: 'DX+1' }],
            equipment: [{ name: 'Espada', weight: 1.5, cost: 400 }],
          }
        : undefined,
      dnd: !isGurps
        ? {
            class: 'Guerreiro',
            level: 2,
            race: 'Humano',
            alignment: 'Neutro e Bom',
            stats: { str: 14, dex: 12, con: 13, int: 10, wis: 11, cha: 10 },
            ac: 15,
            speed: 9,
            proficiencyBonus: 2,
            skills: { Atletismo: { proficient: true, bonus: 4 } },
            inventory: [{ name: 'Espada Longa', qty: 1, weight: 1.5, desc: '1d8 cortante' }],
            features: ['Retomar o Fôlego'],
          }
        : undefined,
    };

    onAddNPC(newNPC);
  };

  const getDndMod = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const filteredLore = campaign.loreEntities.filter((e) => {
    const matchCat = loreCategory === 'all' || e.category === loreCategory;
    const matchSearch =
      e.name.toLowerCase().includes(loreSearch.toLowerCase()) ||
      e.description.toLowerCase().includes(loreSearch.toLowerCase()) ||
      e.tags.some((t) => t.toLowerCase().includes(loreSearch.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="w-[390px] h-full bg-[#11141a] border-l border-[#1f2533] flex flex-col select-none z-20 shadow-2xl transition-all">
      {/* Dock Header & Navigation Tabs */}
      <div className="h-11 px-2.5 bg-[#141822] border-b border-[#1f2533] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectTab('chat')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-[#e63946] text-white shadow-sm shadow-[#e63946]/30'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1c2230]'
            }`}
            title="Chat & Rolagens"
          >
            <MessageSquare size={13} />
            <span>Chat</span>
          </button>

          <button
            onClick={() => onSelectTab('sheet')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
              activeTab === 'sheet'
                ? 'bg-[#e63946] text-white shadow-sm shadow-[#e63946]/30'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1c2230]'
            }`}
            title="Ficha do Personagem"
          >
            <Shield size={13} />
            <span>Ficha</span>
          </button>

          <button
            onClick={() => onSelectTab('lore')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
              activeTab === 'lore'
                ? 'bg-[#e63946] text-white shadow-sm shadow-[#e63946]/30'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1c2230]'
            }`}
            title="Bíblia de Lore (Memória IA)"
          >
            <Book size={13} />
            <span>Lore</span>
          </button>

          {campaign.isHost && (
            <button
              onClick={() => onSelectTab('gm')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
                activeTab === 'gm'
                  ? 'bg-[#d4af37] text-black shadow-sm'
                  : 'text-[#d4af37] hover:bg-[#d4af37]/15'
              }`}
              title="Escudo do Mestre"
            >
              <Crown size={13} />
              <span>Mestre</span>
            </button>
          )}
        </div>

        {/* Close / Collapse Button */}
        <button
          onClick={onToggleOpen}
          className="p-1 rounded-lg hover:bg-[#1f2636] text-[#64748b] hover:text-white transition-colors"
          title="Recolher Painel Direito (Maximizar Mapa)"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Tab 1: Chat Area */}
      {activeTab === 'chat' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatArea
            channelName={activeChannel.name}
            messages={messages}
            characters={campaign.characters}
            activeCharacterId={currentSheet?.id}
            isAIMasterMode={campaign.gameMode === 'ai_master'}
            isGeneratingAI={isGeneratingAI}
            ruleset={campaign.ruleset}
            onSendMessage={onSendMessage}
            onRollDice={onRollDice}
          />
        </div>
      )}

      {/* Tab 2: Embedded Character Sheet */}
      {activeTab === 'sheet' && currentSheet && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Character Header Card */}
          <div className="bg-[#161a24] p-3 rounded-2xl border border-[#232938] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#1e2330] border-2 border-[#e63946] flex items-center justify-center font-bold text-sm text-white overflow-hidden shadow">
                {currentSheet.avatar ? (
                  <img src={currentSheet.avatar} alt={currentSheet.name} className="w-full h-full object-cover" />
                ) : (
                  currentSheet.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-white truncate max-w-[170px]">{currentSheet.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#e63946]/20 text-[#ff4d5a] border border-[#e63946]/30">
                    {currentSheet.ruleset.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-[#94a3b8]">
                    {currentSheet.ruleset === 'dnd5e'
                      ? `${currentSheet.dnd?.class || 'Aventureiro'} Nv. ${currentSheet.dnd?.level || 1}`
                      : `${currentSheet.gurps?.pointTotal || 100} pts`}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenFullSheet(currentSheet)}
              className="p-1.5 rounded-lg bg-[#222836] hover:bg-[#2b3346] text-[#94a3b8] hover:text-white transition-colors"
              title="Abrir Ficha Detalhada (Modal)"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Vital Bars */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#161a24] p-2.5 rounded-xl border border-[#232938] flex flex-col items-center">
              <span className="text-[10px] font-bold text-[#94a3b8] uppercase flex items-center gap-1">
                <Heart size={11} className="text-[#e63946]" /> PV
              </span>
              <span className="text-sm font-black text-white mt-0.5 font-mono">
                {currentSheet.hp} / {currentSheet.maxHp}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => onUpdateHp(currentSheet.id, -1)}
                  className="w-5 h-5 rounded bg-[#222836] hover:bg-[#2e3648] text-xs font-bold text-white flex items-center justify-center"
                >
                  -
                </button>
                <button
                  onClick={() => onUpdateHp(currentSheet.id, 1)}
                  className="w-5 h-5 rounded bg-[#222836] hover:bg-[#2e3648] text-xs font-bold text-white flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-[#161a24] p-2.5 rounded-xl border border-[#232938] flex flex-col items-center">
              <span className="text-[10px] font-bold text-[#94a3b8] uppercase flex items-center gap-1">
                <Zap size={11} className="text-[#d4af37]" /> {currentSheet.ruleset === 'gurps' ? 'FP' : 'Mana'}
              </span>
              <span className="text-sm font-black text-white mt-0.5 font-mono">
                {currentSheet.energy} / {currentSheet.maxEnergy}
              </span>
              <span className="text-[9px] text-[#64748b] mt-1 font-semibold">Energia</span>
            </div>

            <div className="bg-[#161a24] p-2.5 rounded-xl border border-[#232938] flex flex-col items-center">
              <span className="text-[10px] font-bold text-[#94a3b8] uppercase flex items-center gap-1">
                <Shield size={11} className="text-[#3b82f6]" /> {currentSheet.ruleset === 'gurps' ? 'Defesa' : 'CA'}
              </span>
              <span className="text-sm font-black text-white mt-0.5 font-mono">
                {currentSheet.defense}
              </span>
              <span className="text-[9px] text-[#64748b] mt-1 font-semibold">Armadura</span>
            </div>
          </div>

          {/* D&D Attributes Grid */}
          {currentSheet.ruleset === 'dnd5e' && currentSheet.dnd && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  Atributos (Clique p/ Rolar)
                </span>
                <span className="text-[10px] text-[#94a3b8] font-mono">
                  Prof: +{currentSheet.dnd.proficiencyBonus}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'str', label: 'FOR' },
                  { key: 'dex', label: 'DES' },
                  { key: 'con', label: 'CON' },
                  { key: 'int', label: 'INT' },
                  { key: 'wis', label: 'SAB' },
                  { key: 'cha', label: 'CAR' },
                ].map(({ key, label }) => {
                  const score = (currentSheet.dnd?.stats as any)?.[key] || 10;
                  const mod = getDndMod(score);
                  return (
                    <button
                      key={key}
                      onClick={() => onRollDice(`1d20${mod}`, `Teste de ${label} (${currentSheet.name})`)}
                      className="bg-[#161a24] hover:bg-[#1e2330] p-2 rounded-xl border border-[#232938] hover:border-[#e63946] flex flex-col items-center transition-all group"
                    >
                      <span className="text-[10px] font-extrabold text-[#94a3b8] group-hover:text-[#ff4d5a]">
                        {label}
                      </span>
                      <span className="text-base font-black text-white">{mod}</span>
                      <span className="text-[9px] text-[#64748b] font-mono">{score}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* GURPS Attributes Grid */}
          {currentSheet.ruleset === 'gurps' && currentSheet.gurps && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  Atributos (Clique p/ Testar 3d6)
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'ST', val: currentSheet.gurps.st },
                  { label: 'DX', val: currentSheet.gurps.dx },
                  { label: 'IQ', val: currentSheet.gurps.iq },
                  { label: 'HT', val: currentSheet.gurps.ht },
                ].map(({ label, val }) => (
                  <button
                    key={label}
                    onClick={() => onRollDice('3d6', `Teste de ${label} (Alvo: ${val})`, val)}
                    className="bg-[#161a24] hover:bg-[#1e2330] p-2 rounded-xl border border-[#232938] hover:border-[#e63946] flex flex-col items-center transition-all group"
                  >
                    <span className="text-[10px] font-extrabold text-[#94a3b8] group-hover:text-[#ff4d5a]">
                      {label}
                    </span>
                    <span className="text-sm font-black text-white">{val}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attacks / Actions */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block mb-2">
              Ações Rápidas & Ataques
            </span>
            <div className="space-y-1.5">
              {currentSheet.ruleset === 'dnd5e' && currentSheet.dnd?.inventory.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#161a24] p-2.5 rounded-xl border border-[#232938] flex items-center justify-between"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">{item.name}</span>
                    <span className="text-[10px] text-[#94a3b8]">{item.desc}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onRollDice('1d20+5', `Ataque com ${item.name}`)}
                      className="px-2 py-1 bg-[#222836] hover:bg-[#e63946] text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Dices size={10} /> Atk
                    </button>
                    {item.desc.includes('d') && (
                      <button
                        onClick={() => {
                          const match = item.desc.match(/(\d+d\d+(?:\+\d+)?)/);
                          const formula = match ? match[1] : '1d8';
                          onRollDice(formula, `Dano de ${item.name}`);
                        }}
                        className="px-2 py-1 bg-[#222836] hover:bg-[#e63946] text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Swords size={10} /> Dano
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {currentSheet.ruleset === 'gurps' && currentSheet.gurps?.skills.map((sk, idx) => (
                <div
                  key={idx}
                  className="bg-[#161a24] p-2 rounded-xl border border-[#232938] flex items-center justify-between"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">{sk.name}</span>
                    <span className="text-[10px] text-[#94a3b8] font-mono">Nível {sk.level} ({sk.relLevel})</span>
                  </div>
                  <button
                    onClick={() => onRollDice('3d6', `Perícia: ${sk.name}`, sk.level)}
                    className="px-2.5 py-1 bg-[#222836] hover:bg-[#e63946] text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Dices size={11} /> 3d6
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Lore & World Bible */}
      {activeTab === 'lore' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Book size={14} className="text-[#d4af37]" /> Memória do Mundo
            </span>
            <button
              onClick={() => setIsAddingLore(!isAddingLore)}
              className="px-2 py-1 rounded-lg bg-[#222836] hover:bg-[#e63946] text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
            >
              <Plus size={12} /> {isAddingLore ? 'Cancelar' : 'Novo'}
            </button>
          </div>

          {/* Add Lore Inline Form */}
          {isAddingLore && (
            <form onSubmit={handleCreateLore} className="bg-[#161a24] p-3 rounded-xl border border-[#262d3c] space-y-2">
              <input
                type="text"
                placeholder="Nome da Entidade / Local / NPC"
                value={newLoreName}
                onChange={(e) => setNewLoreName(e.target.value)}
                className="w-full bg-[#11141a] px-2.5 py-1.5 rounded-lg text-xs text-white border border-[#242b3a] focus:outline-none focus:border-[#e63946]"
                required
              />
              <select
                value={newLoreCategory}
                onChange={(e) => setNewLoreCategory(e.target.value as any)}
                className="w-full bg-[#11141a] px-2.5 py-1.5 rounded-lg text-xs text-white border border-[#242b3a] focus:outline-none"
              >
                <option value="npc">NPC / Personagem</option>
                <option value="location">Local / Região</option>
                <option value="faction">Facção / Ordem</option>
                <option value="item">Item / Artefato</option>
                <option value="secret">Segredo Oculto</option>
              </select>
              <textarea
                placeholder="Descrição e fatos que a IA deve lembrar..."
                value={newLoreDesc}
                onChange={(e) => setNewLoreDesc(e.target.value)}
                rows={2}
                className="w-full bg-[#11141a] px-2.5 py-1.5 rounded-lg text-xs text-white border border-[#242b3a] focus:outline-none focus:border-[#e63946]"
                required
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-[#e63946] hover:bg-[#d02e3b] text-white text-xs font-bold rounded-lg transition-colors shadow"
              >
                Salvar na Memória
              </button>
            </form>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-[#64748b]" />
            <input
              type="text"
              placeholder="Buscar lore..."
              value={loreSearch}
              onChange={(e) => setLoreSearch(e.target.value)}
              className="w-full bg-[#161a24] pl-8 pr-3 py-1.5 rounded-xl text-xs text-white border border-[#232938] focus:outline-none focus:border-[#e63946]"
            />
          </div>

          {/* Lore Entries List */}
          <div className="space-y-2">
            {filteredLore.map((ent) => (
              <div key={ent.id} className="bg-[#161a24] p-3 rounded-xl border border-[#232938] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white truncate max-w-[200px]">{ent.name}</span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#222836] text-[#d4af37]">
                    {ent.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#94a3b8] leading-relaxed line-clamp-3">{ent.description}</p>
                <div className="flex items-center justify-between pt-1 text-[9px] text-[#64748b]">
                  <span>{ent.tags.join(', ')}</span>
                  <button
                    onClick={() => onDeleteLoreEntity(ent.id)}
                    className="hover:text-red-400 p-0.5"
                    title="Excluir"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: GM Screen */}
      {activeTab === 'gm' && campaign.isHost && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#d4af37] flex items-center gap-1.5">
              <Crown size={14} /> Escudo do Mestre
            </span>
            <button
              onClick={handleQuickNPC}
              className="px-2.5 py-1 rounded-lg bg-[#d4af37] text-black text-[10px] font-extrabold hover:bg-[#e0bb3e] transition-colors flex items-center gap-1"
            >
              <Plus size={12} /> Gerar Guarda / NPC
            </button>
          </div>

          {/* Hidden Roll Box */}
          <div className="bg-[#161a24] p-3 rounded-xl border border-[#262d3c] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37] block">
              Rolagem Oculta do Mestre
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={hiddenRollDesc}
                onChange={(e) => setHiddenRollDesc(e.target.value)}
                placeholder="Motivo (ex: Percepção)"
                className="flex-1 bg-[#11141a] px-2 py-1 rounded-lg text-xs text-white border border-[#232938] focus:outline-none"
              />
              <input
                type="text"
                value={hiddenRollFormula}
                onChange={(e) => setHiddenRollFormula(e.target.value)}
                placeholder="1d20+3"
                className="w-20 bg-[#11141a] px-2 py-1 rounded-lg text-xs font-mono font-bold text-white border border-[#232938] focus:outline-none"
              />
              <button
                onClick={() => {
                  alert(`[ROLAGEM OCULTA DO MESTRE]\n${hiddenRollDesc}: ${hiddenRollFormula}`);
                }}
                className="px-3 py-1 bg-[#222836] hover:bg-[#d4af37] hover:text-black text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Dices size={12} /> Rolar
              </button>
            </div>
          </div>

          {/* GM Secret Notes */}
          <div className="bg-[#161a24] p-3 rounded-xl border border-[#262d3c] space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                Anotações Secretas da Sessão
              </span>
              <button
                onClick={handleSaveGmNotes}
                className="px-2 py-0.5 rounded bg-[#222836] hover:bg-[#10b981] hover:text-white text-[10px] font-bold text-[#94a3b8] flex items-center gap-1 transition-colors"
              >
                {gmSaved ? <Check size={11} className="text-[#10b981]" /> : <Save size={11} />}
                <span>{gmSaved ? 'Salvo!' : 'Salvar'}</span>
              </button>
            </div>
            <textarea
              value={gmNotes}
              onChange={(e) => setGmNotes(e.target.value)}
              placeholder="Segredos dos monstros, armadilhas, senhas e planos dos vilões..."
              rows={8}
              className="w-full bg-[#11141a] p-2 rounded-lg text-xs text-white border border-[#232938] focus:outline-none focus:border-[#d4af37] resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
