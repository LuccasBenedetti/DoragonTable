import React from 'react';
import { Campaign } from '../../types';
import { Plus, Compass, Sparkles, Cpu, Users } from 'lucide-react';
import { DragonLogo } from '../Common/DragonLogo';

interface CampaignSidebarProps {
  campaigns: Campaign[];
  activeCampaignId: string | null; // null when on Home / Friends view
  onSelectHome: () => void;
  onSelectCampaign: (id: string) => void;
  onOpenCreateModal: () => void;
  onOpenOllamaConfig: () => void;
}

export const CampaignSidebar: React.FC<CampaignSidebarProps> = ({
  campaigns,
  activeCampaignId,
  onSelectHome,
  onSelectCampaign,
  onOpenCreateModal,
  onOpenOllamaConfig,
}) => {
  const isHomeActive = activeCampaignId === null;

  return (
    <div className="w-[72px] h-full bg-[#0d0f12] flex flex-col items-center py-3 gap-2 select-none border-r border-[#1a1e26] z-20">
      {/* Home (Friends & DMs) Dragon Icon */}
      <div
        className="relative group flex items-center justify-center cursor-pointer"
        onClick={onSelectHome}
      >
        {/* Active Pill Indicator */}
        <div
          className={`absolute left-0 w-1 bg-[#e63946] rounded-r transition-all duration-200 ${
            isHomeActive
              ? 'h-10 shadow-[0_0_8px_#e63946]'
              : 'h-2 opacity-0 group-hover:opacity-100 group-hover:h-5'
          }`}
        />

        <div
          className={`w-12 h-12 flex items-center justify-center transition-all duration-200 shadow-md ${
            isHomeActive
              ? 'rounded-[16px] bg-[#1a1215] border-2 border-[#e63946]'
              : 'rounded-[24px] group-hover:rounded-[16px] bg-[#161920] hover:bg-[#1a1215] border border-[#232834]'
          }`}
        >
          <DragonLogo size={28} glow={isHomeActive} />
        </div>

        {/* Tooltip */}
        <div className="absolute left-[80px] bg-[#14171e] text-[#e2e8f0] text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#272d3b] shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          Início (Amigos & Mensagens)
        </div>
      </div>

      <div className="w-8 h-[2px] bg-[#1f242f] rounded my-1" />

      {/* Campaign List */}
      <div className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto no-scrollbar">
        {campaigns.map((camp) => {
          const isActive = camp.id === activeCampaignId;
          return (
            <div
              key={camp.id}
              onClick={() => onSelectCampaign(camp.id)}
              className="relative group flex items-center justify-center cursor-pointer"
            >
              {/* Active pill indicator */}
              <div
                className={`absolute left-0 w-1 bg-white rounded-r transition-all duration-200 ${
                  isActive
                    ? 'h-10 bg-[#e63946] shadow-[0_0_8px_#e63946]'
                    : 'h-2 opacity-0 group-hover:opacity-100 group-hover:h-5'
                }`}
              />

              {/* Server / Campaign Icon */}
              <div
                className={`w-12 h-12 flex items-center justify-center font-bold text-sm text-white transition-all duration-200 shadow-md ${
                  isActive
                    ? 'rounded-[16px] bg-[#e63946] shadow-lg shadow-[#e63946]/30'
                    : 'rounded-[24px] group-hover:rounded-[16px] bg-[#181c24] hover:bg-[#202530] border border-[#232834]'
                }`}
              >
                {camp.icon ? (
                  <span className="text-xl">{camp.icon}</span>
                ) : (
                  camp.name.substring(0, 2).toUpperCase()
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute left-[80px] bg-[#14171e] text-[#e2e8f0] text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#272d3b] shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {camp.name} ({camp.ruleset.toUpperCase()})
              </div>
            </div>
          );
        })}

        {/* Add Campaign Button */}
        <div
          onClick={onOpenCreateModal}
          className="relative group flex items-center justify-center cursor-pointer mt-1"
        >
          <div className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] bg-[#181c24] group-hover:bg-[#10b981] text-[#10b981] group-hover:text-white border border-[#232834] flex items-center justify-center transition-all duration-200 shadow-md">
            <Plus size={22} />
          </div>
          <div className="absolute left-[80px] bg-[#14171e] text-[#e2e8f0] text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#272d3b] shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Criar Nova Campanha
          </div>
        </div>
      </div>

      {/* Ollama Config Button at bottom */}
      <div
        onClick={onOpenOllamaConfig}
        className="relative group flex items-center justify-center cursor-pointer pt-2 border-t border-[#1f242f] w-full"
      >
        <div className="w-12 h-12 rounded-[24px] group-hover:rounded-[16px] bg-[#181c24] hover:bg-[#e63946] text-[#94a3b8] hover:text-white border border-[#232834] flex items-center justify-center transition-all duration-200 shadow-md">
          <Cpu size={20} />
        </div>
        <div className="absolute left-[80px] bg-[#14171e] text-[#e2e8f0] text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#272d3b] shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          Mestre IA Local (Ollama)
        </div>
      </div>
    </div>
  );
};
