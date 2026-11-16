import React, { useState, useEffect } from 'react';
import { OllamaService } from '../../services/ollama';
import { X, Cpu, CheckCircle2, AlertCircle, RefreshCw, Sliders } from 'lucide-react';

interface OllamaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: string;
  temperature: number;
  onSave: (model: string, temperature: number) => void;
}

export const OllamaConfigModal: React.FC<OllamaConfigModalProps> = ({
  isOpen,
  onClose,
  currentModel,
  temperature: initialTemp,
  onSave,
}) => {
  const [model, setModel] = useState(currentModel);
  const [temp, setTemp] = useState(initialTemp);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'testing' | 'online' | 'offline'>('idle');

  useEffect(() => {
    if (isOpen) {
      checkOllama();
    }
  }, [isOpen]);

  const checkOllama = async () => {
    setStatus('testing');
    const isOnline = await OllamaService.checkConnection();
    if (isOnline) {
      setStatus('online');
      const models = await OllamaService.listModels();
      setAvailableModels(models);
      if (models.length > 0 && !models.includes(model)) {
        setModel(models[0]);
      }
    } else {
      setStatus('offline');
      setAvailableModels([
        'fluffy/llama-3.1-8b-stheno-v3.4:latest',
        'richardyoung/llama-3.1-8b-instruct-abliterated:latest',
        'dolphin3:latest',
        'Dark-Eve:latest'
      ]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#313338] rounded-2xl border border-[#3f4147] shadow-2xl flex flex-col overflow-hidden text-[#dbdee1]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#2b2d31] border-b border-[#1f2023]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865f2]/20 text-[#5865f2] flex items-center justify-center">
              <Cpu size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Configurar IA Local (Ollama)</h2>
              <p className="text-xs text-[#949ba4]">Gerenciador do Mestre IA Não-Censurado</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#35373c] text-[#949ba4] hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Status indicator */}
        <div className="p-4 bg-[#2b2d31]/50 border-b border-[#1f2023] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === 'online' && (
              <>
                <CheckCircle2 size={16} className="text-[#23a55a]" />
                <span className="text-xs text-[#23a55a] font-semibold">Ollama Conectado (127.0.0.1:11434)</span>
              </>
            )}
            {status === 'offline' && (
              <>
                <AlertCircle size={16} className="text-[#da373c]" />
                <span className="text-xs text-[#da373c] font-semibold">Ollama não detectado no momento</span>
              </>
            )}
            {status === 'testing' && (
              <span className="text-xs text-[#f0b232] font-semibold">Verificando conexão...</span>
            )}
          </div>

          <button
            onClick={checkOllama}
            className="p-1.5 rounded-md hover:bg-[#35373c] text-[#949ba4] hover:text-white flex items-center gap-1 text-xs"
          >
            <RefreshCw size={13} className={status === 'testing' ? 'animate-spin' : ''} />
            Recarregar Modelos
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-[#949ba4] block mb-1">
              Modelo Local Selecionado
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[#1e1f22] p-2.5 rounded-lg border border-[#3f4147] text-white text-xs focus:outline-none focus:border-[#5865f2]"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#949ba4] mt-1.5">
              Modelos instalados localmente na sua máquina (ex: Stheno 3.4, Dolphin 3, etc.).
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase text-[#949ba4]">Criatividade / Temperatura</label>
              <span className="text-xs font-bold text-white">{temp.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.2"
              step="0.05"
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value))}
              className="w-full accent-[#5865f2]"
            />
            <div className="flex justify-between text-[10px] text-[#949ba4] mt-1">
              <span>Mais Preciso (0.2)</span>
              <span>Balanceado (0.7)</span>
              <span>Mais Criativo (1.0)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 bg-[#2b2d31] border-t border-[#1f2023]">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[#949ba4] hover:text-white">
            Cancelar
          </button>
          <button
            onClick={() => {
              onSave(model, temp);
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg shadow"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};
