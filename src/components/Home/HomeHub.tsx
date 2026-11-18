import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../Auth/AuthScreen';
import { 
  Users, 
  MessageSquare, 
  UserPlus, 
  Search, 
  Send, 
  Sparkles, 
  Check, 
  X, 
  Clock,
  Compass,
  LogOut,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { Campaign } from '../../types';
import { FriendshipService } from '../../services/friendshipService';

export interface FriendItem {
  id: string;
  friendshipId?: string;
  username: string;
  tag: string;
  avatar_url?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  custom_status?: string;
  activity?: string;
  isPending?: boolean;
  isIncoming?: boolean;
  isOutgoing?: boolean;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

interface HomeHubProps {
  currentUser: UserProfile;
  campaigns: Campaign[];
  onSelectCampaign: (campaignId: string) => void;
  onInviteFriendToCampaign: (friend: FriendItem, campaignId: string) => void;
  onLogout?: () => void;
}

export const HomeHub: React.FC<HomeHubProps> = ({
  currentUser,
  campaigns,
  onSelectCampaign,
  onInviteFriendToCampaign,
  onLogout,
}) => {
  // Navigation: 'friends' or friendId for active DM
  const [activeChatFriendId, setActiveChatFriendId] = useState<string | null>(null);
  const [friendSubTab, setFriendSubTab] = useState<'online' | 'all' | 'pending' | 'add'>('online');
  const [searchTerm, setSearchTerm] = useState('');
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFriendSuccess, setAddFriendSuccess] = useState('');
  const [addFriendError, setAddFriendError] = useState('');

  // DM Input state
  const [dmInput, setDmInput] = useState('');

  // Invite modal state
  const [invitingFriend, setInvitingFriend] = useState<FriendItem | null>(null);

  // Real Supabase Friends and Requests State
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendItem[]>([]);
  const [dmsMap, setDmsMap] = useState<Record<string, DirectMessage[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSendingRequest, setIsSendingRequest] = useState<boolean>(false);

  const dmsScrollRef = useRef<HTMLDivElement | null>(null);

  // Sync current user profile and poll friends list from Supabase
  const loadFriendsData = async () => {
    if (!currentUser?.id) return;

    try {
      // Ensure current user exists with valid UUID in Supabase
      const verified = await FriendshipService.ensureProfile(currentUser);
      if (verified && verified.id && verified.id !== currentUser.id) {
        currentUser.id = verified.id;
      }

      const res = await FriendshipService.getFriends(currentUser.id);
      setFriends(res.friends);
      setIncomingRequests(res.incomingRequests);
      setOutgoingRequests(res.outgoingRequests);
    } catch (err) {
      console.warn('[HomeHub] Error loading friends:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFriendsData();
    const interval = setInterval(loadFriendsData, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Poll DMs when an active friend chat is open
  useEffect(() => {
    if (!activeChatFriendId || !currentUser?.id) return;

    let isMounted = true;
    const fetchDMs = async () => {
      try {
        const msgs = await FriendshipService.getDirectMessages(currentUser.id, activeChatFriendId);
        if (isMounted) {
          setDmsMap((prev) => ({ ...prev, [activeChatFriendId]: msgs }));
        }
      } catch (err) {
        console.warn('[HomeHub] Error fetching DMs:', err);
      }
    };

    fetchDMs();
    const dmInterval = setInterval(fetchDMs, 3000);
    return () => {
      isMounted = false;
      clearInterval(dmInterval);
    };
  }, [activeChatFriendId, currentUser]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (activeChatFriendId) {
      dmsScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dmsMap, activeChatFriendId]);

  const activeFriend = friends.find((f) => f.id === activeChatFriendId);

  const handleSendDM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmInput.trim() || !activeChatFriendId || !currentUser?.id) return;

    const content = dmInput.trim();
    setDmInput('');

    // Optimistic UI update
    const tempMsg: DirectMessage = {
      id: 'dm_temp_' + Date.now(),
      senderId: currentUser.id,
      senderName: 'Você',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDmsMap((prev) => ({
      ...prev,
      [activeChatFriendId]: [...(prev[activeChatFriendId] || []), tempMsg],
    }));

    try {
      await FriendshipService.sendDirectMessage(currentUser.id, activeChatFriendId, content);
      // Refresh real messages
      const updated = await FriendshipService.getDirectMessages(currentUser.id, activeChatFriendId);
      setDmsMap((prev) => ({ ...prev, [activeChatFriendId]: updated }));
    } catch (err) {
      console.warn('[HomeHub] Failed to send DM:', err);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFriendError('');
    setAddFriendSuccess('');

    if (!addFriendInput.trim() || !currentUser?.id) return;
    setIsSendingRequest(true);

    try {
      const res = await FriendshipService.sendRequest(currentUser.id, addFriendInput.trim());
      if (res.success) {
        setAddFriendSuccess(`Pedido de amizade enviado para ${addFriendInput.trim()}!`);
        setAddFriendInput('');
        await loadFriendsData();
      } else {
        setAddFriendError(res.error || 'Não foi possível enviar o pedido.');
      }
    } catch (err: any) {
      setAddFriendError(err.message || 'Erro ao conectar ao banco de dados.');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleAcceptRequest = async (friendshipId?: string) => {
    if (!friendshipId) return;
    await FriendshipService.acceptRequest(friendshipId);
    await loadFriendsData();
  };

  const handleRejectRequest = async (friendshipId?: string) => {
    if (!friendshipId) return;
    await FriendshipService.removeFriendship(friendshipId);
    await loadFriendsData();
  };

  // Filter friends based on current sub-tab
  const filteredFriends = friends.filter((f) => {
    if (friendSubTab === 'online') {
      if (f.status === 'offline') return false;
    }

    if (!searchTerm.trim()) return true;
    return (
      f.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.tag.includes(searchTerm)
    );
  });

  const totalPending = incomingRequests.length + outgoingRequests.length;

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0f1217]">
      {/* Secondary Left Column: Friends & DM List */}
      <div className="w-60 bg-[#14171e] border-r border-[#1f242e] flex flex-col select-none">
        {/* Friends Hub Button */}
        <div className="p-3">
          <button
            onClick={() => setActiveChatFriendId(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeChatFriendId === null
                ? 'bg-[#e63946] text-white shadow-md shadow-[#e63946]/20'
                : 'text-[#94a3b8] hover:bg-[#1c202a] hover:text-white'
            }`}
          >
            <Users size={18} />
            <span>Amigos</span>
            {incomingRequests.length > 0 && (
              <span className="ml-auto bg-[#10b981] text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                {incomingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* DMs Header */}
        <div className="px-4 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
          <span>Mensagens Diretas</span>
          <button onClick={loadFriendsData} title="Atualizar amigos" className="hover:text-white transition-colors">
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* DMs List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {friends.length === 0 ? (
            <div className="px-3 py-6 text-center text-[#64748b] text-[11px] leading-relaxed">
              Você ainda não tem amigos adicionados. Clique em <span className="text-[#10b981] font-semibold">+ Adicionar Amigo</span> acima!
            </div>
          ) : (
            friends.map((friend) => {
              const isActive = activeChatFriendId === friend.id;
              return (
                <button
                  key={friend.id}
                  onClick={() => setActiveChatFriendId(friend.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-[#1e232e] text-white'
                      : 'text-[#94a3b8] hover:bg-[#1c202a] hover:text-[#e2e8f0]'
                  }`}
                >
                  {/* Avatar & Dot */}
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-[#252b38] flex items-center justify-center font-bold text-xs text-white border border-[#333a4a]">
                      {friend.username.substring(0, 2).toUpperCase()}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#14171e] ${
                        friend.status === 'online'
                          ? 'bg-[#10b981]'
                          : friend.status === 'idle'
                          ? 'bg-[#f59e0b]'
                          : 'bg-[#64748b]'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col text-left truncate flex-1">
                    <span className="truncate text-white font-medium text-xs">{friend.username}</span>
                    <span className="text-[10px] text-[#64748b] truncate">
                      {friend.custom_status || `@${friend.tag}`}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* User Profile Bar at Bottom of HomeHub Sidebar */}
        <div className="h-14 bg-[#101318] px-3 flex items-center justify-between border-t border-[#1f242e] select-none">
          <div className="flex items-center gap-2.5 p-1 rounded-xl flex-1 min-w-0 mr-1">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#252b38] flex items-center justify-center font-bold text-xs text-white border border-[#333a4a]">
                {currentUser.username ? currentUser.username.substring(0, 2).toUpperCase() : 'EU'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10b981] rounded-full border-2 border-[#101318]" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">{currentUser.username}</span>
              <span className="text-[10px] text-[#64748b] truncate font-mono">#{currentUser.tag}</span>
            </div>
          </div>

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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0f14]">
        {activeChatFriendId && activeFriend ? (
          /* ======================================================== */
          /* DIRECT MESSAGE (DM) VIEW                                 */
          /* ======================================================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* DM Header */}
            <div className="h-14 px-6 border-b border-[#1f242e] bg-[#14171e]/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-[#252b38] flex items-center justify-center font-bold text-xs text-white border border-[#333a4a]">
                    {activeFriend.username.substring(0, 2).toUpperCase()}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#14171e] ${
                      activeFriend.status === 'online' ? 'bg-[#10b981]' : 'bg-[#64748b]'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    {activeFriend.username}
                    <span className="text-[#64748b] font-normal text-xs">#{activeFriend.tag}</span>
                  </h3>
                  <p className="text-[11px] text-[#94a3b8]">{activeFriend.custom_status || 'Conversa privada em tempo real'}</p>
                </div>
              </div>

              {/* Action: Invite to Campaign */}
              <button
                onClick={() => setInvitingFriend(activeFriend)}
                className="px-3.5 py-1.5 rounded-xl bg-[#e63946]/15 hover:bg-[#e63946]/25 border border-[#e63946]/30 text-[#e63946] text-xs font-bold flex items-center gap-2 transition-all"
              >
                <Compass size={14} />
                <span>Convidar para Campanha</span>
              </button>
            </div>

            {/* DM Messages Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-4 bg-[#14171e] border border-[#222834] rounded-2xl max-w-lg mb-6">
                <h4 className="font-bold text-white text-sm mb-1">Início da conversa com {activeFriend.username}</h4>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Este é o início do histórico seguro de mensagens privadas entre você e {activeFriend.username}.
                </p>
              </div>

              {(dmsMap[activeFriend.id] || []).length === 0 ? (
                <div className="text-center py-8 text-xs text-[#64748b]">
                  Nenhuma mensagem ainda. Diga um "Olá!" para começar.
                </div>
              ) : (
                (dmsMap[activeFriend.id] || []).map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className="flex gap-3 text-xs animate-in fade-in">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[11px] shrink-0 border ${
                        isMe ? 'bg-[#e63946] border-[#ff6b6b]/40' : 'bg-[#252b38] border-[#333a4a]'
                      }`}>
                        {msg.senderName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isMe ? 'text-[#e63946]' : 'text-white'}`}>
                            {msg.senderName}
                          </span>
                          <span className="text-[10px] text-[#64748b]">{msg.timestamp}</span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed p-2.5 rounded-xl border inline-block ${
                          isMe
                            ? 'bg-[#1e1416] border-[#3d181c] text-[#f1f5f9]'
                            : 'bg-[#14171e] border-[#1f242e] text-[#e2e8f0]'
                        }`}>
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={dmsScrollRef} />
            </div>

            {/* DM Input Bar */}
            <form onSubmit={handleSendDM} className="p-4 border-t border-[#1f242e] bg-[#14171e]/50">
              <div className="flex items-center gap-2 bg-[#1b1f28] border border-[#29303d] rounded-2xl px-4 py-2.5 focus-within:border-[#e63946] transition-colors">
                <input
                  type="text"
                  value={dmInput}
                  onChange={(e) => setDmInput(e.target.value)}
                  placeholder={`Conversar com @${activeFriend.username}...`}
                  className="flex-1 bg-transparent text-xs text-white placeholder-[#64748b] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!dmInput.trim()}
                  className="p-1.5 rounded-xl bg-[#e63946] hover:bg-[#d02e3b] text-white disabled:opacity-30 transition-all cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ======================================================== */
          /* FRIENDS HUB VIEW                                         */
          /* ======================================================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar Tabs */}
            <div className="h-14 px-6 border-b border-[#1f242e] bg-[#14171e]/70 flex items-center gap-4">
              <div className="flex items-center gap-2 font-bold text-sm text-white pr-4 border-r border-[#262c38]">
                <Users size={18} className="text-[#e63946]" />
                <span>Amigos</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  onClick={() => setFriendSubTab('online')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    friendSubTab === 'online'
                      ? 'bg-[#222834] text-white'
                      : 'text-[#94a3b8] hover:bg-[#1a1f28] hover:text-white'
                  }`}
                >
                  Disponível ({friends.filter((f) => f.status !== 'offline').length})
                </button>
                <button
                  onClick={() => setFriendSubTab('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    friendSubTab === 'all'
                      ? 'bg-[#222834] text-white'
                      : 'text-[#94a3b8] hover:bg-[#1a1f28] hover:text-white'
                  }`}
                >
                  Todos ({friends.length})
                </button>
                <button
                  onClick={() => setFriendSubTab('pending')}
                  className={`px-3 py-1.5 rounded-xl transition-all relative ${
                    friendSubTab === 'pending'
                      ? 'bg-[#222834] text-white'
                      : 'text-[#94a3b8] hover:bg-[#1a1f28] hover:text-white'
                  }`}
                >
                  Pendentes {totalPending > 0 && `(${totalPending})`}
                  {incomingRequests.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block ml-1 animate-pulse" />
                  )}
                </button>
                <button
                  onClick={() => setFriendSubTab('add')}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all ml-2 ${
                    friendSubTab === 'add'
                      ? 'bg-[#10b981] text-white'
                      : 'bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/25'
                  }`}
                >
                  + Adicionar Amigo
                </button>
              </div>
            </div>

            {/* Sub-tab: Add Friend */}
            {friendSubTab === 'add' ? (
              <div className="p-8 max-w-xl">
                <h3 className="text-base font-bold text-white mb-1">Adicionar Amigo</h3>
                <p className="text-xs text-[#94a3b8] mb-6">
                  Você pode adicionar amigos usando a Tag do DoragonTable (exemplo: <code className="text-[#e63946] bg-[#1a1f29] px-1.5 py-0.5 rounded font-mono">Séphis#7371</code>).
                </p>

                <form onSubmit={handleAddFriend} className="flex gap-2">
                  <div className="flex-1 bg-[#14171e] border border-[#262c38] rounded-xl px-4 py-2.5 flex items-center focus-within:border-[#e63946] transition-colors">
                    <input
                      type="text"
                      value={addFriendInput}
                      onChange={(e) => setAddFriendInput(e.target.value)}
                      placeholder="Nome#1234"
                      className="w-full bg-transparent text-xs text-white placeholder-[#64748b] focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!addFriendInput.trim() || isSendingRequest}
                    className="px-5 py-2.5 bg-[#e63946] hover:bg-[#d02e3b] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 shadow-md cursor-pointer flex items-center gap-2"
                  >
                    {isSendingRequest ? <RefreshCw size={14} className="animate-spin" /> : null}
                    <span>Enviar Pedido</span>
                  </button>
                </form>

                {addFriendSuccess && (
                  <div className="mt-4 p-3 bg-[#10b981]/15 border border-[#10b981]/30 rounded-xl text-xs text-[#10b981] font-semibold flex items-center gap-2 animate-in fade-in">
                    <Check size={14} />
                    {addFriendSuccess}
                  </div>
                )}
                {addFriendError && (
                  <div className="mt-4 p-3 bg-[#ef4444]/15 border border-[#ef4444]/30 rounded-xl text-xs text-[#ef4444] font-semibold flex items-center gap-2 animate-in fade-in">
                    <X size={14} />
                    {addFriendError}
                  </div>
                )}

                <div className="mt-8 p-4 bg-[#14171e] border border-[#222834] rounded-2xl">
                  <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">
                    Sua Tag de Jogador:
                  </span>
                  <span className="text-sm font-mono font-bold text-white bg-[#1b1f28] px-2.5 py-1 rounded-lg border border-[#2a3140] inline-block">
                    {currentUser.username}#{currentUser.tag}
                  </span>
                  <p className="text-[11px] text-[#94a3b8] mt-2">
                    Compartilhe essa tag com seus amigos para que eles possam te adicionar!
                  </p>
                </div>
              </div>
            ) : friendSubTab === 'pending' ? (
              /* Sub-tab: Pending Friend Requests */
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* Incoming Requests */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#10b981] mb-3 flex items-center gap-1.5">
                    <UserPlus size={14} />
                    <span>Pedidos Recebidos — {incomingRequests.length}</span>
                  </div>

                  {incomingRequests.length === 0 ? (
                    <div className="p-4 bg-[#14171e]/50 border border-[#1f242e] rounded-xl text-[#64748b] text-xs text-center">
                      Nenhum pedido de amizade pendente para aceitar.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {incomingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-[#14171e] border border-[#10b981]/30 hover:border-[#10b981] transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center font-bold text-sm border border-[#10b981]/40">
                              {req.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-white">
                                {req.username} <span className="text-[#64748b] font-mono">#{req.tag}</span>
                              </div>
                              <div className="text-[11px] text-[#10b981]">Quer ser seu amigo no DoragonTable</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAcceptRequest(req.friendshipId)}
                              className="px-3 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
                              title="Aceitar Pedido"
                            >
                              <Check size={14} />
                              <span>Aceitar</span>
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.friendshipId)}
                              className="p-1.5 bg-[#222834] hover:bg-[#ef4444] text-[#94a3b8] hover:text-white rounded-xl transition-all cursor-pointer"
                              title="Recusar Pedido"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Outgoing Requests */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-3 flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>Pedidos Enviados — {outgoingRequests.length}</span>
                  </div>

                  {outgoingRequests.length === 0 ? (
                    <div className="p-4 bg-[#14171e]/50 border border-[#1f242e] rounded-xl text-[#64748b] text-xs text-center">
                      Nenhum pedido de amizade enviado aguardando resposta.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {outgoingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-[#14171e] border border-[#1f242e]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#252b38] flex items-center justify-center font-bold text-sm text-white border border-[#333a4a]">
                              {req.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-white">
                                {req.username} <span className="text-[#64748b] font-mono">#{req.tag}</span>
                              </div>
                              <div className="text-[11px] text-[#94a3b8]">Aguardando resposta do amigo...</div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRejectRequest(req.friendshipId)}
                            className="p-1.5 bg-[#1b2029] hover:bg-[#ef4444] text-[#64748b] hover:text-white rounded-xl transition-all cursor-pointer"
                            title="Cancelar Pedido"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Sub-tab: Friends List (Online or All) */
              <div className="flex-1 p-6 overflow-y-auto">
                {/* Search Bar */}
                <div className="mb-6 relative max-w-md">
                  <Search size={16} className="absolute left-3.5 top-3 text-[#64748b]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar amigos por nome ou tag..."
                    className="w-full bg-[#14171e] border border-[#222834] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#e63946]"
                  />
                </div>

                <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-3">
                  Amigos — {filteredFriends.length}
                </div>

                {filteredFriends.length === 0 ? (
                  <div className="p-12 text-center text-[#64748b] text-xs space-y-2">
                    <p>Nenhum amigo nesta lista no momento.</p>
                    <button
                      onClick={() => setFriendSubTab('add')}
                      className="px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <UserPlus size={14} />
                      Adicionar um Amigo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-[#14171e] border border-[#1f242e] hover:border-[#2b3240] transition-all group"
                      >
                        {/* Avatar & Info */}
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-[#252b38] flex items-center justify-center font-bold text-sm text-white border border-[#333a4a]">
                              {friend.username.substring(0, 2).toUpperCase()}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#14171e] ${
                                friend.status === 'online'
                                  ? 'bg-[#10b981]'
                                  : friend.status === 'idle'
                                  ? 'bg-[#f59e0b]'
                                  : 'bg-[#64748b]'
                              }`}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                              <span>{friend.username}</span>
                              <span className="text-[#64748b] font-normal text-[11px]">#{friend.tag}</span>
                            </div>
                            <div className="text-[11px] text-[#94a3b8] mt-0.5">
                              {friend.activity ? (
                                <span className="text-[#e63946] font-semibold">{friend.activity}</span>
                              ) : (
                                friend.custom_status || (friend.status === 'online' ? 'Disponível' : 'Offline')
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveChatFriendId(friend.id)}
                            className="p-2.5 rounded-xl bg-[#1f242e] hover:bg-[#282f3c] text-[#94a3b8] hover:text-white transition-all cursor-pointer"
                            title="Conversar no Privado"
                          >
                            <MessageSquare size={16} />
                          </button>

                          <button
                            onClick={() => setInvitingFriend(friend)}
                            className="px-3 py-1.5 rounded-xl bg-[#1f242e] hover:bg-[#e63946] text-[#94a3b8] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Convidar para Campanha"
                          >
                            <Compass size={14} />
                            <span className="hidden sm:inline">Convidar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Friend to Campaign Modal */}
      {invitingFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in select-none">
          <div className="w-full max-w-sm bg-[#14171e] rounded-2xl border border-[#262c38] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222732] mb-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Compass size={18} className="text-[#e63946]" />
                Convidar {invitingFriend.username}
              </h3>
              <button
                onClick={() => setInvitingFriend(null)}
                className="text-[#64748b] hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#94a3b8] mb-4">
              Escolha para qual de suas campanhas deseja convidar <strong className="text-white">@{invitingFriend.username}</strong>:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {campaigns.map((camp) => (
                <button
                  key={camp.id}
                  onClick={() => {
                    onInviteFriendToCampaign(invitingFriend, camp.id);
                    setInvitingFriend(null);
                    alert(`Convite enviado para ${invitingFriend.username} entrar em "${camp.name}"!`);
                  }}
                  className="w-full p-3 rounded-xl bg-[#1b2029] hover:bg-[#242b37] border border-[#282f3c] hover:border-[#e63946] flex items-center gap-3 transition-all text-left cursor-pointer"
                >
                  <span className="text-xl">{camp.icon || '🐉'}</span>
                  <div className="truncate flex-1">
                    <span className="font-bold text-xs text-white block truncate">{camp.name}</span>
                    <span className="text-[10px] text-[#e63946] uppercase font-bold tracking-wider">{camp.ruleset}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setInvitingFriend(null)}
              className="w-full py-2 bg-[#222834] hover:bg-[#2b3240] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
