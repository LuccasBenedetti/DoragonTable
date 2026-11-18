import { supabase } from './supabaseClient';
import { FriendItem, DirectMessage } from '../components/Home/HomeHub';

export interface SupabaseProfile {
  id: string;
  email: string;
  username: string;
  tag: string;
  avatar_url?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  custom_status?: string;
}

export class FriendshipService {
  /**
   * Ensures the current user has a valid profile in Supabase with a valid UUID.
   */
  public static async ensureProfile(user: { id: string; email: string; username: string; tag: string }): Promise<SupabaseProfile> {
    try {
      // 1. Check if user already exists by email
      const { data: byEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email.toLowerCase().trim())
        .maybeSingle();

      if (byEmail) {
        return byEmail;
      }

      // 2. Check by ID if already a valid UUID
      if (user.id && user.id.includes('-')) {
        const { data: byId } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (byId) return byId;
      }

      // 3. Otherwise, insert profile
      const newProfile = {
        email: user.email.toLowerCase().trim(),
        username: user.username.trim(),
        tag: user.tag || Math.floor(1000 + Math.random() * 9000).toString(),
        status: 'online',
        custom_status: 'Explorando DoragonTable',
      };

      const { data: created, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (!error && created) {
        return created;
      }
    } catch (err) {
      console.warn('[FriendshipService] Error ensuring profile:', err);
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      tag: user.tag,
      status: 'online',
    };
  }

  /**
   * Search for a user profile by tag (e.g. "Séphis#7371" or "Séphis" and "7371")
   */
  public static async findUserByTag(input: string): Promise<SupabaseProfile | null> {
    const clean = input.trim();
    if (!clean.includes('#')) {
      // Try by username only
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', clean)
        .limit(1)
        .maybeSingle();
      return data;
    }

    const [username, tag] = clean.split('#');
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', username.trim())
      .eq('tag', tag.trim())
      .limit(1)
      .maybeSingle();

    return data;
  }

  /**
   * Fetch all friendships for the current user and map them to FriendItem
   */
  public static async getFriends(currentUserId: string): Promise<{
    friends: FriendItem[];
    incomingRequests: FriendItem[];
    outgoingRequests: FriendItem[];
  }> {
    if (!currentUserId) {
      return { friends: [], incomingRequests: [], outgoingRequests: [] };
    }

    // 1. Fetch friendship records
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);

    if (error || !friendships || friendships.length === 0) {
      return { friends: [], incomingRequests: [], outgoingRequests: [] };
    }

    // 2. Collect other user IDs
    const otherUserIds = Array.from(
      new Set(
        friendships.map((f) =>
          f.requester_id === currentUserId ? f.addressee_id : f.requester_id
        )
      )
    );

    if (otherUserIds.length === 0) {
      return { friends: [], incomingRequests: [], outgoingRequests: [] };
    }

    // 3. Fetch profiles of those users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', otherUserIds);

    const profileMap = new Map<string, SupabaseProfile>();
    (profiles || []).forEach((p) => profileMap.set(p.id, p));

    const friends: FriendItem[] = [];
    const incomingRequests: FriendItem[] = [];
    const outgoingRequests: FriendItem[] = [];

    for (const f of friendships) {
      const isRequester = f.requester_id === currentUserId;
      const otherId = isRequester ? f.addressee_id : f.requester_id;
      const profile = profileMap.get(otherId);

      if (!profile) continue;

      const item: FriendItem = {
        id: profile.id,
        friendshipId: f.id,
        username: profile.username,
        tag: profile.tag,
        avatar_url: profile.avatar_url || '',
        status: profile.status || 'online',
        custom_status: profile.custom_status || '',
        isPending: f.status === 'pending',
        isIncoming: !isRequester && f.status === 'pending',
        isOutgoing: isRequester && f.status === 'pending',
      };

      if (f.status === 'accepted') {
        friends.push(item);
      } else if (f.status === 'pending') {
        if (!isRequester) {
          incomingRequests.push(item);
        } else {
          outgoingRequests.push(item);
        }
      }
    }

    return { friends, incomingRequests, outgoingRequests };
  }

  /**
   * Send a friend request to a user by username#tag
   */
  public static async sendRequest(currentUserId: string, targetTag: string): Promise<{ success: boolean; error?: string }> {
    const target = await this.findUserByTag(targetTag);
    if (!target) {
      return { success: false, error: `Usuário "${targetTag}" não foi encontrado.` };
    }

    if (target.id === currentUserId) {
      return { success: false, error: 'Você não pode enviar pedido de amizade para você mesmo.' };
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(
        `and(requester_id.eq.${currentUserId},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${currentUserId})`
      )
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') {
        return { success: false, error: `Você e ${target.username} já são amigos!` };
      }
      if (existing.requester_id === currentUserId) {
        return { success: false, error: `Você já enviou um pedido de amizade para ${target.username}. Aguarde ele aceitar.` };
      } else {
        // Automatically accept if the other person already sent one!
        await this.acceptRequest(existing.id);
        return { success: true };
      }
    }

    const { error: insertError } = await supabase.from('friendships').insert([
      {
        requester_id: currentUserId,
        addressee_id: target.id,
        status: 'pending',
      },
    ]);

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true };
  }

  /**
   * Accept an incoming friend request
   */
  public static async acceptRequest(friendshipId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);
    return !error;
  }

  /**
   * Reject / remove a friendship
   */
  public static async removeFriendship(friendshipId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    return !error;
  }

  /**
   * Fetch DMs between two users
   */
  public static async getDirectMessages(userAId: string, userBId: string): Promise<DirectMessage[]> {
    if (!userAId || !userBId) return [];

    const { data: msgs, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${userAId},receiver_id.eq.${userBId}),and(sender_id.eq.${userBId},receiver_id.eq.${userAId})`
      )
      .order('created_at', { ascending: true });

    if (error || !msgs) return [];

    return msgs.map((m) => {
      const date = new Date(m.created_at);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        id: m.id,
        senderId: m.sender_id,
        senderName: m.sender_id === userAId ? 'Você' : 'Amigo',
        content: m.content,
        timestamp: timeStr,
      };
    });
  }

  /**
   * Send a Direct Message
   */
  public static async sendDirectMessage(senderId: string, receiverId: string, content: string): Promise<DirectMessage | null> {
    if (!senderId || !receiverId || !content.trim()) return null;

    const { data, error } = await supabase
      .from('direct_messages')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          content: content.trim(),
        },
      ])
      .select()
      .single();

    if (error || !data) return null;

    const date = new Date(data.created_at);
    return {
      id: data.id,
      senderId: data.sender_id,
      senderName: 'Você',
      content: data.content,
      timestamp: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
}
