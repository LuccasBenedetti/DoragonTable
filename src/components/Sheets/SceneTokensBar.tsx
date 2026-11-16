import React from 'react';
import { CharacterSheet } from '../../types';
import { Shield, Heart, Zap, Mountain, User, Sparkles } from 'lucide-react';

interface SceneTokensBarProps {
  characters: CharacterSheet[];
  selectedCharacterId?: string;
  onSelectCharacter: (id: string) => void;
  onOpenFullSheet: (character: CharacterSheet) => void;
  onUpdateHp: (id: string, delta: number) => void;
}

export const SceneTokensBar: React.FC<SceneTokensBarProps> = ({
  characters,
  selectedCharacterId,
  onSelectCharacter,
  onOpenFullSheet,
  onUpdateHp,
}) => {
  if (characters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#2b2d31]/80 backdrop-blur border-b border-[#1f2023] overflow-x-auto select-none">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#949ba4] mr-1 flex items-center gap-1">
        <Sparkles size={12} className="text-[#5865f2]" />
        Cena:
      </div>

      {characters.map((char) => {
        const isSelected = char.id === selectedCharacterId;
        const hpPercent = Math.max(0, Math.min(100, (char.hp / char.maxHp) * 100));

        return (
          <div
            key={char.id}
            onClick={() => onSelectCharacter(char.id)}
            className={`flex items-center gap-2 p-1.5 px-2 rounded-lg cursor-pointer transition-all border ${
              isSelected
                ? 'bg-[#35373c] border-[#5865f2] shadow-md'
                : 'bg-[#1e1f22]/60 border-[#313338] hover:bg-[#35373c]/50'
            }`}
          >
            {/* Avatar & Elevation Badge */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#404249] flex items-center justify-center font-bold text-xs text-white overflow-hidden border border-[#5865f2]">
                {char.avatar ? (
                  <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                  char.name.substring(0, 2).toUpperCase()
                )}
              </div>
              {char.elevation !== 0 && (
                <div
                  className="absolute -top-1 -right-1 bg-[#eab308] text-black font-extrabold text-[9px] px-1 rounded-full shadow"
                  title={`Elevação: ${char.elevation > 0 ? '+' : ''}${char.elevation}m`}
                >
                  {char.elevation > 0 ? `+${char.elevation}` : char.elevation}m
                </div>
              )}
            </div>

            {/* Character Info */}
            <div className="flex flex-col min-w-[90px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#dbdee1] truncate max-w-[80px]">
                  {char.name}
                </span>
                <span className="text-[10px] text-[#949ba4]">
                  {char.ruleset === 'gurps' ? `Def ${char.defense}` : `CA ${char.defense}`}
                </span>
              </div>

              {/* HP Bar */}
              <div className="w-full bg-[#111214] h-2 rounded-full overflow-hidden mt-0.5 border border-[#3f4147]">
                <div
                  className={`h-full transition-all ${
                    hpPercent > 50
                      ? 'bg-[#23a55a]'
                      : hpPercent > 20
                      ? 'bg-[#f0b232]'
                      : 'bg-[#da373c]'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#949ba4] mt-0.5">
                <span>
                  {char.hp}/{char.maxHp}
                </span>
                <div className="flex items-center gap-1">
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
                    className="hover:text-green-400 font-bold px-0.5"
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
              className="p-1 rounded hover:bg-[#404249] text-[#949ba4] hover:text-white"
              title="Abrir Ficha Completa"
            >
              <User size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
