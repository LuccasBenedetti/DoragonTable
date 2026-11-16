import React, { useState } from 'react';
import { CharacterSheet, RulesetType } from '../../types';
import { X, Dices, Shield, Heart, Zap, Award, BookOpen, Backpack, Plus } from 'lucide-react';

interface CharacterSheetModalProps {
  character: CharacterSheet;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: CharacterSheet) => void;
  onRollCheck: (formula: string, desc: string, target?: number) => void;
}

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({
  character,
  isOpen,
  onClose,
  onSave,
  onRollCheck,
}) => {
  const [sheet, setSheet] = useState<CharacterSheet>(character);
  const [activeTab, setActiveTab] = useState<'main' | 'skills' | 'inventory' | 'bio'>('main');

  if (!isOpen) return null;

  const handleStatChange = (stat: string, val: number) => {
    if (sheet.ruleset === 'dnd5e' && sheet.dnd) {
      setSheet({
        ...sheet,
        dnd: {
          ...sheet.dnd,
          stats: { ...sheet.dnd.stats, [stat]: val },
        },
      });
    } else if (sheet.ruleset === 'gurps' && sheet.gurps) {
      setSheet({
        ...sheet,
        gurps: {
          ...sheet.gurps,
          [stat]: val,
        },
      });
    }
  };

  const getDndMod = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-[#313338] rounded-2xl border border-[#3f4147] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#dbdee1]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#2b2d31] border-b border-[#1f2023]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1e1f22] border-2 border-[#5865f2] flex items-center justify-center font-bold text-lg text-white">
              {sheet.avatar ? (
                <img src={sheet.avatar} alt={sheet.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                sheet.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sheet.name}
                  onChange={(e) => setSheet({ ...sheet, name: e.target.value })}
                  className="bg-transparent font-bold text-lg text-white border-b border-transparent hover:border-[#5865f2] focus:border-[#5865f2] focus:outline-none"
                />
                <span className="text-[11px] font-semibold bg-[#5865f2] text-white px-2 py-0.5 rounded-full uppercase">
                  {sheet.ruleset.toUpperCase()}
                </span>
                {sheet.isNPC && (
                  <span className="text-[11px] font-semibold bg-[#eab308] text-black px-2 py-0.5 rounded-full uppercase">
                    NPC
                  </span>
                )}
              </div>
              <p className="text-xs text-[#949ba4]">
                {sheet.ruleset === 'dnd5e'
                  ? `${sheet.dnd?.race || 'Humano'} ${sheet.dnd?.class || 'Guerreiro'} Nv. ${sheet.dnd?.level || 1}`
                  : `Total de Pontos: ${sheet.gurps?.pointTotal || 100} pts`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#35373c] text-[#949ba4] hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#2b2d31] bg-[#2b2d31]/50 px-4">
          <button
            onClick={() => setActiveTab('main')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'main'
                ? 'border-[#5865f2] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <Shield size={14} /> Atributos & Combate
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'skills'
                ? 'border-[#5865f2] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <Award size={14} /> Perícias & Vantagens
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'inventory'
                ? 'border-[#5865f2] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <Backpack size={14} /> Inventário
          </button>
          <button
            onClick={() => setActiveTab('bio')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'bio'
                ? 'border-[#5865f2] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <BookOpen size={14} /> História & Anotações
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'main' && (
            <>
              {/* Vital Stats Bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#2b2d31] p-3 rounded-xl border border-[#3f4147] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#949ba4] uppercase flex items-center gap-1">
                      <Heart size={13} className="text-[#da373c]" /> Pontos de Vida (PV)
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        value={sheet.hp}
                        onChange={(e) => setSheet({ ...sheet, hp: parseInt(e.target.value) || 0 })}
                        className="w-12 bg-[#1e1f22] p-1 rounded font-bold text-center text-white"
                      />
                      <span className="text-[#949ba4]">/</span>
                      <input
                        type="number"
                        value={sheet.maxHp}
                        onChange={(e) => setSheet({ ...sheet, maxHp: parseInt(e.target.value) || 1 })}
                        className="w-12 bg-[#1e1f22] p-1 rounded font-bold text-center text-[#949ba4]"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#2b2d31] p-3 rounded-xl border border-[#3f4147] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#949ba4] uppercase flex items-center gap-1">
                      <Zap size={13} className="text-[#eab308]" />
                      {sheet.ruleset === 'gurps' ? 'Pontos de Fadiga (FP)' : 'Mana / Energia'}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        value={sheet.energy}
                        onChange={(e) => setSheet({ ...sheet, energy: parseInt(e.target.value) || 0 })}
                        className="w-12 bg-[#1e1f22] p-1 rounded font-bold text-center text-white"
                      />
                      <span className="text-[#949ba4]">/</span>
                      <input
                        type="number"
                        value={sheet.maxEnergy}
                        onChange={(e) => setSheet({ ...sheet, maxEnergy: parseInt(e.target.value) || 1 })}
                        className="w-12 bg-[#1e1f22] p-1 rounded font-bold text-center text-[#949ba4]"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#2b2d31] p-3 rounded-xl border border-[#3f4147] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#949ba4] uppercase flex items-center gap-1">
                      <Shield size={13} className="text-[#5865f2]" />
                      {sheet.ruleset === 'gurps' ? 'Esquiva / Defesa' : 'Classe de Armadura (CA)'}
                    </span>
                    <input
                      type="number"
                      value={sheet.defense}
                      onChange={(e) => setSheet({ ...sheet, defense: parseInt(e.target.value) || 10 })}
                      className="w-14 bg-[#1e1f22] p-1 rounded font-bold text-center text-white mt-1 text-base"
                    />
                  </div>
                </div>
              </div>

              {/* D&D 5e Attributes */}
              {sheet.ruleset === 'dnd5e' && sheet.dnd && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#949ba4] mb-2">
                    Atributos Principais (d20)
                  </h3>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { key: 'str', label: 'FOR' },
                      { key: 'dex', label: 'DES' },
                      { key: 'con', label: 'CON' },
                      { key: 'int', label: 'INT' },
                      { key: 'wis', label: 'SAB' },
                      { key: 'cha', label: 'CAR' },
                    ].map(({ key, label }) => {
                      const score = (sheet.dnd?.stats as any)?.[key] || 10;
                      const mod = getDndMod(score);
                      return (
                        <div
                          key={key}
                          className="bg-[#2b2d31] p-2.5 rounded-xl border border-[#3f4147] text-center flex flex-col items-center hover:border-[#5865f2] group transition-all"
                        >
                          <span className="text-[11px] font-bold text-[#949ba4]">{label}</span>
                          <span className="text-lg font-black text-white">{mod}</span>
                          <input
                            type="number"
                            value={score}
                            onChange={(e) => handleStatChange(key, parseInt(e.target.value) || 10)}
                            className="w-10 text-[11px] bg-[#1e1f22] text-center text-[#949ba4] rounded mt-1"
                          />
                          <button
                            onClick={() => onRollCheck(`1d20${mod}`, `Teste de ${label}`)}
                            className="mt-2 text-[10px] bg-[#35373c] group-hover:bg-[#5865f2] text-white px-2 py-1 rounded flex items-center gap-1"
                          >
                            <Dices size={11} /> Rolar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* GURPS 4e Attributes */}
              {sheet.ruleset === 'gurps' && sheet.gurps && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#949ba4] mb-2">
                      Atributos Primários GURPS (3d6 Menor ou Igual)
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { key: 'st', label: 'ST (Força)', pts: 10 },
                        { key: 'dx', label: 'DX (Destreza)', pts: 20 },
                        { key: 'iq', label: 'IQ (Inteligência)', pts: 20 },
                        { key: 'ht', label: 'HT (Vitalidade)', pts: 10 },
                      ].map(({ key, label }) => {
                        const score = (sheet.gurps as any)?.[key] || 10;
                        return (
                          <div
                            key={key}
                            className="bg-[#2b2d31] p-3 rounded-xl border border-[#3f4147] text-center flex flex-col items-center hover:border-[#5865f2] group transition-all"
                          >
                            <span className="text-xs font-bold text-[#949ba4]">{label}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="number"
                                value={score}
                                onChange={(e) => handleStatChange(key, parseInt(e.target.value) || 10)}
                                className="w-12 text-xl font-black bg-[#1e1f22] text-center text-white rounded p-1"
                              />
                            </div>
                            <button
                              onClick={() => onRollCheck(`3d6`, `Teste de ${label.split(' ')[0]}`, score)}
                              className="mt-2 text-[11px] bg-[#35373c] group-hover:bg-[#5865f2] text-white px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold"
                            >
                              <Dices size={12} /> Testar (≤{score})
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Secondary stats */}
                  <div className="grid grid-cols-4 gap-2 bg-[#2b2d31] p-3 rounded-xl border border-[#3f4147] text-xs">
                    <div>
                      <span className="text-[#949ba4]">Dano GdP:</span>{' '}
                      <span className="font-bold text-white">{sheet.gurps.thrustDmg || '1d-2'}</span>
                    </div>
                    <div>
                      <span className="text-[#949ba4]">Dano Golpe:</span>{' '}
                      <span className="font-bold text-white">{sheet.gurps.swingDmg || '1d-1'}</span>
                    </div>
                    <div>
                      <span className="text-[#949ba4]">Deslocamento:</span>{' '}
                      <span className="font-bold text-white">{sheet.gurps.basicMove || 5} m/s</span>
                    </div>
                    <div>
                      <span className="text-[#949ba4]">Esquiva:</span>{' '}
                      <button
                        onClick={() => onRollCheck(`3d6`, 'Esquiva GURPS', sheet.gurps?.dodge || 8)}
                        className="font-bold text-[#5865f2] hover:underline"
                      >
                        {sheet.gurps.dodge || 8}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#949ba4]">
                  Lista de Perícias & Especialidades
                </h3>
              </div>

              {sheet.ruleset === 'gurps' && sheet.gurps?.skills && (
                <div className="grid grid-cols-2 gap-2">
                  {sheet.gurps.skills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-[#2b2d31] rounded-lg border border-[#3f4147] hover:border-[#5865f2]"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{skill.name}</div>
                        <div className="text-[10px] text-[#949ba4]">{skill.relLevel}</div>
                      </div>
                      <button
                        onClick={() => onRollCheck('3d6', `Perícia: ${skill.name}`, skill.level)}
                        className="bg-[#35373c] hover:bg-[#5865f2] text-white px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1"
                      >
                        <Dices size={12} /> {skill.level}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {sheet.ruleset === 'dnd5e' && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { name: 'Atletismo (FOR)', mod: '+3' },
                    { name: 'Acrobacia (DES)', mod: '+4' },
                    { name: 'Furtividade (DES)', mod: '+4' },
                    { name: 'Percepção (SAB)', mod: '+5' },
                    { name: 'Intuição (SAB)', mod: '+3' },
                    { name: 'Persuasão (CAR)', mod: '+2' },
                    { name: 'Arcanismo (INT)', mod: '+1' },
                    { name: 'História (INT)', mod: '+1' },
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-[#2b2d31] rounded-lg border border-[#3f4147]"
                    >
                      <span className="text-[#dbdee1]">{s.name}</span>
                      <button
                        onClick={() => onRollCheck(`1d20${s.mod}`, s.name)}
                        className="bg-[#35373c] hover:bg-[#5865f2] text-white px-2 py-0.5 rounded font-bold"
                      >
                        {s.mod}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#949ba4]">
                Equipamento & Itens Transportados
              </h3>
              <div className="space-y-2">
                {[
                  { name: 'Espada Longa', qty: 1, weight: '1.5 kg', desc: '1d8 cortante / Dano de balanço' },
                  { name: 'Poção de Cura', qty: 2, weight: '0.5 kg', desc: 'Recupera 2d4+2 PV' },
                  { name: 'Corda de Seda (15m)', qty: 1, weight: '2 kg', desc: 'Resistente a 150kg' },
                  { name: 'Tochas', qty: 3, weight: '1.5 kg', desc: 'Ilumina 6m de raio' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-[#2b2d31] rounded-lg border border-[#3f4147]"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">
                        {item.name} <span className="text-[#949ba4]">x{item.qty}</span>
                      </div>
                      <div className="text-[11px] text-[#949ba4]">{item.desc}</div>
                    </div>
                    <span className="text-xs text-[#949ba4]">{item.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bio' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#949ba4]">
                Biografia & Anotações do Jogador
              </h3>
              <textarea
                value={sheet.bio}
                onChange={(e) => setSheet({ ...sheet, bio: e.target.value })}
                rows={6}
                placeholder="Escreva o histórico do personagem, motivações, laços e objetivos..."
                className="w-full bg-[#1e1f22] p-3 rounded-xl border border-[#3f4147] text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865f2] resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 bg-[#2b2d31] border-t border-[#1f2023]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#949ba4] hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onSave(sheet);
              onClose();
            }}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#5865f2] hover:bg-[#4752c4] text-white shadow-md"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
