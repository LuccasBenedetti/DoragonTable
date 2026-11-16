import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, CharacterSheet, RulesetType } from '../../types';
import { 
  Dices, 
  Send, 
  Bot, 
  Crown, 
  Sparkles, 
  ChevronDown, 
  PlusCircle, 
  ShieldAlert, 
  Flame, 
  Mountain,
  CornerDownRight
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
  const [diceInput, setDiceInput] = useState('');
  const [showDiceQuickBar, setShowDiceQuickBar] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGeneratingAI]);

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
    <div className="flex-1 h-full flex flex-col bg-[#313338] overflow-hidden">
      {/* Channel Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#1f2023] shadow-sm bg-[#313338] z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl text-[#80848e]">#</span>
          <span className="font-bold text-white text-sm">{channelName}</span>
          {isAIMasterMode && (
            <span className="ml-2 flex items-center gap-1 text-[11px] font-semibold bg-[#5865f2]/20 text-[#5865f2] px-2 py-0.5 rounded-full border border-[#5865f2]/40">
              <Bot size={12} /> Mestre IA Ativo
            </span>
          )}
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#949ba4]">
            <Sparkles size={36} className="text-[#5865f2] mb-2 animate-bounce" />
            <h3 className="text-base font-bold text-white">Início da Cena #{channelName}</h3>
            <p className="text-xs max-w-sm mt-1">
              Envie uma mensagem ou execute uma ação para iniciar a narrativa da sessão de RPG.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAI = msg.isAI;
            const isGM = msg.isGM;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 group px-2 py-1.5 rounded-lg transition-colors ${
                  isAI
                    ? 'bg-[#2b2d31]/50 border-l-4 border-[#5865f2]'
                    : isGM
                    ? 'bg-[#2b2d31]/30 border-l-4 border-[#f0b232]'
                    : 'hover:bg-[#2e3035]'
                }`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#1e1f22] flex-shrink-0 flex items-center justify-center font-bold text-sm text-white overflow-hidden border border-[#3f4147]">
                  {msg.senderAvatar ? (
                    <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" />
                  ) : isAI ? (
                    <Bot size={20} className="text-[#5865f2]" />
                  ) : (
                    msg.senderName.substring(0, 2).toUpperCase()
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white hover:underline cursor-pointer">
                      {msg.senderName}
                    </span>
                    {isAI && (
                      <span className="bg-[#5865f2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded uppercase flex items-center gap-0.5">
                        <Bot size={10} /> IA MESTRE
                      </span>
                    )}
                    {isGM && !isAI && (
                      <span className="bg-[#f0b232] text-black text-[10px] font-bold px-1.5 py-0.2 rounded uppercase flex items-center gap-0.5">
                        <Crown size={10} /> MESTRE
                      </span>
                    )}
                    <span className="text-[10px] text-[#949ba4]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Narration Style */}
                  {msg.type === 'narration' && (
                    <div className="mt-1 text-sm text-[#dbdee1] leading-relaxed italic bg-[#2b2d31]/70 p-3 rounded-xl border border-[#3f4147]">
                      {msg.content}
                    </div>
                  )}

                  {/* Standard Speech */}
                  {msg.type === 'speech' && (
                    <p className="mt-1 text-sm text-[#dbdee1] leading-relaxed break-words">
                      "{msg.content}"
                    </p>
                  )}

                  {/* Action / Emote */}
                  {msg.type === 'action' && (
                    <p className="mt-1 text-sm text-[#949ba4] italic flex items-center gap-1.5">
                      <CornerDownRight size={13} className="text-[#5865f2]" />
                      * {msg.senderName} {msg.content} *
                    </p>
                  )}

                  {/* Dice Roll Card */}
                  {msg.type === 'roll' && msg.roll && (
                    <div className="mt-2 bg-[#2b2d31] border border-[#3f4147] rounded-xl p-3 max-w-md shadow-lg">
                      <div className="flex items-center justify-between border-b border-[#3f4147] pb-2">
                        <div className="flex items-center gap-2">
                          <Dices size={16} className="text-[#eab308]" />
                          <span className="text-xs font-bold text-white">{msg.content}</span>
                        </div>
                        <span className="text-xs font-mono font-semibold text-[#949ba4]">
                          {msg.roll.formula}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-[#949ba4] font-mono">
                          {msg.roll.breakdown}
                        </div>

                        <div className="flex items-center gap-2">
                          {msg.roll.isCritSuccess && (
                            <span className="text-[10px] bg-[#23a55a] text-white font-bold px-2 py-0.5 rounded-full uppercase animate-pulse">
                              CRÍTICO!
                            </span>
                          )}
                          {msg.roll.isCritFailure && (
                            <span className="text-[10px] bg-[#da373c] text-white font-bold px-2 py-0.5 rounded-full uppercase">
                              FALHA CRÍTICA!
                            </span>
                          )}
                          <div className="text-lg font-black text-white bg-[#1e1f22] px-3 py-1 rounded-lg border border-[#3f4147]">
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
          <div className="flex items-center gap-3 px-2 py-2 bg-[#2b2d31]/40 rounded-xl border border-[#5865f2]/40 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white">
              <Bot size={18} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#5865f2] font-semibold">
              <span>O Mestre IA está narrando a história e consultando a memória do mundo...</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#5865f2] rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-[#5865f2] rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-[#5865f2] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Quick Dice Bar (Collapsible) */}
      {showDiceQuickBar && (
        <div className="px-4 py-2 bg-[#2b2d31] border-t border-[#1f2023] flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] font-bold text-[#949ba4] uppercase">Rolar Rápido:</span>
          {ruleset === 'gurps' ? (
            <>
              <button
                onClick={() => onRollDice('3d6', 'Teste Básico GURPS')}
                className="px-2.5 py-1 bg-[#35373c] hover:bg-[#5865f2] text-white font-bold rounded flex items-center gap-1"
              >
                <Dices size={12} /> 3d6
              </button>
              <button
                onClick={() => onRollDice('1d6', 'Dano Menor')}
                className="px-2 py-1 bg-[#35373c] hover:bg-[#5865f2] text-white rounded font-mono"
              >
                1d6
              </button>
              <button
                onClick={() => onRollDice('2d6', 'Dano Maior')}
                className="px-2 py-1 bg-[#35373c] hover:bg-[#5865f2] text-white rounded font-mono"
              >
                2d6
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onRollDice('1d20', 'Teste d20')}
                className="px-2.5 py-1 bg-[#35373c] hover:bg-[#5865f2] text-white font-bold rounded flex items-center gap-1"
              >
                <Dices size={12} /> 1d20
              </button>
              {['1d4', '1d6', '1d8', '1d10', '1d12', '1d100'].map((d) => (
                <button
                  key={d}
                  onClick={() => onRollDice(d, `Rolagem de ${d}`)}
                  className="px-2 py-1 bg-[#35373c] hover:bg-[#5865f2] text-white rounded font-mono"
                >
                  {d}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Input Form Bar */}
      <div className="p-4 bg-[#313338]">
        <form
          onSubmit={handleSend}
          className="bg-[#383a40] rounded-xl p-2 flex flex-col gap-2 border border-[#3f4147] focus-within:border-[#5865f2]"
        >
          {/* Controls Bar: Speak as Character & Message Type */}
          <div className="flex items-center justify-between text-xs text-[#dbdee1] border-b border-[#43464d] pb-1.5 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#949ba4]">Falando como:</span>
              <select
                value={selectedCharId}
                onChange={(e) => setSelectedCharId(e.target.value)}
                className="bg-[#2b2d31] text-xs font-bold text-white rounded px-2 py-0.5 border border-[#4e5058] focus:outline-none focus:border-[#5865f2]"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isNPC ? '(NPC)' : ''}
                  </option>
                ))}
              </select>

              {/* Elevation Badge of speaker */}
              {selectedChar?.elevation !== 0 && (
                <span className="text-[10px] bg-[#eab308] text-black font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Mountain size={11} />
                  {selectedChar?.elevation > 0 ? `+${selectedChar.elevation}` : selectedChar?.elevation}m
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMessageType('speech')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  messageType === 'speech' ? 'bg-[#5865f2] text-white' : 'text-[#949ba4] hover:text-white'
                }`}
              >
                Fala
              </button>
              <button
                type="button"
                onClick={() => setMessageType('action')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  messageType === 'action' ? 'bg-[#5865f2] text-white' : 'text-[#949ba4] hover:text-white'
                }`}
              >
                Ação (/me)
              </button>
              <button
                type="button"
                onClick={() => setShowDiceQuickBar(!showDiceQuickBar)}
                className={`p-1 rounded text-[#949ba4] hover:text-white ${
                  showDiceQuickBar ? 'text-[#eab308]' : ''
                }`}
                title="Dados Rápidos"
              >
                <Dices size={16} />
              </button>
            </div>
          </div>

          {/* Main Input Row */}
          <div className="flex items-center gap-2 px-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Enviar mensagem em #${channelName}... (use /roll 1d20+4 ou /me ação)`}
              className="flex-1 bg-transparent text-sm text-[#dbdee1] focus:outline-none placeholder-[#949ba4]"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2 rounded-lg transition-colors ${
                inputText.trim()
                  ? 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
                  : 'text-[#4e5058] cursor-not-allowed'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
