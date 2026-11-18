import React from 'react';
import { CharacterSheet, CombatState } from '../../types';
import { Shield, Mountain, User, Sparkles, Plus, Minus, Swords, ChevronRight, ChevronLeft, Flag, Crown } from 'lucide-react';

interface SceneTokensBarProps {
  characters: CharacterSheet[];
  selectedCharacterId?: string;
  combat?: CombatState;
  isGM?: boolean;
  onSelectCharacter: (id: string) => void;
  onOpenFullSheet: (character: CharacterSheet) => void;
  onUpdateHp: (id: string, delta: number) => void;
  onStartCombat?: () => void;
  onEndCombat?: () => void;
  onNextTurn?: () => void;
  onPrevTurn?: () => void;
}

export const SceneTokensBar: React.FC<SceneTokensBarProps> = ({
  characters,
  selectedCharacterId,
  combat,
  isGM,
  onSelectCharacter,
  onOpenFullSheet,
  onUpdateHp,
  onStartCombat,
  onEndCombat,
  onNextTurn,
  onPrevTurn,
}) => {
  if (characters.length === 0) return null;

  const isCombatActive = !!(combat && combat.isActive && combat.turnOrder && combat.turnOrder.length > 0);

  // If combat is active, sort tokens according to turnOrder
  const displayCharacters = isCombatActive
    ? [...combat.turnOrder]
        .map(c => characters.find(ch => ch.id === c.characterId))
        .filter((ch): ch is CharacterSheet => !!ch)
    : characters;

  const currentCombatantId = isCombatActive ? combat.turnOrder[combat.currentTurnIndex]?.characterId : null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto select-none py-0.5 no-scrollbar">
      {/* Combat Mode Controls or Regular Cena Tag */}
      {isCombatActive ? (
        <div className="flex items-center gap-1.5 bg-[#1b1915] p-1 px-2 rounded-xl border border-[#d4af37]/50 shadow-md flex-shrink-0">
          <div className="flex items-center gap-1 text-[10px] font-black text-[#d4af37] uppercase tracking-wider">
            <Swords size={13} className="text-[#f59e0b] animate-pulse" />
            <span>R{combat.round}</span>
          </div>

          <div className="h-3 w-[1px] bg-[#3a3222] mx-0.5" />

          {/* Turn Navigation */}
          {onPrevTurn && (
            <button
              onClick={onPrevTurn}
              className="p-1 rounded-lg bg-[#272218] hover:bg-[#382f1f] text-[#d4af37] transition-colors"
              title="Voltar Turno Anterior"
            >
              <ChevronLeft size={13} />
            </button>
          )}

          {onNextTurn && (
            <button
              onClick={onNextTurn}
              className="px-2 py-0.5 rounded-lg bg-[#d4af37] hover:bg-[#f59e0b] text-black font-extrabold text-[10px] flex items-center gap-0.5 shadow transition-colors"
              title="Avançar para o Próximo Turno"
            >
              <span>Avançar</span>
              <ChevronRight size={13} />
            </button>
          )}

          {isGM && onEndCombat && (
            <button
              onClick={onEndCombat}
              className="p-1 rounded-lg bg-[#2b181a] hover:bg-[#e63946] text-[#e63946] hover:text-white transition-colors ml-0.5"
              title="Encerrar Combate"
            >
              <Flag size={11} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="text-[10px] font-black uppercase tracking-wider text-[#64748b] mr-0.5 flex items-center gap-1">
            <Swords size={13} className="text-[#e63946]" />
            <span>Cena:</span>
          </div>

          {isGM && onStartCombat && (
            <button
              onClick={onStartCombat}
              className="px-2 py-1 rounded-xl bg-[#20171a] hover:bg-[#e63946] text-[#e63946] hover:text-white border border-[#3b1e25] text-[10px] font-extrabold flex items-center gap-1 transition-all shadow-sm"
              title="Rolar iniciativas e iniciar combate por turnos"
            >
              <Swords size={12} />
              <span>Iniciar Combate</span>
            </button>
          )}
        </div>
      )}

      {/* Characters List */}
      {displayCharacters.map((char) => {
        const isSelected = char.id === selectedCharacterId;
        const isTurnActive = isCombatActive && char.id === currentCombatantId;
        const hpPercent = Math.max(0, Math.min(100, (char.hp / char.maxHp) * 100));
        const combatantData = isCombatActive ? combat.turnOrder.find(co => co.characterId === char.id) : null;

        return (
          <div
            key={char.id}
            onClick={() => onSelectCharacter(char.id)}
            className={`flex items-center gap-2 p-1 px-2.5 rounded-xl cursor-pointer transition-all border flex-shrink-0 relative ${
              isTurnActive
                ? 'bg-[#221c13] border-[#f59e0b] shadow-lg shadow-[#f59e0b]/20 ring-1 ring-[#f59e0b]/50'
                : isSelected
                ? 'bg-[#1a1f2c] border-[#e63946] shadow-md shadow-[#e63946]/20'
                : 'bg-[#13161e] border-[#222836] hover:bg-[#181d28]'
            }`}
          >
            {/* Avatar & Elevation Badge */}
            <div className="relative">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] text-white overflow-hidden border ${
                  isTurnActive
                    ? 'border-[#f59e0b] bg-[#332817]'
                    : isSelected
                    ? 'border-[#e63946] bg-[#222838]'
                    : 'border-[#2d3446] bg-[#1a1e28]'
                }`}
              >
                {char.avatar ? (
                  <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                  char.name.substring(0, 2).toUpperCase()
                )}
              </div>

              {char.elevation !== 0 && (
                <div
                  className="absolute -top-1 -right-1.5 bg-[#d4af37] text-black font-black text-[8px] px-1 rounded-full shadow"
                  title={`Elevação: ${char.elevation > 0 ? '+' : ''}${char.elevation}m`}
                >
                  {char.elevation > 0 ? `+${char.elevation}` : char.elevation}m
                </div>
              )}
            </div>

            {/* Character Info */}
            <div className="flex flex-col min-w-[85px]">
              <div className="flex items-center justify-between gap-1.5">
                <span className={`text-[11px] font-bold truncate max-w-[70px] ${isTurnActive ? 'text-[#f59e0b]' : 'text-white'}`}>
                  {char.name}
                </span>

                <div className="flex items-center gap-1">
                  {combatantData && (
                    <span className="text-[8px] font-black text-[#f59e0b] bg-[#2a2215] px-1 py-0.2 rounded border border-[#42331c]">
                      INI {Math.floor(combatantData.initiative)}
                    </span>
                  )}
                  <span className="text-[9px] font-extrabold text-[#94a3b8] bg-[#0d0f14] px-1 py-0.2 rounded border border-[#222736]">
                    {char.ruleset === 'gurps' ? `DEF ${char.defense}` : `CA ${char.defense}`}
                  </span>
                </div>
              </div>

              {/* HP Bar */}
              <div className="w-full bg-[#0d0f14] h-1.5 rounded-full overflow-hidden mt-1 border border-[#1f2533]">
                <div
                  className={`h-full transition-all rounded-full ${
                    hpPercent > 50
                      ? 'bg-[#10b981]'
                      : hpPercent > 20
                      ? 'bg-[#f59e0b]'
                      : 'bg-[#e63946]'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[9px] text-[#94a3b8] mt-0.5 font-mono">
                <span>
                  {char.hp}/{char.maxHp}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateHp(char.id, -1);
                    }}
                    className="hover:text-red-400 font-bold px-0.5"
                    title="Diminuir 1 PV"
                  >
                    -
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateHp(char.id, 1);
                    }}
                    className="hover:text-emerald-400 font-bold px-0.5"
                    title="Aumentar 1 PV"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Inspect Full Sheet Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenFullSheet(char);
              }}
              className="p-1 rounded-lg hover:bg-[#252b3a] text-[#64748b] hover:text-white transition-colors"
              title="Abrir Ficha Detalhada"
            >
              <User size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
