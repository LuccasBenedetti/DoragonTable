import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, CharacterSheet, RulesetType } from '../../types';
import { 
  Dices, 
  Send, 
  Bot, 
  Crown, 
  Sparkles, 
  Mountain,
  CornerDownRight,
  Flame,
  Shield
} from 'lucide-react';

interface ChatAreaProps {
  channelName: string;
  messages: ChatMessage[];
  characters: CharacterSheet[];
  activeCharacterId?: string;
  isAIMasterMode: boolean;
  isGeneratingAI: boolean;
  ruleset: RulesetType;
  onSendMessage: (content: string, type: ChatMessage['type'], characterId?: string) => void;
  onRollDice: (formula: string, desc?: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  channelName,
  messages,
  characters,
  activeCharacterId,
  isAIMasterMode,
  isGeneratingAI,
  ruleset,
  onSendMessage,
  onRollDice,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedCharId, setSelectedCharId] = useState<string>(activeCharacterId || characters[0]?.id || '');
  const [messageType, setMessageType] = useState<ChatMessage['type']>('speech');
  const [showDiceQuickBar, setShowDiceQuickBar] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGeneratingAI]);

  // Keep selectedCharId in sync with activeCharacterId when changed externally (e.g. from token bar)
  useEffect(() => {
    if (activeCharacterId) {
      setSelectedCharId(activeCharacterId);
    }
  }, [activeCharacterId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Check if starts with /roll or /r
    const rollMatch = inputText.match(/^\/(?:roll|r)\s+(.+)$/i);
    if (rollMatch) {
      onRollDice(rollMatch[1]);
      setInputText('');
      return;
    }

    // Check if starts with /me
    const meMatch = inputText.match(/^\/me\s+(.+)$/i);
    if (meMatch) {
      onSendMessage(meMatch[1], 'action', selectedCharId);
      setInputText('');
      return;
    }

    onSendMessage(inputText, messageType, selectedCharId);
    setInputText('');
  };

  const selectedChar = characters.find((c) => c.id === selectedCharId) || characters[0];

  return (
    <div className="flex-1 h-full flex flex-col bg-[#11141a] text-[#e2e8f0] overflow-hidden">
      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#64748b] py-8">
            <div className="w-12 h-12 rounded-2xl bg-[#e63946]/10 text-[#e63946] flex items-center justify-center mb-3 border border-[#e63946]/20">
              <Sparkles size={24} />
            </div>
            <h3 className="text-sm font-bold text-white">Início da Cena #{channelName}</h3>
            <p className="text-xs max-w-xs mt-1 text-[#94a3b8]">
              Envie uma fala, ação ou rolagem de dados para que a narrativa tome vida.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAI = msg.isAI;
            const isGM = msg.isGM;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isAI
                    ? 'bg-[#181c26]/90 border-l-4 border-[#e63946] shadow-sm'
                    : isGM
                    ? 'bg-[#181c26]/60 border-l-4 border-[#d4af37]'
                    : 'bg-[#141820]/40 hover:bg-[#181c24]/70 border border-[#1e2330]'
                }`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-[#1d222e] flex-shrink-0 flex items-center justify-center font-bold text-xs text-white overflow-hidden border border-[#2c3344] shadow-sm">
                  {msg.senderAvatar ? (
                    <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" />
                  ) : isAI ? (
                    <Flame size={18} className="text-[#e63946]" />
                  ) : (
                    msg.senderName.substring(0, 2).toUpperCase()
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white hover:underline cursor-pointer">
                      {msg.senderName}
                    </span>
                    {isAI && (
                      <span className="bg-[#e63946] text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase flex items-center gap-0.5 tracking-wider">
                        <Bot size={10} /> IA MESTRE
                      </span>
                    )}
                    {isGM && !isAI && (
                      <span className="bg-[#d4af37] text-black text-[9px] font-black px-1.5 py-0.2 rounded uppercase flex items-center gap-0.5 tracking-wider">
                        <Crown size={10} /> MESTRE
                      </span>
                    )}
                    <span className="text-[10px] text-[#64748b]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Narration Style */}
                  {msg.type === 'narration' && (
                    <div className="mt-1.5 text-xs text-[#cbd5e1] leading-relaxed italic bg-[#0f1218]/80 p-3 rounded-xl border border-[#222836]">
                      {msg.content}
                    </div>
                  )}

                  {/* Standard Speech */}
                  {msg.type === 'speech' && (
                    <p className="mt-1 text-xs text-[#e2e8f0] leading-relaxed break-words font-normal">
                      "{msg.content}"
                    </p>
                  )}

                  {/* Action / Emote */}
                  {msg.type === 'action' && (
                    <p className="mt-1 text-xs text-[#94a3b8] italic flex items-center gap-1.5">
                      <CornerDownRight size={12} className="text-[#e63946]" />
                      * {msg.senderName} {msg.content} *
                    </p>
                  )}

                  {/* Dice Roll Card */}
                  {msg.type === 'roll' && msg.roll && (
                    <div className="mt-2 bg-[#171b24] border border-[#262c3b] rounded-xl p-2.5 max-w-sm shadow-md">
                      <div className="flex items-center justify-between border-b border-[#222736] pb-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Dices size={14} className="text-[#d4af37]" />
                          <span className="text-[11px] font-bold text-white truncate max-w-[180px]">{msg.content}</span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-[#94a3b8]">
                          {msg.roll.formula}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-[11px] text-[#94a3b8] font-mono">
                          {msg.roll.breakdown}
                        </div>

                        <div className="flex items-center gap-2">
                          {msg.roll.isCritSuccess && (
                            <span className="text-[9px] bg-[#10b981] text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase animate-pulse">
                              CRÍTICO!
                            </span>
                          )}
                          {msg.roll.isCritFailure && (
                            <span className="text-[9px] bg-[#e63946] text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                              FALHA!
                            </span>
                          )}
                          <div className="text-base font-black text-white bg-[#0f1218] px-2.5 py-0.5 rounded-lg border border-[#2b3242]">
                            {msg.roll.total}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* AI Typing Indicator */}
        {isGeneratingAI && (
          <div className="flex items-center gap-3 px-3 py-2.5 bg-[#181c26]/90 rounded-xl border border-[#e63946]/40 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-[#e63946] flex items-center justify-center text-white shadow-md shadow-[#e63946]/30">
              <Bot size={16} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#e63946] font-semibold">
              <span>O Mestre IA está narrando a história...</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#e63946] rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-[#e63946] rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-[#e63946] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Quick Dice Bar (Collapsible) */}
      {showDiceQuickBar && (
        <div className="px-3 py-2 bg-[#161a22] border-t border-[#1f2533] flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold text-[#64748b] uppercase mr-1">Rolar:</span>
          {ruleset === 'gurps' ? (
            <>
              <button
                onClick={() => onRollDice('3d6', 'Teste 3d6 GURPS')}
                className="px-2.5 py-1 bg-[#222734] hover:bg-[#e63946] text-white font-bold rounded-lg flex items-center gap-1 text-xs transition-colors"
              >
                <Dices size={12} /> 3d6
              </button>
              <button
                onClick={() => onRollDice('1d6', 'Dano Menor')}
                className="px-2 py-1 bg-[#222734] hover:bg-[#e63946] text-white rounded-lg font-mono text-xs transition-colors"
              >
                1d6
              </button>
              <button
                onClick={() => onRollDice('2d6', 'Dano Maior')}
                className="px-2 py-1 bg-[#222734] hover:bg-[#e63946] text-white rounded-lg font-mono text-xs transition-colors"
              >
                2d6
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onRollDice('1d20', 'Teste d20')}
                className="px-2.5 py-1 bg-[#222734] hover:bg-[#e63946] text-white font-bold rounded-lg flex items-center gap-1 text-xs transition-colors"
              >
                <Dices size={12} /> 1d20
              </button>
              {['1d4', '1d6', '1d8', '1d10', '1d12', '1d100'].map((d) => (
                <button
                  key={d}
                  onClick={() => onRollDice(d, `Rolagem de ${d}`)}
                  className="px-2 py-1 bg-[#222734] hover:bg-[#e63946] text-white rounded-lg font-mono text-xs transition-colors"
                >
                  {d}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Input Form Bar */}
      <div className="p-3 bg-[#11141a] border-t border-[#1a1f29]">
        <form
          onSubmit={handleSend}
          className="bg-[#161a22] rounded-xl p-2 flex flex-col gap-1.5 border border-[#232938] focus-within:border-[#e63946] transition-colors"
        >
          {/* Controls Bar: Speak as Character & Message Type */}
          <div className="flex items-center justify-between text-xs text-[#94a3b8] border-b border-[#1f2533] pb-1 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[#64748b]">Como:</span>
              <select
                value={selectedCharId}
                onChange={(e) => setSelectedCharId(e.target.value)}
                className="bg-[#1d222e] text-xs font-bold text-white rounded-md px-2 py-0.5 border border-[#2c3344] focus:outline-none focus:border-[#e63946]"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isNPC ? '(NPC)' : ''}
                  </option>
                ))}
              </select>

              {/* Elevation Badge of speaker */}
              {selectedChar?.elevation !== 0 && (
                <span className="text-[9px] bg-[#d4af37] text-black font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Mountain size={10} />
                  {selectedChar?.elevation > 0 ? `+${selectedChar.elevation}` : selectedChar?.elevation}m
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMessageType('speech')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  messageType === 'speech' ? 'bg-[#e63946] text-white' : 'text-[#64748b] hover:text-white'
                }`}
              >
                Fala
              </button>
              <button
                type="button"
                onClick={() => setMessageType('action')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  messageType === 'action' ? 'bg-[#e63946] text-white' : 'text-[#64748b] hover:text-white'
                }`}
              >
                Ação
              </button>
              <button
                type="button"
                onClick={() => setShowDiceQuickBar(!showDiceQuickBar)}
                className={`p-1 rounded text-[#94a3b8] hover:text-white transition-colors ${
                  showDiceQuickBar ? 'text-[#d4af37]' : ''
                }`}
                title="Atalhos de Dados"
              >
                <Dices size={15} />
              </button>
            </div>
          </div>

          {/* Main Input Row */}
          <div className="flex items-center gap-2 px-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Enviar em #${channelName}... (/roll 1d20+4)`}
              className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-[#64748b]"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-1.5 rounded-lg transition-all ${
                inputText.trim()
                  ? 'bg-[#e63946] hover:bg-[#d02e3b] text-white shadow-md shadow-[#e63946]/30'
                  : 'text-[#475569] cursor-not-allowed'
              }`}
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
