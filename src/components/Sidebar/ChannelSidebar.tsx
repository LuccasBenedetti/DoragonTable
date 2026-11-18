import React from 'react';
import { Campaign, Channel, GameMode } from '../../types';
import { 
  Hash, 
  Dices, 
  Lock, 
  Map as MapIcon, 
  Book, 
  ShieldAlert, 
  Bot, 
  Users, 
  Settings, 
  Mic, 
  Headphones, 
  Compass,
  UserPlus,
  Share2,
  ChevronLeft,
  LogOut
} from 'lucide-react';
import { UserProfile } from '../Auth/AuthScreen';

interface ChannelSidebarProps {
  campaign: Campaign;
  activeChannelId: string;
  currentUser: UserProfile;
  onSelectChannel: (id: string) => void;
  onToggleGameMode: (mode: GameMode) => void;
  onOpenMap: () => void;
  onOpenLoreBible: () => void;
  onOpenGMScreen: () => void;
  onOpenCharacterSheet: () => void;
  onOpenInviteModal: () => void;
  onCollapse?: () => void;
  onLogout?: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  campaign,
  activeChannelId,
  currentUser,
  onSelectChannel,
  onToggleGameMode,
  onOpenMap,
  onOpenLoreBible,
  onOpenGMScreen,
  onOpenCharacterSheet,
  onOpenInviteModal,
  onCollapse,
  onLogout,
}) => {
  const isAIMode = campaign.gameMode === 'ai_master';

  return (
    <div className="w-60 h-full bg-[#14171e] flex flex-col select-none border-r border-[#1f242e] z-10">
      {/* Campaign Header Banner */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-[#1f242e] shadow-sm hover:bg-[#1a1f28] transition-colors">
        <div className="flex flex-col truncate flex-1 min-w-0 pr-2">
          <span className="font-extrabold text-sm text-white truncate">
            {campaign.name}
          </span>
          <span className="text-[10px] text-[#e63946] font-bold uppercase tracking-wider">
            {campaign.ruleset.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Mode Toggle Button */}
          <button
            onClick={() => onToggleGameMode(isAIMode ? 'multiplayer' : 'ai_master')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all shadow ${
              isAIMode
                ? 'bg-[#e63946] text-white hover:bg-[#d02e3b]'
                : 'bg-[#10b981] text-white hover:bg-[#059669]'
            }`}
            title="Alternar entre Mestre IA e Multijogador"
          >
            {isAIMode ? (
              <>
                <Bot size={11} />
                <span>IA</span>
              </>
            ) : (
              <>
                <Users size={11} />
                <span>Multi</span>
              </>
            )}
          </button>

          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1 rounded-lg hover:bg-[#252c3a] text-[#64748b] hover:text-white transition-colors"
              title="Recolher Barra Lateral (Ctrl+B)"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="p-3 border-b border-[#1f242e] space-y-1 bg-[#101319]">
        <button
          onClick={onOpenMap}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#94a3b8] hover:bg-[#1c212b] hover:text-white transition-all text-left"
        >
          <MapIcon size={15} className="text-[#e63946]" />
          <span>Mapa Tático (VTT)</span>
        </button>

        <button
          onClick={onOpenCharacterSheet}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#94a3b8] hover:bg-[#1c212b] hover:text-white transition-all text-left"
        >
          <ShieldAlert size={15} className="text-[#3b82f6]" />
          <span>Fichas dos Personagens</span>
        </button>

        <button
          onClick={onOpenLoreBible}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#94a3b8] hover:bg-[#1c212b] hover:text-white transition-all text-left"
        >
          <Book size={15} className="text-[#d4af37]" />
          <span>Bíblia de Lore (Mundo)</span>
        </button>

        <button
          onClick={onOpenInviteModal}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#10b981] bg-[#10b981]/10 hover:bg-[#10b981]/20 transition-all text-left"
        >
          <UserPlus size={15} />
          <span>Convidar Amigo</span>
        </button>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Text & Scene Channels */}
        <div>
          <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
            <span>Canais de Jogo</span>
          </div>

          <div className="space-y-0.5">
            {campaign.channels
              .filter((c) => !c.isPrivateGM)
              .map((chan) => {
                const isActive = chan.id === activeChannelId;
                return (
                  <button
                    key={chan.id}
                    onClick={() => onSelectChannel(chan.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#1e232e] text-white'
                        : 'text-[#94a3b8] hover:bg-[#1c202a] hover:text-white'
                    }`}
                  >
                    {chan.type === 'dice' ? (
                      <Dices size={15} className={isActive ? 'text-[#e63946]' : 'text-[#64748b]'} />
                    ) : (
                      <Hash size={15} className={isActive ? 'text-[#e63946]' : 'text-[#64748b]'} />
                    )}
                    <span className="truncate">{chan.name}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* GM Private Channels */}
        {campaign.isHost && (
          <div>
            <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#d4af37]">
              <span>Área Secreta do Mestre</span>
            </div>

            <div className="space-y-0.5">
              <button
                onClick={onOpenGMScreen}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#d4af37] bg-[#d4af37]/10 hover:bg-[#d4af37]/20 transition-all text-left"
              >
                <ShieldAlert size={15} />
                <span>Escudo do Mestre (GM)</span>
              </button>

              {campaign.channels
                .filter((c) => c.isPrivateGM)
                .map((chan) => {
                  const isActive = chan.id === activeChannelId;
                  return (
                    <button
                      key={chan.id}
                      onClick={() => onSelectChannel(chan.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#1e232e] text-white'
                          : 'text-[#94a3b8] hover:bg-[#1c202a] hover:text-white'
                      }`}
                    >
                      <Lock size={15} className="text-[#d4af37]" />
                      <span className="truncate">{chan.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Bar at Bottom */}
      <div className="h-14 bg-[#101318] px-3 flex items-center justify-between border-t border-[#1f242e]">
        <div
          onClick={onOpenCharacterSheet}
          className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#1c212b] cursor-pointer flex-1 min-w-0 mr-1 transition-colors"
          title="Ver perfil e ficha"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#252b38] flex items-center justify-center font-bold text-xs text-white border border-[#333a4a]">
              {currentUser.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10b981] rounded-full border-2 border-[#101318]" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate">{currentUser.username}</span>
            <span className="text-[10px] text-[#64748b] truncate font-mono">#{currentUser.tag}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[#64748b]">
          <button className="p-1.5 rounded-lg hover:bg-[#1c212b] hover:text-white" title="Microfone">
            <Mic size={15} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-[#1c212b] hover:text-white" title="Áudio">
            <Headphones size={15} />
          </button>
          <button
            onClick={onOpenCharacterSheet}
            className="p-1.5 rounded-lg hover:bg-[#1c212b] hover:text-white"
            title="Configurações"
          >
            <Settings size={15} />
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg hover:bg-[#2b181a] hover:text-[#e63946] text-[#64748b] transition-colors"
              title="Desconectar / Sair da Conta"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
