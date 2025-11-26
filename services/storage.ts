import {
  User, Event, WishlistItem, UserId, EventId,
  SantaRoom, SantaRoomId, Group, GroupId, AdminStats, WishlistItemId
} from '../types';

const API_URL = (import.meta as any).env?.VITE_API_URL;

class StorageService {

  // --- Auth ---
  async loginOrRegister(tgUser: any): Promise<User> {
    const res = await fetch(`${API_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tgUser)
    });
    if (!res.ok) throw new Error('Auth failed');
    return res.json();
  }

  async updateUser(userId: UserId, data: Partial<User>): Promise<User> {
    const res = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async getUserById(id: UserId): Promise<User | null> {
    const res = await fetch(`${API_URL}/users/${id}`);
    if (!res.ok) return null;
    return res.json();
  }

  async getUsersByIds(ids: UserId[]): Promise<User[]> {
    // В реальном API лучше сделать batch запрос, но пока делаем параллельно для совместимости
    const promises = ids.map(id => this.getUserById(id));
    const users = await Promise.all(promises);
    return users.filter(Boolean) as User[];
  }

  // --- Groups ---
  async createGroup(userId: UserId, title: string, password: string, description?: string): Promise<Group> {
    const res = await fetch(`${API_URL}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, password, description })
    });
    return res.json();
  }

  async getUserGroups(userId: UserId): Promise<Group[]> {
    const res = await fetch(`${API_URL}/groups/user/${userId}`);
    return res.json();
  }

  async getGroupById(groupId: GroupId): Promise<Group | null> {
    const res = await fetch(`${API_URL}/groups/${groupId}`);
    if (!res.ok) return null;
    return res.json();
  }

  async updateGroup(groupId: GroupId, userId: UserId, updates: { title?: string; password?: string }): Promise<Group> {
    const res = await fetch(`${API_URL}/groups/${groupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...updates })
    });
    if (!res.ok) throw new Error('Update failed');
    return res.json();
  }

  async joinGroup(groupId: GroupId, userId: UserId, password?: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_URL}/groups/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, userId, password })
    });
    return res.json();
  }

  async leaveGroup(groupId: GroupId, userId: UserId): Promise<{ success: boolean }> {
    const res = await fetch(`${API_URL}/groups/${groupId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) throw new Error('Leave group failed');
    return res.json();
  }

  async deleteGroup(groupId: GroupId, userId: UserId): Promise<{ success: boolean }> {
    const res = await fetch(`${API_URL}/groups/${groupId}?userId=${userId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Delete group failed');
    return res.json();
  }

  // --- Events ---
  async createEvent(eventData: any): Promise<Event> {
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    return res.json();
  }

  async getGroupEvents(groupId: GroupId, userId?: UserId): Promise<Event[]> {
    const url = userId
      ? `${API_URL}/groups/${groupId}/events?userId=${userId}`
      : `${API_URL}/groups/${groupId}/events`;
    const res = await fetch(url);
    return res.json();
  }

  async deleteEvent(eventId: EventId, userId: UserId): Promise<{ success: boolean }> {
    const res = await fetch(`${API_URL}/events/${eventId}?userId=${userId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Delete event failed');
    return res.json();
  }

  async addContribution(eventId: EventId, userId: UserId, amount: number): Promise<Event> {
    const res = await fetch(`${API_URL}/events/${eventId}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount })
    });
    return res.json();
  }

  async toggleEventParticipation(eventId: EventId, userId: UserId): Promise<Event> {
    const res = await fetch(`${API_URL}/events/${eventId}/participate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  }

  async updatePaymentInfo(eventId: EventId, paymentInfo: string, userId: UserId): Promise<Event> {
    const res = await fetch(`${API_URL}/events/${eventId}/payment-info`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentInfo, userId })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update payment info');
    }
    return res.json();
  }

  async confirmContribution(eventId: EventId, contributionId: string): Promise<Event> {
    const res = await fetch(`${API_URL}/events/${eventId}/contributions/${contributionId}/confirm`, {
      method: 'POST'
    });
    return res.json();
  }

  async rejectContribution(eventId: EventId, contributionId: string): Promise<Event> {
    const res = await fetch(`${API_URL}/events/${eventId}/contributions/${contributionId}/reject`, {
      method: 'POST'
    });
    return res.json();
  }

  // --- Wishlist ---
  async getWishlist(userId: UserId): Promise<WishlistItem[]> {
    const res = await fetch(`${API_URL}/wishlists/${userId}`);
    return res.json();
  }

  async addWishlistItem(userId: UserId, data: { title: string, url?: string, imageUrl?: string, description?: string, priority: 'low' | 'medium' | 'high', price?: number }): Promise<WishlistItem> {
    const res = await fetch(`${API_URL}/wishlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...data })
    });
    return res.json();
  }

  async deleteWishlistItem(itemId: WishlistItemId, userId: UserId): Promise<{ success: boolean }> {
    const res = await fetch(`${API_URL}/wishlists/${itemId}?userId=${userId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Delete wishlist item failed');
    return res.json();
  }

  async parseUrl(url: string): Promise<{ title: string | null; description: string | null; imageUrl: string | null; price: number | null }> {
    try {
      const res = await fetch(`${API_URL}/parse-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      return res.json();
    } catch (e) {
      console.error('[Storage] Parse URL failed:', e);
      return { title: null, description: null, imageUrl: null, price: null };
    }
  }

  // --- Wishlist in Events ---
  async getEventWishlist(eventId: EventId): Promise<WishlistItem[]> {
    const res = await fetch(`${API_URL}/events/${eventId}/wishlist`);
    return res.json();
  }

  async bookWishlistItem(eventId: EventId, itemId: WishlistItemId, userId: UserId): Promise<WishlistItem> {
    const res = await fetch(`${API_URL}/events/${eventId}/wishlist/${itemId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  }

  async fundWishlistItem(eventId: EventId, itemId: WishlistItemId, userId: UserId): Promise<Event> {
    const res = await fetch(`${API_URL}/events/${eventId}/wishlist/${itemId}/fund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) throw new Error('Failed to fund item');
    return res.json();
  }

  async addManualFundItem(eventId: EventId, userId: UserId, title: string, url?: string, imageUrl?: string, price?: number): Promise<Event> {
    const res = await fetch(`${API_URL}/events/${eventId}/manual-fund-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, url, imageUrl, price })
    });
    if (!res.ok) throw new Error('Failed to add manual item');
    return res.json();
  }

  async updateTargetAmount(eventId: EventId, targetAmount: number, userId: UserId): Promise<Event> {
    const res = await fetch(`${API_URL}/events/${eventId}/target-amount`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetAmount, userId })
    });
    if (!res.ok) throw new Error('Failed to update target amount');
    return res.json();
  }

  async unbookWishlistItem(eventId: EventId, itemId: WishlistItemId, userId: UserId): Promise<{ item: WishlistItem; event: Event | null }> {
    const res = await fetch(`${API_URL}/events/${eventId}/wishlist/${itemId}/unbook?userId=${userId}`, {
      method: 'DELETE'
    });
    return res.json();
  }

  async toggleWishlistBooking(ownerId: UserId, itemId: WishlistItemId, bookerId: UserId): Promise<WishlistItem | null> {
    const res = await fetch(`${API_URL}/wishlists/${itemId}/toggle-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: bookerId })
    });
    if (!res.ok) throw new Error('Action failed');
    return res.json();
  }

  // --- Santa ---
  async createSantaRoom(groupId: GroupId, adminId: UserId, title: string, budget: string, deadline: string): Promise<SantaRoom> {
    const res = await fetch(`${API_URL}/santa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, adminId, title, budget, deadline })
    });
    return res.json();
  }

  async getGroupSantaRooms(groupId: GroupId): Promise<SantaRoom[]> {
    const res = await fetch(`${API_URL}/santa/group/${groupId}`);
    return res.json();
  }

  async joinSantaRoom(roomId: SantaRoomId, userId: UserId, wishText?: string, wishlistItemId?: string): Promise<any> {
    const res = await fetch(`${API_URL}/santa/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, wishText, wishlistItemId })
    });
    return res.json();
  }

  async drawSanta(roomId: SantaRoomId, adminId: UserId): Promise<boolean> {
    const res = await fetch(`${API_URL}/santa/${roomId}/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId })
    });
    const data = await res.json();
    return data.success;
  }

  async getMySantaTarget(roomId: SantaRoomId, userId: UserId): Promise<User & { santaWish?: { wishText?: string; item?: WishlistItem } } | null> {
    const res = await fetch(`${API_URL}/santa/${roomId}/target/${userId}`);
    if (!res.ok) return null;
    return res.json();
  }

  // --- Admin ---
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_URL}/admin/stats`);
    return res.json();
  }

  async getAllGroups(): Promise<Group[]> {
    const res = await fetch(`${API_URL}/admin/groups`);
    return res.json();
  }

  async getAllUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/admin/users`);
    return res.json();
  }

  async toggleUserBlock(userId: UserId): Promise<boolean> {
    // Not implemented in backend example
    return false;
  }

  // ========== ANGEL GUARDIAN (Event-based Santa) ==========

  async createEventAngelRoom(eventId: string, adminId: string, title: string, budget?: string, deadline?: string): Promise<SantaRoom> {
    const res = await fetch(`${API_URL}/events/${eventId}/angel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, title, budget, deadline })
    });
    if (!res.ok) throw new Error('Failed to create angel room');
    return res.json();
  }

  async getEventAngelRoom(eventId: string): Promise<SantaRoom | null> {
    const res = await fetch(`${API_URL}/events/${eventId}/angel`);
    if (!res.ok) return null;
    return res.json();
  }

  async joinEventAngelRoom(eventId: string, userId: string, wishText?: string, wishlistItemId?: string): Promise<SantaRoom> {
    const res = await fetch(`${API_URL}/events/${eventId}/angel/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, wishText, wishlistItemId })
    });
    if (!res.ok) throw new Error('Failed to join angel room');
    return res.json();
  }

  async drawEventAngel(eventId: string, adminId: string): Promise<SantaRoom> {
    const res = await fetch(`${API_URL}/events/${eventId}/angel/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId })
    });
    if (!res.ok) throw new Error('Failed to draw angel');
    return res.json();
  }

  async getEventAngelTarget(eventId: string, userId: string): Promise<User & { angelWish: { wishText?: string, item?: WishlistItem } }> {
    const res = await fetch(`${API_URL}/events/${eventId}/angel/target/${userId}`);
    if (!res.ok) throw new Error('Failed to get angel target');
    return res.json();
  }
}

export const storage = new StorageService();