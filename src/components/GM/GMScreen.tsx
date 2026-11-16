import React, { useState } from 'react';
import { Campaign, CharacterSheet } from '../../types';
import { 
  FileText, 
  Dices, 
  EyeOff, 
  Plus, 
  ShieldAlert, 
  Sparkles, 
  Users, 
  Compass, 
  Save,
  Check
} from 'lucide-react';

interface GMScreenProps {
  campaign: Campaign;
  onUpdateNotes: (notes: string) => void;
  onHiddenRoll: (formula: string, desc: string) => void;
  onAddNPC: (npc: CharacterSheet) => void;
}

export const GMScreen: React.FC<GMScreenProps> = ({
  campaign,
  onUpdateNotes,
  onHiddenRoll,
  onAddNPC,
}) => {
  const [notes, setNotes] = useState(campaign.gmSecretNotes || '');
  const [saved, setSaved] = useState(false);
  const [rollFormula, setRollFormula] = useState('1d20+3');
  const [rollDesc, setRollDesc] = useState('Percepção Oculta');

  const handleSave = () => {
    onUpdateNotes(notes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
      bio: 'Guarda local armado com espada e cota de malha.',
      notes: 'Desconfiado mas subornável com 5 moedas de ouro.',
      gurps: isGurps ? {
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
        disadvantages: ['Dever (Guarda da Cidade)'],
        skills: [{ name: 'Espada Curta', level: 12, relLevel: 'DX+1' }],
        equipment: [{ name: 'Espada', weight: 1.5, cost: 400 }],
      } : undefined,
      dnd: !isGurps ? {
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
      } : undefined,
    };

    onAddNPC(newNPC);
  };

  return (
    <div className="flex flex-col h-full bg-[#2b2d31] text-[#dbdee1] p-4 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3f4147] pb-3">
        <div className="flex items-center gap-2">
          <EyeOff size={18} className="text-[#f0b232]" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Escudo do Mestre (GM Screen)
          </h2>
        </div>
        <span className="text-[10px] bg-[#f0b232]/20 text-[#f0b232] font-semibold px-2 py-0.5 rounded-full">
          Visível apenas para o Mestre
        </span>
      </div>

      {/* Secret Notes Area */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#949ba4] uppercase flex items-center gap-1.5">
            <FileText size={14} className="text-[#5865f2]" /> Anotações Secretas da Campanha
          </label>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 text-xs bg-[#5865f2] hover:bg-[#4752c4] text-white px-2.5 py-1 rounded shadow"
          >
            {saved ? <Check size={12} className="text-[#23a55a]" /> : <Save size={12} />}
            {saved ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={7}
          placeholder="Escreva aqui segredos da trama, estatísticas de monstros, planos dos vilões, tesouros escondidos..."
          className="w-full bg-[#1e1f22] p-3 rounded-xl border border-[#3f4147] text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865f2] resize-none"
        />
      </div>

      {/* Secret Rolls */}
      <div className="p-3 bg-[#1e1f22] rounded-xl border border-[#3f4147] space-y-2">
        <div className="text-xs font-bold text-white flex items-center gap-1.5">
          <Dices size={15} className="text-[#eab308]" />
          Rolagem Secreta do Mestre
        </div>
        <p className="text-[11px] text-[#949ba4]">
          O resultado da rolagem aparecerá apenas no seu canal secreto de Mestre.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={rollDesc}
            onChange={(e) => setRollDesc(e.target.value)}
            placeholder="Motivo (ex: Emboscada)"
            className="flex-1 bg-[#2b2d31] p-1.5 rounded text-xs border border-[#3f4147] text-white"
          />
          <input
            type="text"
            value={rollFormula}
            onChange={(e) => setRollFormula(e.target.value)}
            placeholder="1d20+4 ou 3d6"
            className="w-24 bg-[#2b2d31] p-1.5 rounded text-xs font-mono text-center border border-[#3f4147] text-white"
          />
          <button
            onClick={() => onHiddenRoll(rollFormula, rollDesc)}
            className="px-3 py-1.5 bg-[#f0b232] hover:bg-yellow-500 text-black text-xs font-bold rounded shadow"
          >
            Rolar
          </button>
        </div>
      </div>

      {/* Quick NPC / Enemy Spawner */}
      <div className="p-3 bg-[#1e1f22] rounded-xl border border-[#3f4147] flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Users size={15} className="text-[#23a55a]" />
            Adicionar NPC / Monstro Rápido
          </div>
          <div className="text-[11px] text-[#949ba4]">
            Gera ficha pronta e token para a cena ativa ({campaign.ruleset.toUpperCase()})
          </div>
        </div>
        <button
          onClick={handleQuickNPC}
          className="px-3 py-1.5 bg-[#23a55a] hover:bg-[#1f9250] text-white text-xs font-bold rounded-lg shadow flex items-center gap-1"
        >
          <Plus size={14} /> + Guardião/NPC
        </button>
      </div>
    </div>
  );
};
