import React, { useState } from 'react';
import { LoreEntity } from '../../types';
import { X, Book, Search, Plus, Tag, Eye, EyeOff, ShieldAlert, Sparkles, Filter } from 'lucide-react';

interface LoreBibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  loreEntities: LoreEntity[];
  onAddEntity: (entity: LoreEntity) => void;
  onDeleteEntity: (id: string) => void;
}

export const LoreBibleModal: React.FC<LoreBibleModalProps> = ({
  isOpen,
  onClose,
  loreEntities,
  onAddEntity,
  onDeleteEntity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New Entity Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<LoreEntity['category']>('npc');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newKnown, setNewKnown] = useState(true);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'npc', label: 'NPCs & Pessoas' },
    { id: 'location', label: 'Locais & Reinos' },
    { id: 'faction', label: 'Facções & Ordens' },
    { id: 'item', label: 'Itens & Artefatos' },
    { id: 'event', label: 'Eventos & Fatos' },
    { id: 'secret', label: 'Segredos Ocultos' },
  ];

  const filteredEntities = loreEntities.filter((e) => {
    const matchCategory = selectedCategory === 'all' || e.category === selectedCategory;
    const matchSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const handleCreateEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDesc.trim()) return;

    const entity: LoreEntity = {
      id: 'lore_' + Date.now(),
      name: newName.trim(),
      category: newCategory,
      description: newDesc.trim(),
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      lastUpdated: new Date().toLocaleDateString('pt-BR'),
      knownByPlayers: newKnown,
    };

    onAddEntity(entity);
    setNewName('');
    setNewDesc('');
    setNewTags('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-4xl bg-[#313338] rounded-2xl border border-[#3f4147] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-[#dbdee1]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#2b2d31] border-b border-[#1f2023]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865f2]/20 text-[#5865f2] flex items-center justify-center">
              <Book size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Memória do Mundo & Lorebook da IA
                <span className="text-[11px] bg-[#5865f2] text-white px-2 py-0.5 rounded-full font-normal">
                  {loreEntities.length} registros
                </span>
              </h2>
              <p className="text-xs text-[#949ba4]">
                Tudo que a IA local sabe sobre esta campanha para consulta e coerência perpétua.
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

        {/* Toolbar */}
        <div className="p-4 bg-[#2b2d31]/40 border-b border-[#2b2d31] flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 text-[#949ba4]" size={15} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, tag ou palavra-chave..."
              className="w-full bg-[#1e1f22] pl-9 pr-3 py-1.5 rounded-lg text-xs text-[#dbdee1] border border-[#3f4147] focus:outline-none focus:border-[#5865f2]"
            />
          </div>

          {/* New Entity Toggle */}
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#5865f2] hover:bg-[#4752c4] text-white flex items-center gap-1.5 shadow"
          >
            <Plus size={14} /> Registrar Novo Fato/Entidade
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#2b2d31]/20 border-b border-[#1f2023] overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c]/50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Create Entity Drawer */}
        {isAdding && (
          <form
            onSubmit={handleCreateEntity}
            className="p-4 bg-[#232428] border-b border-[#3f4147] space-y-3 animate-in slide-in-from-top-2"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-[#949ba4] uppercase">Nome da Entidade</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Taverna do Javali Saltitante, Lorde Richard, Relíquia de Aethel..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#1e1f22] p-2 rounded-lg text-xs border border-[#3f4147] text-white mt-1 focus:outline-none focus:border-[#5865f2]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#949ba4] uppercase">Categoria</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#1e1f22] p-2 rounded-lg text-xs border border-[#3f4147] text-white mt-1 focus:outline-none focus:border-[#5865f2]"
                >
                  <option value="npc">NPC / Personagem</option>
                  <option value="location">Local / Região</option>
                  <option value="faction">Facção / Organização</option>
                  <option value="item">Item / Artefato</option>
                  <option value="event">Evento / Acontecimento</option>
                  <option value="secret">Segredo Oculto</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#949ba4] uppercase">
                Descrição Detalhada & Fatos Históricos
              </label>
              <textarea
                required
                rows={3}
                placeholder="Descreva a história, personalidade, laços, segredos ou acontecimentos deste registro..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-[#1e1f22] p-2 rounded-lg text-xs border border-[#3f4147] text-white mt-1 focus:outline-none focus:border-[#5865f2] resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-[#949ba4] uppercase">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="Ex: taverneiro, vila, pista_assassinato, magia"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-[#1e1f22] p-2 rounded-lg text-xs border border-[#3f4147] text-white mt-1 focus:outline-none focus:border-[#5865f2]"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <label className="flex items-center gap-1.5 text-xs text-[#dbdee1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newKnown}
                    onChange={(e) => setNewKnown(e.target.checked)}
                    className="rounded text-[#5865f2]"
                  />
                  Conhecido pelos Jogadores
                </label>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#949ba4] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#23a55a] hover:bg-[#1f9250] text-white shadow"
                >
                  Salvar no Lorebook
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Entities List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filteredEntities.length === 0 ? (
            <div className="text-center py-12 text-[#949ba4]">
              <Book size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">Nenhuma memória encontrada.</p>
              <p className="text-xs">Conforme você joga no Modo IA, novos fatos serão gravados automaticamente aqui.</p>
            </div>
          ) : (
            filteredEntities.map((entity) => (
              <div
                key={entity.id}
                className="p-3.5 bg-[#2b2d31] rounded-xl border border-[#3f4147] hover:border-[#5865f2]/60 transition-all flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{entity.name}</span>
                    <span className="text-[10px] font-semibold uppercase bg-[#1e1f22] text-[#5865f2] px-2 py-0.5 rounded-md border border-[#3f4147]">
                      {entity.category}
                    </span>
                    {entity.knownByPlayers ? (
                      <span className="text-[10px] text-[#23a55a] flex items-center gap-1 font-medium">
                        <Eye size={12} /> Visível aos Jogadores
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#f0b232] flex items-center gap-1 font-medium">
                        <EyeOff size={12} /> Segredo do Mestre
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteEntity(entity.id)}
                    className="text-[#949ba4] hover:text-[#da373c] text-xs p-1"
                    title="Excluir Registro"
                  >
                    Excluir
                  </button>
                </div>

                <p className="text-xs text-[#dbdee1] leading-relaxed whitespace-pre-line">
                  {entity.description}
                </p>

                {entity.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-[#1f2023]/60">
                    <Tag size={11} className="text-[#949ba4]" />
                    {entity.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-[#1e1f22] text-[#949ba4] px-1.5 py-0.5 rounded"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
