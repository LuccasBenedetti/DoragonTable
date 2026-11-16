import React, { useState } from 'react';
import { X, Network, Wifi, Users, Server, Copy, Check, Globe, Cloud, Sparkles } from 'lucide-react';

interface LANServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHost: boolean;
  onToggleHost: () => void;
  connectedClientsCount: number;
}

export const LANServerModal: React.FC<LANServerModalProps> = ({
  isOpen,
  onClose,
  isHost,
  onToggleHost,
  connectedClientsCount,
}) => {
  const [activeTab, setActiveTab] = useState<'lan' | 'cloud'>('lan');
  const [copied, setCopied] = useState(false);
  const [connectIp, setConnectIp] = useState('192.168.1.100:8080');
  const [localIp] = useState('192.168.1.15:8080');

  // Cloud / Vercel State
  const [vercelUrl, setVercelUrl] = useState('https://airpg-server.vercel.app');
  const [campaignCode, setCampaignCode] = useState('CAMP-NEXUS-2026');
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(localIp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectCloud = () => {
    setCloudStatus('connecting');
    setTimeout(() => {
      setCloudStatus('connected');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#313338] rounded-2xl border border-[#3f4147] shadow-2xl flex flex-col overflow-hidden text-[#dbdee1]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#2b2d31] border-b border-[#1f2023]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865f2]/20 text-[#5865f2] flex items-center justify-center">
              <Network size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Multijogador & Servidores</h2>
              <p className="text-xs text-[#949ba4]">Jogue em rede local (LAN) ou sincronize com servidor Vercel</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#35373c] text-[#949ba4] hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#1f2023] bg-[#2b2d31] px-4 pt-1 gap-2">
          <button
            onClick={() => setActiveTab('lan')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'lan'
                ? 'border-[#5865f2] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <Wifi size={14} />
            Rede Local (LAN)
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'cloud'
                ? 'border-[#5865f2] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <Cloud size={14} />
            Servidor Nuvem (Vercel)
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {activeTab === 'lan' ? (
            <>
              {/* Host Server Section */}
              <div className="p-4 bg-[#2b2d31] rounded-xl border border-[#3f4147] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server size={18} className="text-[#5865f2]" />
                    <span className="text-xs font-bold text-white uppercase">Hospedar Campanha (Host LAN)</span>
                  </div>
                  <button
                    onClick={onToggleHost}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      isHost
                        ? 'bg-[#da373c] text-white hover:bg-[#b82e32]'
                        : 'bg-[#23a55a] text-white hover:bg-[#1f9250]'
                    }`}
                  >
                    {isHost ? 'Parar Servidor' : 'Iniciar Servidor'}
                  </button>
                </div>

                {isHost && (
                  <div className="space-y-2 pt-2 border-t border-[#3f4147]">
                    <p className="text-[11px] text-[#949ba4]">
                      Passe o endereço abaixo para os outros jogadores na mesma rede Wi-Fi/Ethernet:
                    </p>
                    <div className="flex items-center gap-2 bg-[#1e1f22] p-2 rounded-lg border border-[#3f4147]">
                      <span className="text-xs font-mono font-bold text-[#23a55a] flex-1">{localIp}</span>
                      <button
                        onClick={copyToClipboard}
                        className="p-1 rounded hover:bg-[#35373c] text-[#949ba4] hover:text-white"
                        title="Copiar IP"
                      >
                        {copied ? <Check size={14} className="text-[#23a55a]" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#dbdee1] pt-1">
                      <Users size={14} className="text-[#5865f2]" />
                      <span>Jogadores Conectados no Host: <strong>{connectedClientsCount}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Join Server Section */}
              <div className="p-4 bg-[#2b2d31] rounded-xl border border-[#3f4147] space-y-3">
                <div className="flex items-center gap-2">
                  <Wifi size={18} className="text-[#23a55a]" />
                  <span className="text-xs font-bold text-white uppercase">Conectar a Outro Host na LAN</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={connectIp}
                    onChange={(e) => setConnectIp(e.target.value)}
                    placeholder="192.168.1.X:8080"
                    className="flex-1 bg-[#1e1f22] p-2 rounded-lg text-xs font-mono border border-[#3f4147] text-white focus:outline-none focus:border-[#5865f2]"
                  />
                  <button
                    onClick={() => {
                      alert(`Conectando ao host ${connectIp}...`);
                    }}
                    className="px-4 py-2 bg-[#23a55a] hover:bg-[#1f9250] text-white text-xs font-bold rounded-lg shadow"
                  >
                    Conectar
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Cloud / Vercel Tab */
            <div className="space-y-4">
              <div className="p-4 bg-[#2b2d31] rounded-xl border border-[#3f4147] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-[#5865f2]" />
                    <span className="text-xs font-bold text-white uppercase">Servidor Vercel (Discord-Like)</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    cloudStatus === 'connected'
                      ? 'bg-[#23a55a]/20 text-[#23a55a]'
                      : cloudStatus === 'connecting'
                      ? 'bg-[#f0b232]/20 text-[#f0b232]'
                      : 'bg-[#404249] text-[#949ba4]'
                  }`}>
                    {cloudStatus === 'connected' ? '● Conectado' : cloudStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] text-[#949ba4] font-semibold block mb-1">
                      URL da API / Servidor Vercel
                    </label>
                    <input
                      type="text"
                      value={vercelUrl}
                      onChange={(e) => setVercelUrl(e.target.value)}
                      placeholder="https://sua-api.vercel.app"
                      className="w-full bg-[#1e1f22] p-2.5 rounded-lg text-xs font-mono border border-[#3f4147] text-white focus:outline-none focus:border-[#5865f2]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#949ba4] font-semibold block mb-1">
                      Código de Convite da Campanha
                    </label>
                    <input
                      type="text"
                      value={campaignCode}
                      onChange={(e) => setCampaignCode(e.target.value)}
                      placeholder="CAMP-XYZ-1234"
                      className="w-full bg-[#1e1f22] p-2.5 rounded-lg text-xs font-mono border border-[#3f4147] text-white focus:outline-none focus:border-[#5865f2]"
                    />
                  </div>

                  <button
                    onClick={handleConnectCloud}
                    disabled={cloudStatus === 'connecting'}
                    className="w-full py-2.5 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow flex items-center justify-center gap-2 transition-all"
                  >
                    <Sparkles size={14} />
                    {cloudStatus === 'connected' ? 'Sincronizar com Servidor Vercel' : 'Conectar à Campanha Remota'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#1e1f22]/50 rounded-xl border border-[#35373c] text-[11px] text-[#949ba4] leading-relaxed">
                💡 <strong>Como funcionará na Vercel:</strong> O backend na Vercel atuará como o hub central dos servidores (registro de campanhas, autenticação e roteamento de mensagens/tokens entre jogadores remotos fora da sua rede local).
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 bg-[#2b2d31] border-t border-[#1f2023]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#35373c] hover:bg-[#404249] text-white"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
