
export enum ViewState {
  // Global States
  LOBBY = 'LOBBY',
  CREATE_GROUP = 'CREATE_GROUP',
  JOIN_GROUP = 'JOIN_GROUP',

  // In-Room States
  DASHBOARD = 'DASHBOARD',
  GROUP_SETTINGS = 'GROUP_SETTINGS',
  EVENTS = 'EVENTS', // New Tab
  WISHLIST = 'WISHLIST',
  CREATE_EVENT = 'CREATE_EVENT',
  PROFILE = 'PROFILE',
  FRIEND_PROFILE = 'FRIEND_PROFILE',
  EVENT_DETAILS = 'EVENT_DETAILS',
  SECRET_SANTA = 'SECRET_SANTA',
  SANTA_GAME = 'SANTA_GAME',

  // Admin
  ADMIN = 'ADMIN'
}

export type UserId = string;
export type EventId = string;
export type GroupId = string;
export type WishlistItemId = string;
export type ContributionId = string;
export type GiftOptionId = string;
export type SantaRoomId = string;

export interface User {
  id: UserId; // Internal UUID or mapped Telegram ID
  telegramId?: number; // Real Telegram ID
  name: string;
  username?: string;
  avatarUrl?: string;
  birthday?: string; // ISO Date string YYYY-MM-DD
  preferences?: string[];
  isBlocked?: boolean; // Admin ban flag
  isAdmin?: boolean; // Admin access flag
  createdAt: number;
}

export interface Group {
  id: GroupId; // Public 6-char access code (Short ID)
  title: string;
  description?: string;
  creatorId: UserId;
  password: string; // Mandatory password for all groups
  members: UserId[]; // Array of User IDs
  createdAt: number;
}

export interface WishlistItem {
  id: WishlistItemId;
  userId: UserId;
  title: string;
  description?: string;
  price?: number;
  url?: string;
  imageUrl?: string;
  priority: 'low' | 'medium' | 'high';
  isBooked?: boolean;
  bookedBy?: UserId;
  bookedForEventId?: EventId;
  bookingMode?: 'INDIVIDUAL' | 'GROUP_FUNDING';
  createdAt: number;
}

export enum ParticipantStatus {
  INVITED = 'INVITED',
  JOINED = 'JOINED',
  DECLINED = 'DECLINED'
}

// Статус самого платежа
export enum ContributionStatus {
  PENDING = 'PENDING',   // Пользователь нажал "Я перевел"
  CONFIRMED = 'CONFIRMED', // Организатор подтвердил
  REJECTED = 'REJECTED'    // Платеж не найден
}

export interface Contribution {
  id: ContributionId;
  eventId: EventId;
  userId: UserId;
  amount: number;
  date: number;
  status: ContributionStatus;
}

export interface EventParticipant {
  userId: UserId;
  status: ParticipantStatus;
  paidAmount: number;
  joinedAt: number;
}

export interface GiftOption {
  id: GiftOptionId;
  eventId: EventId;
  title: string;
  price?: number;
  url?: string;
  votes: number; // Количество голосов за этот вариант
  suggestedBy: UserId;
}

export interface Event {
  id: EventId;
  groupId: GroupId; // Now Mandatory
  title: string;
  description?: string;
  date: string; // ISO date string
  beneficiaryId?: UserId; // Для кого событие (именинник)
  targetAmount: number;
  currency: string; // RUB, USD, STARS
  creatorId: UserId;
  participants: EventParticipant[];
  contributions?: Contribution[]; // Список транзакций
  giftOptions?: GiftOption[]; // Варианты подарков на обсуждение
  paymentInfo?: string; // Реквизиты для перевода
  paymentInfoSetBy?: UserId; // Кто добавил реквизиты (first-come-first-served)
  wishlistBookings?: WishlistItem[]; // Товары, забронированные для этого события
  createdAt: number;
  isClosed: boolean;
}

// --- Secret Santa Types ---

export enum SantaRoomStatus {
  WAITING = 'WAITING',   // Ожидание участников
  DRAWN = 'DRAWN',       // Жеребьевка проведена
  COMPLETED = 'COMPLETED' // Завершено
}

export interface SantaRoom {
  id: SantaRoomId;
  groupId: GroupId; // Linked to a group
  eventId?: EventId; // Optional: for Angel Guardian
  title: string;
  budget?: string;
  deadline?: string;
  password?: string; // Если есть, вход только по паролю
  adminId: UserId;
  participants: UserId[];
  participantInfo?: Record<UserId, { wishText?: string; wishlistItemId?: string }>; // Пожелания участников
  assignments: Record<UserId, UserId>; // Кто(Key) -> Кому(Value)
  status: SantaRoomStatus;
  createdAt: number;
}

export interface AdminStats {
  totalUsers: number;
  totalGroups: number;
  totalEvents: number;
  totalSantaRooms: number;
  totalMoneyExpected: number;
}

export interface AppState {
  currentUser: User | null;
  activeGroupId: GroupId | null;
  currentView: ViewState;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        enableClosingConfirmation: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        openTelegramLink: (url: string) => void;
        initData: string;
        initDataUnsafe: {
          start_param?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          setParams: (params: {
            text?: string;
            color?: string;
            text_color?: string;
            is_active?: boolean;
            is_visible?: boolean;
          }) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
      };
    };
  }
}