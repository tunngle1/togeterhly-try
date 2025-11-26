
import React, { useState, useEffect, useCallback } from 'react';
import { BottomNav } from './components/BottomNav';
import { ViewState, User, Group, Event, SantaRoom, SantaRoomStatus, WishlistItem, WishlistItemId } from './types';
import { storage } from './services/storage';
import { AdminPanel } from './components/AdminPanel';
import { TogetherlyLogo } from './components/shared/TogetherlyLogo';
import { UserAvatar } from './components/shared/UserAvatar';
import { EmptyState } from './components/shared/EmptyState';
import { WishlistItemCard } from './components/shared/WishlistItemCard';
import { ClickableUserName } from './components/shared/ClickableUserName';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { CreateGroupScreen } from './components/screens/CreateGroupScreen';
import { JoinGroupScreen } from './components/screens/JoinGroupScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import {
  Gift, Users, Sparkles, ArrowRight, Plus, LogIn, Lock,
  ChevronRight, Copy, Check, ArrowLeft, PartyPopper,
  Calendar, DollarSign, Eye, EyeOff, Clock, Target, ShieldCheck, Share,
  Trash2, ExternalLink, X, Save, Settings, Edit3, CheckCircle, UserPlus, Wallet, Trees, Upload
} from 'lucide-react';

// --- CONFIGURATION ---
// Впишите сюда юзернейм вашего бота без @ (созданного в BotFather)
const BOT_USERNAME = 'YOUR_BOT_USERNAME';

// --- SHARED COMPONENTS NOW IMPORTED FROM components/shared/ ---

// --- TELEGRAM HELPERS ---
const useTelegramMainButton = (
  text: string,
  onClick: () => void,
  isVisible: boolean = true,
  isLoading: boolean = false
) => {
  useEffect(() => {
    const tg = window.Telegram?.WebApp?.MainButton;
    if (!tg) return;

    tg.setText(text.toUpperCase());
    tg.onClick(onClick);

    if (isVisible) tg.show();
    else tg.hide();

    if (isLoading) tg.showProgress();
    else tg.hideProgress();

    return () => {
      tg.offClick(onClick);
      tg.hide();
    };
  }, [text, onClick, isVisible, isLoading]);
};

// --- UI COMPONENTS ---

const SectionHeader = ({ title, action }: { title: string, action?: React.ReactNode }) => (
  <div className="flex justify-between items-end mb-4 px-1">
    <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
    {action}
  </div>
);



// --- DYNAMIC FAB COMPONENT ---
interface DynamicFABProps {
  currentView: ViewState;
  user: User;
  onClick: (action: string) => void;
}

const DynamicFAB = ({ currentView, user, onClick }: DynamicFABProps) => {
  // FAB is hidden in these views
  const hiddenViews = [
    ViewState.LOBBY, ViewState.CREATE_GROUP, ViewState.JOIN_GROUP,
    ViewState.CREATE_EVENT, ViewState.EVENT_DETAILS, ViewState.GROUP_SETTINGS,
    ViewState.FRIEND_PROFILE
  ];

  if (hiddenViews.includes(currentView)) return null;

  let icon = Plus;
  let action = 'default';
  let colorClass = 'bg-rose-500 shadow-red-300';
  let animateClass = '';

  switch (currentView) {
    case ViewState.DASHBOARD:
      icon = Calendar;
      action = 'create_event_shortcut';
      break;
    case ViewState.WISHLIST:
      icon = Plus;
      action = 'add_wish';
      break;
    case ViewState.EVENTS:
      icon = Plus;
      action = 'create_event';
      break;
    case ViewState.SECRET_SANTA:
    case ViewState.SANTA_GAME:
      icon = Trees;
      action = 'santa_magic';
      colorClass = 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-300';
      break;
    case ViewState.PROFILE:
      if (user.isAdmin) {
        icon = ShieldCheck;
        action = 'admin';
        colorClass = 'bg-slate-800 shadow-slate-400';
      } else {
        icon = Gift;
        action = 'about';
        colorClass = 'bg-gradient-to-br from-rose-500 to-slate-800 shadow-red-300';
      }
      break;
  }

  return (
    <button
      onClick={() => onClick(action)}
      className={`fixed bottom-28 right-4 w-16 h-16 rounded-full text-white shadow-xl flex items-center justify-center active:scale-90 transition-transform z-50 ${colorClass}`}
    >
      <span className={animateClass}>
        <React.Fragment>
          {/* Icon Render */}
          {React.createElement(icon, { size: 32 })}
        </React.Fragment>
      </span>
    </button>
  );
};


// --- LOBBY SCREEN COMPONENTS ---

// LobbyScreen now imported from components/screens/LobbyScreen.tsx

// CreateGroupScreen now imported from components/screens/CreateGroupScreen.tsx

// JoinGroupScreen now imported from components/screens/JoinGroupScreen.tsx

// --- GROUP SETTINGS SCREEN ---
const GroupSettingsScreen = ({ group, user, onBack, onUpdated, onLeaveGroup, onDeleteGroup }: {
  group: Group,
  user: User,
  onBack: () => void,
  onUpdated: (g: Group) => void,
  onLeaveGroup?: () => void,
  onDeleteGroup?: () => void
}) => {
  const [title, setTitle] = useState(group.title);
  const [password, setPassword] = useState(group.password);
  const [loading, setLoading] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isHost = group.creatorId === user.id;

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedGroup = await storage.updateGroup(group.id, user.id, { title, password });
      onUpdated(updatedGroup);
      onBack();
    } catch (e) {
      alert("Ошибка сохранения");
    }
    setLoading(false);
  };

  const handleLeaveRoom = async () => {
    if (!onLeaveGroup) return;
    try {
      await storage.leaveGroup(group.id, user.id);
      setShowLeaveConfirm(false);
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
      onLeaveGroup();
    } catch (e) {
      alert('Ошибка при выходе из комнаты');
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('error');
    }
  };

  const handleDeleteRoom = async () => {
    if (!onDeleteGroup) return;
    try {
      await storage.deleteGroup(group.id, user.id);
      setShowDeleteConfirm(false);
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
      onDeleteGroup();
    } catch (e) {
      alert('Ошибка при удалении комнаты');
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('error');
    }
  };

  useTelegramMainButton("Сохранить", handleSave, true, loading);

  return (
    <div className="p-4 min-h-screen bg-white flex flex-col">
      <button onClick={onBack} className="mb-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 py-2 self-start">
        <ArrowLeft size={20} /> Назад
      </button>
      <h2 className="text-2xl font-bold mb-1 text-slate-900">Настройки комнаты</h2>
      <p className="text-slate-500 text-sm mb-8">Изменить название и пароль</p>

      <div className="space-y-6 flex-1">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Название</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none font-medium text-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Пароль</label>
          <div className="relative">
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none pl-12"
            />
            <Lock size={20} className="absolute left-4 top-4 text-slate-400" />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Опасная зона</h4>

          {isHost && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center gap-3 border border-rose-100 active:scale-95 transition-transform mb-3"
            >
              <Trash2 size={20} />
              <div className="text-left flex-1">
                <div className="font-bold text-sm">Удалить комнату</div>
                <div className="text-xs text-rose-500">Удалит все события и данные навсегда</div>
              </div>
            </button>
          )}

          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full bg-slate-50 text-slate-600 p-4 rounded-2xl flex items-center gap-3 border border-slate-200 active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} />
            <div className="text-left flex-1">
              <div className="font-bold text-sm">Покинуть комнату</div>
              <div className="text-xs text-slate-500">
                {isHost ? 'Права хоста перейдут другому' : 'Вы сможете вернуться по коду'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all"
        >
          {loading ? "Сохранение..." : "Сохранить изменения"}
        </button>
      </div>

      {/* Leave Room Confirmation */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowLeaveConfirm(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in zoom-in-95 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowLeaveConfirm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowLeft size={32} className="text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Покинуть комнату?</h3>
              <p className="text-slate-500 text-sm">Вы покинете комнату "{group.title}". Вы сможете вернуться по коду и паролю.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600"
              >
                Отмена
              </button>
              <button
                onClick={handleLeaveRoom}
                className="flex-1 py-3 bg-slate-600 text-white rounded-xl font-bold"
              >
                Покинуть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in zoom-in-95 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDeleteConfirm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Удалить комнату?</h3>
              <p className="text-slate-500 text-sm mb-3">Комната "{group.title}" будет удалена навсегда вместе со всеми событиями и данными.</p>
              <p className="text-rose-600 text-xs font-bold">⚠️ Это действие нельзя отменить!</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteRoom}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- EVENTS & CREATE EVENT SCREENS ---

const EventsScreen = ({ group, user, onOpenEvent, onCreateEvent }: { group: Group, user: User, onOpenEvent: (e: Event) => void, onCreateEvent: () => void }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPastEvents, setShowPastEvents] = useState(false);

  useEffect(() => {
    storage.getGroupEvents(group.id, user.id).then(events => {
      setEvents(events);
      setLoading(false);
    });
  }, [group]);

  // Split events into upcoming and past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = events.filter(e => new Date(e.date) >= today);
  const pastEvents = events.filter(e => new Date(e.date) < today);

  return (
    <div className="p-4 pb-24">
      <div className="mb-6 mt-2 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">События</h2>
          <p className="text-slate-500 text-sm">Дни рождения и праздники</p>
        </div>
        <button onClick={onCreateEvent} className="bg-rose-500 text-white p-3 rounded-xl shadow-lg shadow-rose-200 active:scale-95 transition-transform">
          <Plus size={24} />
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
        </div>
      ) : events.length === 0 ? (
        <EmptyState icon={Calendar} title="Нет событий" description="Создайте первое событие, чтобы начать сбор или подготовку." />
      ) : (
        <>
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} onClick={() => onOpenEvent(event)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">Нет предстоящих событий</p>
            </div>
          )}

          {/* Past Events Section */}
          {pastEvents.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowPastEvents(!showPastEvents)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <span className="text-sm font-bold text-slate-600">
                  Прошедшие события ({pastEvents.length})
                </span>
                <ChevronRight size={20} className={`text-slate-400 transition-transform ${showPastEvents ? 'rotate-90' : ''}`} />
              </button>

              {showPastEvents && (
                <div className="mt-3 space-y-3 opacity-60">
                  {pastEvents.map(event => (
                    <EventCard key={event.id} event={event} onClick={() => onOpenEvent(event)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const CreateEventScreen = ({ group, user, onBack, onCreated }: { group: Group, user: User, onBack: () => void, onCreated: () => void }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    storage.getUsersByIds(group.members).then(setMembers);
  }, [group]);

  const handleCreate = async () => {
    if (!title || !date || !amount) return;

    // Validate that date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert('❌ Нельзя создать событие с прошедшей датой');
      return;
    }

    setIsSubmitting(true);
    await storage.createEvent({
      groupId: group.id,
      title,
      date,
      targetAmount: parseFloat(amount),
      currency: 'RUB',
      creatorId: user.id,
      beneficiaryId: beneficiaryId || null
    });
    setIsSubmitting(false);
    onCreated();
  };

  useTelegramMainButton("Создать событие", handleCreate, !!(title && date && amount), isSubmitting);

  return (
    <div className="p-4 min-h-screen bg-white flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-400 hover:bg-slate-100">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Новое событие</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Название</label>
          <input
            type="text"
            placeholder="ДР Маши"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-medium text-lg"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Для кого праздник?</label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setBeneficiaryId('')}
              className={`shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${!beneficiaryId ? 'bg-rose-50 border-2 border-rose-500' : 'bg-white border-2 border-slate-200'}`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xl">
                🎉
              </div>
              <span className="text-xs font-medium truncate w-16 text-center">Общий</span>
            </button>
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => setBeneficiaryId(m.id)}
                className={`shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${beneficiaryId === m.id ? 'bg-rose-50 border-2 border-rose-500' : 'bg-white border-2 border-slate-200'}`}
              >
                <UserAvatar user={m} />
                <span className="text-xs font-medium truncate w-16 text-center">{m.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Дата</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Бюджет (₽)</label>
            <input
              type="number"
              placeholder="5000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Explicit Button */}
      <div className="mt-8">
        <button
          onClick={handleCreate}
          disabled={!title || !date || !amount || isSubmitting}
          className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all"
        >
          {isSubmitting ? "Создание..." : "Создать событие"}
        </button>
      </div>
    </div>
  );
};

const EventDetailsScreen = ({ event, user, group, onBack, onOpenAngelGuardian, onEventUpdate }: { event: Event, user: User, group: Group, onBack: () => void, onOpenAngelGuardian: (event: Event, room: SantaRoom) => void, onEventUpdate?: (event: Event) => void }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'wishlist' | 'contributors'>('overview');
  const [beneficiary, setBeneficiary] = useState<User | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [showContribute, setShowContribute] = useState(false);
  const [contribAmount, setContribAmount] = useState('');
  const [contribComment, setContribComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [localEvent, setLocalEvent] = useState<Event>(event);

  // Payment info state
  const [paymentBank, setPaymentBank] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [isEditingPayment, setIsEditingPayment] = useState(false);

  // Delete event state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Organizer state
  const [organizer, setOrganizer] = useState<User | null>(null);

  useEffect(() => {
    if (localEvent.paymentInfoSetBy) {
      storage.getUserById(localEvent.paymentInfoSetBy).then(u => setOrganizer(u || null));
    } else {
      setOrganizer(null);
    }
  }, [localEvent.paymentInfoSetBy]);

  // Manual Item State
  const [showAddManualItem, setShowAddManualItem] = useState(false);
  const [manualItemTitle, setManualItemTitle] = useState('');
  const [manualItemUrl, setManualItemUrl] = useState('');
  const [manualItemImage, setManualItemImage] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');

  // Target Amount State
  const [showEditTargetAmount, setShowEditTargetAmount] = useState(false);
  const [newTargetAmount, setNewTargetAmount] = useState('');

  // Angel Guardian State
  const [angelRoom, setAngelRoom] = useState<SantaRoom | null>(null);
  const [showCreateAngel, setShowCreateAngel] = useState(false);
  const [showAngelView, setShowAngelView] = useState(false);
  const [angelTitle, setAngelTitle] = useState('');
  const [angelBudget, setAngelBudget] = useState('');
  const [angelDeadline, setAngelDeadline] = useState('');
  const [angelTarget, setAngelTarget] = useState<any>(null);
  const [angelRevealed, setAngelRevealed] = useState(false);



  const myParticipation = localEvent.participants?.find(p => p.userId === user.id);
  const isParticipating = myParticipation?.status === 'JOINED';
  const joinedParticipants = localEvent.participants?.filter(p => p.status === 'JOINED') || [];
  const collected = joinedParticipants.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  const progress = localEvent.targetAmount > 0 ? Math.min(100, Math.round((collected / localEvent.targetAmount) * 100)) : 0;
  // isHost = user who set payment info (first-come-first-served) or no one set it yet
  // If paymentInfoSetBy is null but paymentInfo exists, treat as 'anyone can be host' (legacy data)
  const isHost = !localEvent.paymentInfo || !localEvent.paymentInfoSetBy || localEvent.paymentInfoSetBy === user.id;
  const isGroupCreator = group.creatorId === user.id;

  // Debug logging
  console.log('[EVENT_DETAILS] isHost:', isHost, 'paymentInfo:', localEvent.paymentInfo, 'paymentInfoSetBy:', localEvent.paymentInfoSetBy, 'user.id:', user.id);

  useEffect(() => {
    if (event.beneficiaryId) {
      storage.getUserById(event.beneficiaryId).then(setBeneficiary);
    }
  }, [event]);

  useEffect(() => {
    setLocalEvent(event);
  }, [event]);

  useEffect(() => {
    if (activeTab === 'wishlist' && event.beneficiaryId) {
      setLoading(true);
      storage.getEventWishlist(event.id).then(items => {
        setWishlist(items);
        setLoading(false);
      });
    }
  }, [activeTab, event]);

  // Load payment info
  useEffect(() => {
    if (localEvent.paymentInfo) {
      try {
        const info = JSON.parse(localEvent.paymentInfo);
        setPaymentBank(info.bank || '');
        setPaymentPhone(info.phone || '');
      } catch (e) {
        // Fallback for non-JSON paymentInfo
        setPaymentBank(localEvent.paymentInfo);
      }
    }
  }, [localEvent.paymentInfo]);


  // Load Angel Room
  useEffect(() => {
    if (!event.beneficiaryId) {
      storage.getEventAngelRoom(event.id).then(room => setAngelRoom(room));
    }
  }, [event.id, event.beneficiaryId]);


  const handleCreateAngelRoom = async () => {
    if (!angelTitle.trim()) {
      alert('Введите название игры');
      return;
    }

    try {
      const room = await storage.createEventAngelRoom(event.id, user.id, angelTitle, angelBudget, angelDeadline);
      setAngelRoom(room);
      setShowCreateAngel(false);
      setAngelTitle('');
      setAngelBudget('');
      setAngelDeadline('');
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
    } catch (e) {
      console.error('[ANGEL] Create failed:', e);
      alert('Ошибка создания игры');
    }
  };

  const handleContribute = async () => {
    if (!contribAmount) return;
    try {
      const updated = await storage.addContribution(event.id, user.id, parseFloat(contribAmount));
      setLocalEvent(updated);
      setShowContribute(false);
      setContribAmount('');
      setContribComment('');

      // Show notification that contribution is pending
      alert('✓ Ваш взнос отправлен на проверку организатору');
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
    } catch (e) {
      alert('Ошибка отправки взноса');
    }
  };

  const handleSavePaymentInfo = async () => {
    const paymentInfo = JSON.stringify({ bank: paymentBank, phone: paymentPhone });
    const updated = await storage.updatePaymentInfo(event.id, paymentInfo, user.id);
    setLocalEvent(updated);
    setIsEditingPayment(false);
  };

  const handleConfirmContribution = async (contributionId: string) => {
    const updated = await storage.confirmContribution(event.id, contributionId);
    setLocalEvent(updated);
  };

  const handleRejectContribution = async (contributionId: string) => {
    const updated = await storage.rejectContribution(event.id, contributionId);
    setLocalEvent(updated);
  };

  const handleToggleParticipation = async () => {
    try {
      const updated = await storage.toggleEventParticipation(event.id, user.id);
      setLocalEvent(updated);
    } catch (e) {
      alert('Ошибка изменения участия');
    }
  };

  const handleBookItem = async (itemId: string) => {
    try {
      await storage.bookWishlistItem(event.id, itemId, user.id);
      // Reload wishlist
      const updated = await storage.getEventWishlist(event.id);
      setWishlist(updated);
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
    } catch (e) {
      console.error('[BOOK_ITEM] Error:', e);
      alert(`Ошибка бронирования: ${e instanceof Error ? e.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleFundItem = async (itemId: string) => {
    try {
      const updatedEvent = await storage.fundWishlistItem(event.id, itemId, user.id);
      setLocalEvent(updatedEvent);

      const updatedWishlist = await storage.getEventWishlist(event.id);
      setWishlist(updatedWishlist);
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
    } catch (e) {
      console.error('[FUND_ITEM] Error:', e);
      alert(`Ошибка создания сбора: ${e instanceof Error ? e.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleAddManualItem = async () => {
    if (!manualItemTitle.trim()) {
      alert('Введите название подарка');
      return;
    }

    try {
      const price = manualItemPrice ? parseFloat(manualItemPrice) : undefined;
      const updatedEvent = await storage.addManualFundItem(
        event.id,
        user.id,
        manualItemTitle,
        manualItemUrl,
        manualItemImage,
        price
      );
      setLocalEvent(updatedEvent);
      setShowAddManualItem(false);
      setManualItemTitle('');
      setManualItemUrl('');
      setManualItemImage('');
      setManualItemPrice('');
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
    } catch (e) {
      console.error('[ADD_MANUAL_ITEM] Error:', e);
      alert('Ошибка добавления подарка');
    }
  };

  const handleUpdateTargetAmount = async () => {
    if (!newTargetAmount || isNaN(parseFloat(newTargetAmount))) {
      alert('Введите корректную сумму');
      return;
    }

    try {
      const updatedEvent = await storage.updateTargetAmount(event.id, parseFloat(newTargetAmount), user.id);
      setLocalEvent(updatedEvent);
      if (onEventUpdate) {
        onEventUpdate(updatedEvent); // Sync with parent component
      }
      setShowEditTargetAmount(false);
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
    } catch (e) {
      console.error('Failed to update target amount:', e);
      alert('Не удалось обновить сумму');
    }
  };

  const handleUnbookItem = async (itemId: string) => {
    try {
      const result = await storage.unbookWishlistItem(event.id, itemId, user.id);
      if (result.event) {
        setLocalEvent(result.event);
      }
      const updated = await storage.getEventWishlist(event.id);
      setWishlist(updated);
    } catch (e) {
      alert('Ошибка отмены брони');
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await storage.deleteEvent(event.id, user.id);
      setShowDeleteConfirm(false);
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
      onBack(); // Navigate back to events list
    } catch (e) {
      alert('Ошибка при удалении события');
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur p-4 flex items-center gap-3 border-b border-slate-100 z-20">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100"><ArrowLeft size={20} /></button>
        <span className="font-bold text-slate-800 truncate flex-1">{event.title}</span>
        {isGroupCreator && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
            title="Удалить событие"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="sticky top-[57px] bg-white border-b border-slate-100 z-10 flex">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'overview' ? 'text-rose-600 border-b-2 border-rose-500' : 'text-slate-400'}`}
        >
          Обзор
        </button>
        {isParticipating && event.beneficiaryId && (
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'wishlist' ? 'text-rose-600 border-b-2 border-rose-500' : 'text-slate-400'}`}
          >
            Вишлист
          </button>
        )}
        {isParticipating && (
          <button
            onClick={() => setActiveTab('contributors')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'contributors' ? 'text-rose-600 border-b-2 border-rose-500' : 'text-slate-400'}`}
          >
            Участники
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <UserAvatar user={beneficiary || undefined} size="w-12 h-12" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Для кого</p>
                    <p className="font-bold text-slate-900">{beneficiary?.name || '...'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase">Дата</p>
                  <p className="font-bold text-slate-900">{new Date(event.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-500">Собрано {Math.round(progress)}%</span>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-600">{collected} / {event.targetAmount} ₽</span>
                    {isHost && (
                      <button
                        onClick={() => {
                          setNewTargetAmount(event.targetAmount.toString());
                          setShowEditTargetAmount(true);
                        }}
                        className="p-1 bg-red-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        <Edit3 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Payment Requisites Section */}
              {isParticipating && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-700">Платежные реквизиты</h4>
                    {isHost && (
                      <button
                        onClick={() => setIsEditingPayment(true)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                      >
                        <Edit3 size={14} />
                        {paymentBank || paymentPhone ? 'Изменить' : 'Добавить'}
                      </button>
                    )}
                  </div>

                  {/* Organizer Info */}
                  {localEvent.paymentInfoSetBy && (
                    <div className="mb-3 p-3 bg-red-50 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-xs text-rose-600 font-bold mb-0.5">Организатор сбора:</p>
                        <button
                          onClick={() => {
                            if (organizer?.telegramId) {
                              window.Telegram?.WebApp?.openTelegramLink(`https://t.me/user?id=${organizer.telegramId}`);
                            }
                          }}
                          disabled={!organizer?.telegramId}
                          className="text-sm font-bold text-red-700 hover:text-rose-900 flex items-center gap-1"
                        >
                          {organizer ? organizer.name : `Участник ${localEvent.paymentInfoSetBy.slice(0, 8)}`}
                          {organizer?.telegramId && <ChevronRight size={14} />}
                        </button>
                      </div>
                      {organizer?.avatarUrl && (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-red-200">
                          <img src={organizer.avatarUrl} alt={organizer.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  )}

                  {paymentBank || paymentPhone ? (
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                      {paymentBank && (
                        <div className="flex items-center gap-2">
                          <Wallet size={16} className="text-slate-400" />
                          <span className="text-sm text-slate-700">{paymentBank}</span>
                        </div>
                      )}
                      {paymentPhone && (
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(paymentPhone);
                              alert('✓ Номер скопирован в буфер обмена');
                              window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
                            } catch (e) {
                              alert('Не удалось скопировать номер');
                            }
                          }}
                          className="flex items-center gap-2 w-full text-left hover:bg-slate-100 active:bg-slate-200 p-2 -m-2 rounded-lg transition-colors group"
                        >
                          <DollarSign size={16} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
                          <span className="text-sm text-slate-700 font-mono group-hover:text-rose-600 transition-colors">{paymentPhone}</span>
                          <Copy size={14} className="text-slate-300 group-hover:text-rose-500 ml-auto transition-colors" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Реквизиты еще не указаны</p>
                  )}
                </div>
              )}

              {/* Funded Item Display */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-700">Собираем на подарок</h4>
                  {isHost && (
                    <button
                      onClick={() => setShowAddManualItem(true)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Добавить
                    </button>
                  )}
                </div>

                {localEvent.wishlistBookings && localEvent.wishlistBookings.length > 0 ? (
                  localEvent.wishlistBookings.map(item => (
                    <div key={item.id} className="bg-gradient-to-br from-red-50 to-slate-50 p-4 rounded-2xl border-2 border-red-200 mb-3 last:mb-0">
                      <div className="flex gap-3">
                        {item.imageUrl && (
                          <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shrink-0">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">{item.title}</h5>
                          {item.price && (
                            <p className="text-lg font-bold text-rose-600 mb-1">{item.price.toLocaleString('ru-RU')} ₽</p>
                          )}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 mt-2"
                            >
                              <ExternalLink size={12} /> Посмотреть
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Подарок еще не выбран</p>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleToggleParticipation}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all active:scale-95 ${isParticipating
                    ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-600'
                    : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  {isParticipating ? '✓ Участвую' : 'Участвовать'}
                </button>
                {isParticipating && (
                  <button
                    onClick={() => setShowContribute(true)}
                    className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-transform"
                  >
                    Внести деньги
                  </button>
                )}
              </div>

              {/* Angel Guardian Button - Only for general events (no beneficiary) */}
              {!event.beneficiaryId && isParticipating && (
                <div className="mt-3">
                  {angelRoom ? (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-2xl border-2 border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-red-900 flex items-center gap-2">
                          <span>👼</span>
                          {angelRoom.title}
                        </h4>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${angelRoom.status === 'DRAWN' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {angelRoom.status === 'DRAWN' ? 'Жеребьевка проведена' : 'Ожидание участников'}
                        </span>
                      </div>
                      <p className="text-xs text-rose-600 mb-3">
                        Участников: {angelRoom.participants?.length || 0}
                        {angelRoom.budget && ` • Бюджет: ${angelRoom.budget}`}
                        {angelRoom.deadline && ` • До: ${angelRoom.deadline}`}
                      </p>
                      <button
                        onClick={() => onOpenAngelGuardian(event, angelRoom)}
                        className="w-full py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm"
                      >
                        Открыть игру
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCreateAngel(true)}
                      className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                      <span>👼</span>
                      Запустить Ангела-хранителя
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Загрузка...</div>
            ) : wishlist.length === 0 ? (
              <EmptyState icon={Gift} title="Вишлист пуст" description="Именинник еще не добавил желания" />
            ) : (
              wishlist.map(item => {
                const isBookedForThisEvent = item.bookedForEventId === event.id;
                const isBookedByMe = item.bookedBy === user.id;
                const isBookedByOther = item.isBooked && !isBookedByMe;

                return (
                  <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex gap-4">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.title} className="w-20 h-20 rounded-xl object-cover" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                        {item.description && (
                          <p className="text-xs text-slate-500 mb-2 line-clamp-2">{item.description}</p>
                        )}
                        {item.price && (
                          <p className="text-sm font-bold text-rose-600 mb-2">{item.price} ₽</p>
                        )}

                        {/* Status & Actions */}
                        {isBookedForThisEvent ? (
                          <div className="space-y-2">
                            {item.bookingMode === 'INDIVIDUAL' ? (
                              <>
                                <span className="inline-block text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                  ✓ Забронировано
                                </span>
                                {isBookedByMe && (
                                  <button
                                    onClick={() => handleUnbookItem(item.id)}
                                    className="block text-xs font-bold text-rose-600 hover:underline"
                                  >
                                    Отменить бронь
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="inline-block text-xs font-bold text-rose-600 bg-red-50 px-2 py-1 rounded-lg">
                                  💰 Идет сбор
                                </span>
                                <button
                                  onClick={() => handleUnbookItem(item.id)}
                                  className="block text-xs font-bold text-rose-600 hover:underline"
                                >
                                  Отменить сбор
                                </button>
                              </>
                            )}
                          </div>
                        ) : item.isBooked ? (
                          <span className="inline-block text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                            Забронировано
                          </span>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleBookItem(item.id)}
                              className="text-xs font-bold text-rose-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-rose-100"
                            >
                              Дарю сам
                            </button>
                            <button
                              onClick={() => handleFundItem(item.id)}
                              className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100"
                            >
                              Дарим компанией
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Contributors Tab - Participants List */}
        {activeTab === 'contributors' && (
          <div className="space-y-3">
            {joinedParticipants.length === 0 ? (
              <EmptyState icon={Users} title="Нет участников" description="Пока никто не присоединился" />
            ) : (
              joinedParticipants.map(participant => {
                // Find contributions for this participant
                const confirmedContributions = localEvent.contributions?.filter(
                  c => c.userId === participant.userId && c.status === 'CONFIRMED'
                ) || [];
                const pendingContributions = localEvent.contributions?.filter(
                  c => c.userId === participant.userId && c.status === 'PENDING'
                ) || [];

                const totalPaid = confirmedContributions.reduce((sum, c) => sum + c.amount, 0);
                const hasPaid = totalPaid > 0;
                const hasPending = pendingContributions.length > 0;

                // Determine color: green if paid, yellow if pending, red if neither
                let bgColor = 'bg-rose-50 border-rose-200';
                let textColor = 'text-rose-900';
                let statusText = 'Ожидает оплаты';
                let statusTextColor = 'text-rose-600';
                let iconBg = 'bg-rose-400';
                let icon = <Clock size={18} />;

                if (hasPaid) {
                  bgColor = 'bg-emerald-50 border-emerald-200';
                  textColor = 'text-emerald-900';
                  statusText = `Внесено: ${totalPaid} ₽`;
                  statusTextColor = 'text-emerald-600';
                  iconBg = 'bg-emerald-600';
                  icon = <Check size={18} />;
                } else if (hasPending) {
                  bgColor = 'bg-amber-50 border-amber-200';
                  textColor = 'text-amber-900';
                  statusText = 'Ожидает подтверждения';
                  statusTextColor = 'text-amber-600';
                  iconBg = 'bg-amber-500';
                  icon = <Clock size={18} />;
                }

                return (
                  <div
                    key={participant.userId}
                    className={`p-4 rounded-2xl border-2 transition-all ${bgColor}`}
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={{ id: participant.userId, name: 'User' } as User} size="w-12 h-12" />
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${textColor}`}>
                          Участник {participant.userId.slice(0, 8)}
                        </p>
                        <p className={`text-xs font-medium mt-0.5 ${statusTextColor}`}>
                          {statusText}
                        </p>
                      </div>
                      <div className={`w-8 h-8 ${iconBg} rounded-full flex items-center justify-center text-white`}>
                        {icon}
                      </div>
                    </div>

                    {/* Organizer controls - only for host when this participant has pending contributions */}
                    {isHost && pendingContributions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-amber-200">
                        {pendingContributions.map(contribution => (
                          <div key={contribution.id} className="flex items-center justify-between mb-2 last:mb-0">
                            <span className="text-sm font-bold text-amber-900">
                              {contribution.amount} ₽
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleConfirmContribution(contribution.id)}
                                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 active:scale-95 transition-all"
                              >
                                ✓ Подтвердить
                              </button>
                              <button
                                onClick={() => handleRejectContribution(contribution.id)}
                                className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 active:scale-95 transition-all"
                              >
                                ✗ Отклонить
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Contribute Modal */}
      {showContribute && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in zoom-in-95">
            <h3 className="font-bold text-xl mb-4">Внести средства</h3>
            <input
              type="number"
              value={contribAmount}
              onChange={e => setContribAmount(e.target.value)}
              placeholder="Сумма"
              className="w-full p-4 bg-slate-50 rounded-2xl mb-4 outline-none font-bold text-lg"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowContribute(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100">Отмена</button>
              <button onClick={handleContribute} className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-500">Внести</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Info Edit Modal */}
      {isEditingPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">Платежные реквизиты</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Банк</label>
                <input
                  type="text"
                  value={paymentBank}
                  onChange={e => setPaymentBank(e.target.value)}
                  placeholder="Например: Сбербанк, Тинькофф"
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Номер телефона/карты</label>
                <input
                  type="text"
                  value={paymentPhone}
                  onChange={e => setPaymentPhone(e.target.value)}
                  placeholder="+7 900 123-45-67"
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-mono"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsEditingPayment(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100">Отмена</button>
              <button onClick={handleSavePaymentInfo} className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-500">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in zoom-in-95 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDeleteConfirm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Удалить событие?</h3>
              <p className="text-slate-500 text-sm mb-3">Событие "{event.title}" будет удалено навсегда вместе со всеми взносами и данными.</p>
              <p className="text-rose-600 text-xs font-bold">⚠️ Это действие нельзя отменить!</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteEvent}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Target Amount Modal */}
      {showEditTargetAmount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowEditTargetAmount(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in zoom-in-95 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowEditTargetAmount(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign size={32} className="text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Изменить сумму сбора</h3>
              <p className="text-slate-500 text-sm">Укажите целевую сумму для группового сбора</p>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Целевая сумма (₽)</label>
              <input
                type="number"
                value={newTargetAmount}
                onChange={e => setNewTargetAmount(e.target.value)}
                placeholder="5000"
                className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-lg font-bold text-center"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEditTargetAmount(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">Отмена</button>
              <button onClick={handleUpdateTargetAmount} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Item Modal */}
      {showAddManualItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowAddManualItem(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-6 animate-in zoom-in-95 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAddManualItem(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift size={32} className="text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Добавить подарок</h3>
              <p className="text-slate-500 text-sm">Укажите подарок для группового сбора</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Название подарка</label>
                <input
                  type="text"
                  value={manualItemTitle}
                  onChange={e => setManualItemTitle(e.target.value)}
                  placeholder="Например: Наушники Sony"
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Ссылка (необязательно)</label>
                <input
                  type="url"
                  value={manualItemUrl}
                  onChange={e => setManualItemUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Изображение URL (необязательно)</label>
                <input
                  type="url"
                  value={manualItemImage}
                  onChange={e => setManualItemImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Цена (₽, необязательно)</label>
                <input
                  type="number"
                  value={manualItemPrice}
                  onChange={e => setManualItemPrice(e.target.value)}
                  placeholder="5000"
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddManualItem(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">Отмена</button>
              <button onClick={handleAddManualItem} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold">Добавить</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Angel Room Modal */}
      {showCreateAngel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowCreateAngel(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-6 animate-in zoom-in-95 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowCreateAngel(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👼</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Ангел-хранитель</h3>
              <p className="text-slate-500 text-sm">Создайте игру для обмена подарками</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Название игры</label>
                <input
                  type="text"
                  value={angelTitle}
                  onChange={e => setAngelTitle(e.target.value)}
                  placeholder="Например: Новогодний обмен"
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Бюджет (необязательно)</label>
                <input
                  type="text"
                  value={angelBudget}
                  onChange={e => setAngelBudget(e.target.value)}
                  placeholder="Например: до 3000 ₽"
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Дедлайн (необязательно)</label>
                <input
                  type="text"
                  value={angelDeadline}
                  onChange={e => setAngelDeadline(e.target.value)}
                  placeholder="Например: 31 декабря"
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateAngel(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">Отмена</button>
              <button onClick={handleCreateAngelRoom} className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold">Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- WISHLIST SCREEN ---

const WishlistScreen = ({ user, showAddModal, onCloseAddModal, onItemAdded }: {
  user: User,
  showAddModal: boolean,
  onCloseAddModal: () => void,
  onItemAdded: () => void
}) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [newItemPrice, setNewItemPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const list = await storage.getWishlist(user.id);
    setItems(list);
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Auto-fetch preview when URL changes
  useEffect(() => {
    const fetchPreview = async () => {
      if (!newItemUrl || !newItemUrl.startsWith('http')) {
        setNewItemImage(null);
        return;
      }

      setIsFetchingPreview(true);
      try {
        const preview = await storage.parseUrl(newItemUrl);
        setNewItemTitle(preview.title || '');
        setNewItemDesc(preview.description || '');
        setNewItemImage(preview.imageUrl || null);
        setNewItemPrice(preview.price || null);
        console.log('[WISHLIST] Preview loaded:', preview);
      } catch (error) {
        console.error('[WISHLIST] Failed to fetch preview:', error);
      } finally {
        setIsFetchingPreview(false);
      }
    };

    const timeoutId = setTimeout(fetchPreview, 1000); // Debounce 1s
    return () => clearTimeout(timeoutId);
  }, [newItemUrl]);

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;
    setIsSubmitting(true);
    try {
      console.log('[WISHLIST] Adding item:', { title: newItemTitle, url: newItemUrl });
      const newItem = await storage.addWishlistItem(user.id, {
        title: newItemTitle,
        url: newItemUrl || undefined,
        imageUrl: newItemImage || undefined,
        description: newItemDesc || undefined,
        price: newItemPrice || undefined,
        priority: 'medium'
      });
      console.log('[WISHLIST] Item added successfully:', newItem);
      setNewItemTitle('');
      setNewItemUrl('');
      setNewItemDesc('');
      setNewItemImage(null);
      setNewItemPrice(null);
      setIsSubmitting(false);
      onCloseAddModal();
      await loadItems();
      onItemAdded();
    } catch (error) {
      console.error('[WISHLIST] Failed to add item:', error);
      alert('Не удалось добавить желание. Попробуйте еще раз.');
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Удалить это желание?')) {
      await storage.deleteWishlistItem(itemId, user.id);
      loadItems();
    }
  };

  return (
    <div className="p-4 pb-32">
      <div className="mb-6 mt-2">
        <h2 className="text-2xl font-bold text-slate-900">Мой вишлист</h2>
        <p className="text-slate-500 text-sm">Что подарить вам на праздник?</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Gift} title="Список пуст" description="Добавь - не стесняйся, твоим друзьям будет проще" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col group relative overflow-hidden">
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="absolute top-2 right-2 text-white bg-black/50 hover:bg-rose-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <Trash2 size={14} />
              </button>

              {/* Image Preview */}
              {item.imageUrl ? (
                <div className="w-full h-32 bg-slate-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><div class="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg></div></div>';
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-indigo-50 to-slate-50 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <Gift size={24} />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 mb-1">{item.title}</h4>
                {item.description && <p className="text-[10px] text-slate-400 line-clamp-2 mb-2">{item.description}</p>}

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-medium text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md self-start flex items-center gap-1 hover:bg-indigo-100 transition-colors truncate max-w-full mt-auto"
                  >
                    <ExternalLink size={10} />
                    {(() => {
                      try {
                        return new URL(item.url).hostname.replace('www.', '');
                      } catch {
                        return item.url.length > 20 ? item.url.substring(0, 20) + '...' : item.url;
                      }
                    })()}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal - Ensure Z-Index is very high */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Новое желание</h3>
              <button onClick={onCloseAddModal} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Ссылка (необязательно)</label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://market..."
                    value={newItemUrl}
                    onChange={e => setNewItemUrl(e.target.value)}
                    className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 border border-slate-100 pr-10"
                    autoFocus
                  />
                  {isFetchingPreview && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {newItemImage && (
                  <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={newItemImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setNewItemImage(null)}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-rose-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {!newItemImage && (
                  <div className="mt-2">
                    <label className="flex items-center justify-center gap-2 p-3 bg-slate-100 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors border border-dashed border-slate-300">
                      <Upload size={18} className="text-slate-500" />
                      <span className="text-sm font-medium text-slate-600">Загрузить фото</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewItemImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Название</label>
                <input
                  type="text"
                  placeholder="Например: Наушники Sony"
                  value={newItemTitle}
                  onChange={e => setNewItemTitle(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 border border-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Комментарий (опционально)</label>
                <textarea
                  placeholder="Размер M, цвет черный..."
                  value={newItemDesc}
                  onChange={e => setNewItemDesc(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none h-20 border border-slate-100"
                />
              </div>

              {/* Explicit Save Button */}
              <button
                onClick={handleAddItem}
                disabled={!newItemTitle.trim() || isSubmitting}
                className="w-full py-4 mt-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform disabled:opacity-50 disabled:shadow-none text-lg"
              >
                {isSubmitting ? "Сохранение..." : "Добавить желание"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- FRIEND PROFILE SCREEN ---

const FriendProfileScreen = ({ friend, currentUser, onBack }: { friend: User, currentUser: User, onBack: () => void }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    const items = await storage.getWishlist(friend.id);
    setWishlist(items);
    setLoading(false);
  }, [friend.id]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleBook = async (itemId: WishlistItemId) => {
    try {
      await storage.toggleWishlistBooking(friend.id, itemId, currentUser.id);
      loadWishlist();
    } catch (e) {
      alert("Не удалось забронировать");
    }
  };

  const handleUnbook = async (itemId: WishlistItemId) => {
    try {
      await storage.toggleWishlistBooking(friend.id, itemId, currentUser.id);
      loadWishlist();
    } catch (e) {
      alert("Не удалось снять бронь");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md p-4 flex items-center gap-3 border-b border-slate-200/50">
        <button onClick={onBack} className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-600">
          <ArrowLeft size={18} />
        </button>
        <span className="font-bold text-slate-700">Профиль</span>
      </div>

      {/* Profile Info */}
      <div className="p-4 pt-6 flex flex-col items-center bg-white">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-200 p-1">
            <div className="w-full h-full bg-indigo-600 rounded-full overflow-hidden flex items-center justify-center">
              {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full rounded-full object-cover" /> : friend.name[0]}
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{friend.name}</h2>
        <p className="text-slate-500 font-medium">@{friend.username || 'user'}</p>

        {friend.birthday && (
          <div className="mt-4 bg-indigo-50 px-4 py-2 rounded-full text-sm text-indigo-700 font-medium flex items-center gap-2">
            <Calendar size={14} />
            {new Date(friend.birthday).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
          </div>
        )}
      </div>

      {/* Wishlist Section */}
      <div className="flex-1 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="text-indigo-600" size={20} />
          <h3 className="font-bold text-lg text-slate-900">Вишлист</h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-200 rounded-2xl"></div>)}
          </div>
        ) : wishlist.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="Список желаний пуст"
            description="Пока нет добавленных подарков"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {wishlist.map(item => (
              <WishlistItemCard
                key={item.id}
                item={item}
                isOwner={false}
                currentUserId={currentUser.id}
                onBook={handleBook}
                onUnbook={handleUnbook}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// --- SECRET SANTA COMPONENTS ---

const CreateSantaView = ({ group, user, onCreate }: { group: Group, user: User, onCreate: (budget: string, date: string) => void }) => {
  const [budget, setBudget] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    if (!budget || !date) return;
    setLoading(true);
    onCreate(budget, date);
  };

  useTelegramMainButton("Создать игру", handleCreate, !!(budget && date), loading);

  return (
    <div className="p-4 pb-32">
      <div className="text-center mb-10 mt-8">
        <div className="w-24 h-24 bg-gradient-to-tr from-rose-400 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-rose-200">
          <PartyPopper size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Тайный Санта</h2>
        <p className="text-slate-500 mt-2 text-sm px-6">Устройте анонимный обмен подарками. Мы сами проведем жеребьёвку!</p>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Бюджет подарка</label>
          <div className="relative">
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Например: до 2000р"
              className="w-full h-14 bg-slate-50 rounded-2xl border-none pl-12 focus:ring-2 focus:ring-rose-500/20"
            />
            <DollarSign size={20} className="absolute left-4 top-4 text-slate-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Дата вручения</label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-14 bg-slate-50 rounded-2xl border-none pl-12 pr-4 focus:ring-2 focus:ring-rose-500/20 text-slate-700"
            />
            <Calendar size={20} className="absolute left-4 top-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Explicit Create Button */}
      <div className="mt-6">
        <button
          onClick={handleCreate}
          disabled={!budget || !date || loading}
          className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? "Создание..." : "Создать игру"}
        </button>
      </div>
    </div>
  );
};

const SantaLobbyView = ({
  room,
  user,
  participants,
  onJoin,
  onStart
}: {
  room: SantaRoom,
  user: User,
  participants: User[],
  onJoin: (text?: string, item?: string) => void,
  onStart: () => void
}) => {
  const isParticipant = room.participants.includes(user.id);
  const isAdmin = room.adminId === user.id;
  const [loading, setLoading] = useState(false);
  const [isEditingWish, setIsEditingWish] = useState(false);

  // Get current participant's wish from room data
  const currentWish = room.participantInfo?.[user.id];

  // Wish form state
  const [wishText, setWishText] = useState(currentWish?.wishText || '');
  const [selectedWishItem, setSelectedWishItem] = useState(currentWish?.wishlistItemId || '');
  const [myWishlist, setMyWishlist] = useState<WishlistItem[]>([]);

  // Load wishlist for non-participants OR admin participants (so admin can edit wish)
  useEffect(() => {
    if (!isParticipant || (isParticipant && isAdmin) || isEditingWish) {
      storage.getWishlist(user.id).then(setMyWishlist);
    }
  }, [user.id, isParticipant, isAdmin, isEditingWish]);

  const handleMainAction = async () => {
    setLoading(true);
    if (!isParticipant) {
      // Join the game (for both admin and regular participants)
      await onJoin(wishText, selectedWishItem);
    } else if (isParticipant && isAdmin && participants.length >= 3) {
      // Admin is already a participant, just start the game
      await onStart();
    }
    setLoading(false);
  };

  const handleSaveWish = async () => {
    setLoading(true);
    try {
      await onJoin(wishText, selectedWishItem); // Re-join with updated wish
      setIsEditingWish(false);
    } catch (e) {
      console.error('Failed to save wish:', e);
    }
    setLoading(false);
  };

  // Button text logic:
  // - Not participant (including admin): "УЧАСТВОВАТЬ"
  // - Participant + Admin + enough people: "НАЧАТЬ ИГРУ"
  // - Participant + Admin + not enough: "Ждем участников"
  // - Participant + not admin: no button (hide)
  const buttonText = !isParticipant
    ? "УЧАСТВОВАТЬ"
    : isAdmin
      ? participants.length >= 3
        ? `НАЧАТЬ ИГРУ (${participants.length})`
        : `Ждем участников (${participants.length}/3)`
      : "";

  // Only use Telegram Main Button if there's text to show
  const shouldShowButton = !!buttonText;
  useTelegramMainButton(
    shouldShowButton ? buttonText : "Hidden",
    handleMainAction,
    shouldShowButton && (!isParticipant || (isAdmin && participants.length >= 3)), // Enable only if can join or can start
    loading
  );

  return (
    <div className="p-4 pb-24">
      <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-6 rounded-3xl mb-8 relative overflow-hidden shadow-lg shadow-rose-200">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">{room.title}</h2>
          <p className="text-rose-100 text-sm mb-4 opacity-90">Ждем всех участников...</p>
          <div className="flex flex-wrap gap-3">
            <span className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <DollarSign size={14} /> {room.budget}
            </span>
            <span className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <Calendar size={14} /> {room.deadline}
            </span>
          </div>
        </div>
        <PartyPopper className="absolute -right-6 -bottom-6 w-40 h-40 text-white/10 rotate-12" />
        {/* Snowfall effect elements */}
        <div className="snowflake absolute top-0 left-10 text-white/20 animate-pulse">❄</div>
        <div className="snowflake absolute top-5 right-10 text-white/20 animate-pulse delay-700">❄</div>
      </div>

      {/* Wishlist for Santa - Enhanced Section */}
      {/* Show for: non-participants OR admin participants (so admin can add/edit wish) */}
      {(!isParticipant || (isParticipant && isAdmin)) && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Gift size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Вишлист для Санты</h3>
              <p className="text-xs text-slate-500">Подскажи, что бы ты хотел получить</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Твое пожелание
              </label>
              <textarea
                placeholder="Например: Книга по программированию, беспроводные наушники..."
                value={wishText}
                onChange={e => setWishText(e.target.value)}
                className="w-full p-3 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 border border-indigo-100 resize-none h-20"
              />
            </div>

            {myWishlist.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Или выбери из своего вишлиста
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {myWishlist.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedWishItem(selectedWishItem === item.id ? '' : item.id)}
                      className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${selectedWishItem === item.id
                        ? 'bg-indigo-600 border-indigo-600 text-white ring-2 ring-indigo-200'
                        : 'bg-white border-indigo-100 text-slate-700 hover:border-indigo-300'
                        }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save wish button for admin participants */}
            {isParticipant && isAdmin && (
              <button
                onClick={handleSaveWish}
                disabled={loading || (!wishText && !selectedWishItem)}
                className="w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Сохранение...' : (
                  <>
                    <Save size={16} />
                    Сохранить желание
                  </>
                )}
              </button>
            )}

            {(wishText || selectedWishItem) && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 p-3 rounded-xl">
                <CheckCircle size={16} />
                <span className="font-medium">Пожелание будет видно твоему Санте после жеребьевки</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Participants who already joined can see/edit their wish (except admin who has edit form above) */}
      {isParticipant && !isAdmin && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift size={18} className="text-indigo-500" />
              <h3 className="font-bold text-slate-800">Твое пожелание</h3>
            </div>
            {!isEditingWish && (
              <button
                onClick={() => setIsEditingWish(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Edit3 size={14} />
                Изменить
              </button>
            )}
          </div>

          {isEditingWish ? (
            <div>
              <textarea
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder="Напишите свое желание..."
                className="w-full p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                rows={3}
              />

              {myWishlist.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-slate-600 mb-2">Или выберите из вишлиста:</p>
                  <select
                    value={selectedWishItem}
                    onChange={(e) => {
                      setSelectedWishItem(e.target.value);
                      if (e.target.value) setWishText('');
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Не выбрано</option>
                    {myWishlist.map(item => (
                      <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSaveWish}
                  disabled={loading || (!wishText && !selectedWishItem)}
                  className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  onClick={() => {
                    setIsEditingWish(false);
                    setWishText(currentWish?.wishText || '');
                    setSelectedWishItem(currentWish?.wishlistItemId || '');
                  }}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div>
              {wishText || selectedWishItem ? (
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <p className="text-sm text-slate-700">{wishText || "Выбран подарок из вишлиста"}</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {isParticipant && !isAdmin && (
        <div className="text-center p-8 bg-slate-50 rounded-3xl border border-slate-100">
          <Clock size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm font-medium">Ожидаем организатора...</p>
          <p className="text-slate-400 text-xs mt-1">Скоро начнется жеребьевка</p>
        </div>
      )}

      {/* Explicit Button for Desktop/Browser fallback */}
      {(!isParticipant || (isAdmin && isParticipant)) && (
        <div className="mt-6">
          <button
            onClick={handleMainAction}
            disabled={loading || (isParticipant && isAdmin && participants.length < 3)}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-transform disabled:opacity-50 ${!isParticipant ? 'bg-emerald-500 shadow-emerald-200' : 'bg-indigo-600 shadow-indigo-200'}`}
          >
            {loading ? "Загрузка..." : buttonText}
          </button>
        </div>
      )}
    </div>
  );
};

const SantaGameView = ({ room, user }: { room: SantaRoom, user: User }) => {
  const [target, setTarget] = useState<(User & { santaWish?: { wishText?: string; item?: WishlistItem } }) | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    storage.getMySantaTarget(room.id, user.id).then(setTarget);
  }, [room, user]);

  if (!target) return <div className="p-4 text-center">Загрузка цели...</div>;

  return (
    <div className="p-3 min-h-[70vh] flex flex-col items-center justify-center">
      {/* Main content */}
      <div className="relative z-20">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Доставь подарок для</h2>

        <div
          className="relative w-72 h-96 cursor-pointer group"
          style={{ perspective: '1000px' }}
          onClick={() => setRevealed(true)}
        >
          <div className="relative w-full h-full transition-all duration-700" style={{ transformStyle: 'preserve-3d', transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
            {/* Front of Card (Hidden) */}
            <div className="absolute w-full h-full bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2rem] shadow-2xl shadow-indigo-200 flex flex-col items-center justify-center text-white p-8 border-4 border-white/10" style={{ backfaceVisibility: 'hidden' }}>
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <Gift size={40} />
              </div>
              <p className="font-bold text-xl mb-2">Узнать цель</p>
              <p className="text-indigo-200 text-sm text-center leading-relaxed">Нажми на карточку, чтобы увидеть, кому ты даришь подарок</p>
            </div>

            {/* Back of Card (Revealed) */}
            <div className="absolute w-full h-full bg-white rounded-[2rem] shadow-2xl shadow-slate-200 flex flex-col items-center justify-between p-6 border border-slate-100" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <div className="flex flex-col items-center pt-4">
                <UserAvatar user={target} size="w-24 h-24" textSize="text-4xl" />
                <h3 className="text-2xl font-bold text-slate-900 mb-1 mt-4">{target.name}</h3>
                <p className="text-slate-500 text-sm bg-slate-50 px-3 py-1 rounded-full">@{target.username || 'username'}</p>
              </div>

              {/* Wish Info */}
              <div className="w-full bg-indigo-50/50 rounded-xl p-4 text-center">
                {target.santaWish?.item ? (
                  <>
                    <p className="text-xs text-indigo-400 uppercase font-bold mb-1">Хочет получить</p>
                    {target.santaWish.item.url ? (
                      <a
                        href={target.santaWish.item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-indigo-600 hover:text-indigo-700 text-sm underline decoration-dotted underline-offset-2 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {target.santaWish.item.title} 🔗
                      </a>
                    ) : (
                      <p className="font-medium text-indigo-900 text-sm">{target.santaWish.item.title}</p>
                    )}
                  </>
                ) : target.santaWish?.wishText ? (
                  <>
                    <p className="text-xs text-indigo-400 uppercase font-bold mb-1">Пожелание</p>
                    <p className="font-medium text-indigo-900 text-sm">"{target.santaWish.wishText}"</p>
                  </>
                ) : (
                  <p className="text-sm text-indigo-400 italic">Пожеланий нет, удиви его!</p>
                )}
              </div>

              {/* Button to open wishlist item URL or view full wishlist */}
              {target.santaWish?.item?.url ? (
                <a
                  href={target.santaWish.item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={18} /> Открыть товар
                </a>
              ) : (
                <button className="w-full py-3.5 bg-slate-200 text-slate-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                  <Gift size={18} /> Ссылка не указана
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`mt-10 transition-opacity duration-500 ${revealed ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-100 px-4 py-2 rounded-full">
            <EyeOff size={16} /> <span>Тсс... Это секрет!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== ANGEL GUARDIAN SCREEN =====
const AngelGuardianScreen = ({
  event,
  room,
  user,
  onBack
}: {
  event: Event,
  room: SantaRoom,
  user: User,
  onBack: () => void
}) => {
  const [angelRoom, setAngelRoom] = useState<SantaRoom>(room);
  const [angelTarget, setAngelTarget] = useState<any>(null);
  const [angelRevealed, setAngelRevealed] = useState(false);
  const [participants, setParticipants] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const isParticipant = angelRoom.participants?.some((p: any) => p.userId === user.id);
  const isAdmin = angelRoom.adminId === user.id;

  useEffect(() => {
    const loadData = async () => {
      const room = await storage.getEventAngelRoom(event.id);
      if (room) {
        setAngelRoom(room);
        const userIds = room.participants?.map((p: any) => p.userId) || [];
        const users = await storage.getUsersByIds(userIds);
        setParticipants(users);
      }
    };
    loadData();
  }, [event.id]);

  const handleJoin = async () => {
    setLoading(true);
    try {
      const updated = await storage.joinEventAngelRoom(event.id, user.id);
      setAngelRoom(updated);
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
      const userIds = updated.participants?.map((p: any) => p.userId) || [];
      const users = await storage.getUsersByIds(userIds);
      setParticipants(users);
    } catch (e) {
      alert('Ошибка присоединения');
    }
    setLoading(false);
  };

  const handleDraw = async () => {
    if (!confirm('Начать жеребьевку? После этого участники узнают своих подопечных.')) return;
    setLoading(true);
    try {
      const updated = await storage.drawEventAngel(event.id, user.id);
      setAngelRoom(updated);
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
      alert('Жеребьевка проведена! Участники могут узнать своих подопечных.');
    } catch (e) {
      alert('Ошибка жеребьевки');
    }
    setLoading(false);
  };

  // Lobby View (WAITING status)
  if (angelRoom.status === 'WAITING') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white pb-24">
        <div className="p-4 sticky top-0 z-40 bg-white/80 backdrop-blur-md flex items-center gap-3 border-b border-purple-100">
          <button onClick={onBack} className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-600">
            <ArrowLeft size={18} />
          </button>
          <span className="font-bold text-slate-700">Ангел-хранитель</span>
        </div>

        <div className="p-4">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-3xl mb-6 relative overflow-hidden shadow-lg shadow-purple-200">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">{angelRoom.title}</h2>
              <p className="text-purple-100 text-sm mb-4 opacity-90">Ждем всех участников...</p>
              <div className="flex flex-wrap gap-3">
                {angelRoom.budget && (
                  <span className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <DollarSign size={14} /> {angelRoom.budget}
                  </span>
                )}
                {angelRoom.deadline && (
                  <span className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <Calendar size={14} /> {angelRoom.deadline}
                  </span>
                )}
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-40 h-40 text-white/10">👼</div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 mb-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-purple-500" />
              Участники ({participants.length})
            </h3>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl">
                  <UserAvatar user={participant} size="w-10 h-10" textSize="text-sm" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{participant.name}</p>
                    <p className="text-xs text-slate-500">@{participant.username || 'username'}</p>
                  </div>
                  {participant.id === angelRoom.adminId && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">Админ</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {!isParticipant ? (
            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? 'Загрузка...' : 'Присоединиться к игре'}
            </button>
          ) : isAdmin && participants.length >= 3 ? (
            <button
              onClick={handleDraw}
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? 'Загрузка...' : `Начать жеребьевку (${participants.length})`}
            </button>
          ) : isAdmin ? (
            <div className="text-center text-sm text-slate-500 bg-slate-50 p-4 rounded-xl">
              Нужно минимум 3 участника для жеребьевки (сейчас: {participants.length})
            </div>
          ) : (
            <div className="text-center text-sm text-slate-500 bg-slate-50 p-4 rounded-xl">
              Вы присоединились! Ждем остальных участников...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Game View (DRAWN status)
  if (angelRoom.status === 'DRAWN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white pb-24">
        <div className="p-4 sticky top-0 z-40 bg-white/80 backdrop-blur-md flex items-center gap-3 border-b border-purple-100">
          <button onClick={onBack} className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-600">
            <ArrowLeft size={18} />
          </button>
          <span className="font-bold text-slate-700">Ангел-хранитель</span>
        </div>

        <div className="p-4 min-h-[70vh] flex flex-col items-center justify-center">
          {!angelTarget ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Доставь подарок для...</h2>
              <button
                onClick={async () => {
                  try {
                    const target = await storage.getEventAngelTarget(event.id, user.id);
                    setAngelTarget(target);
                  } catch (e) {
                    alert('Ошибка получения подопечного');
                  }
                }}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 active:scale-95 transition-transform"
              >
                Узнать своего подопечного
              </button>
            </div>
          ) : (
            <div className="w-full max-w-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Доставь подарок для</h2>
              <div
                className="relative w-full h-96 perspective-1000 cursor-pointer group"
                onClick={() => setAngelRevealed(true)}
              >
                <div className={`relative w-full h-full transition-all duration-700 transform preserve-3d ${angelRevealed ? 'rotate-y-180' : ''}`}>
                  {/* Front */}
                  <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-purple-600 to-pink-600 rounded-[2rem] shadow-2xl shadow-purple-200 flex flex-col items-center justify-center text-white p-8 border-4 border-white/10">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                      <Gift size={40} />
                    </div>
                    <p className="font-bold text-xl mb-2">Узнать цель</p>
                    <p className="text-purple-200 text-sm text-center leading-relaxed">Нажми на карточку, чтобы увидеть, кому ты даришь подарок</p>
                  </div>

                  {/* Back */}
                  <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-white rounded-[2rem] shadow-2xl shadow-slate-200 flex flex-col items-center justify-between p-6 border border-slate-100">
                    <div className="flex flex-col items-center pt-4">
                      <UserAvatar user={angelTarget} size="w-24 h-24" textSize="text-4xl" />
                      <h3 className="text-2xl font-bold text-slate-900 mb-1 mt-4">{angelTarget.name}</h3>
                      <p className="text-slate-500 text-sm bg-slate-50 px-3 py-1 rounded-full">@{angelTarget.username || 'username'}</p>
                    </div>

                    <div className="w-full bg-purple-50/50 rounded-xl p-4 text-center">
                      {angelTarget.angelWish?.wishText ? (
                        <>
                          <p className="text-xs text-purple-400 uppercase font-bold mb-1">Пожелание</p>
                          <p className="font-medium text-purple-900 text-sm">"{angelTarget.angelWish.wishText}"</p>
                        </>
                      ) : (
                        <p className="text-sm text-purple-400 italic">Пожеланий нет, удиви его!</p>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <EyeOff size={12} /> Тсс... Это секрет!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div>Неизвестный статус</div>;
};

const SantaScreenWrapper = ({ children, onBack }: { children?: React.ReactNode, onBack: () => void }) => (
  <div className="min-h-screen bg-slate-50">
    <div className="p-4 sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md flex items-center gap-3 border-b border-slate-200/50">
      <button onClick={onBack} className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-600">
        <ArrowLeft size={18} />
      </button>
      <span className="font-bold text-slate-700">Тайный Санта</span>
    </div>
    {children}
  </div>
);

const SecretSantaScreen = ({
  group,
  user,
  onBack
}: {
  group: Group,
  user: User,
  onBack: () => void
}) => {
  const [activeRoom, setActiveRoom] = useState<SantaRoom | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch room info
  const fetchData = useCallback(async () => {
    setLoading(true);
    const rooms = await storage.getGroupSantaRooms(group.id);
    // Filter out Angel Rooms (those with eventId)
    const santaRooms = rooms.filter(r => !r.eventId);

    if (santaRooms.length > 0) {
      const room = santaRooms[0];
      setActiveRoom(room);
      const users = await storage.getUsersByIds(room.participants);
      setParticipants(users);
    }
    setLoading(false);
  }, [group.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleCreate = async (budget: string, date: string) => {
    await storage.createSantaRoom(group.id, user.id, `Тайный Санта ${new Date().getFullYear()}`, budget, date);
    fetchData();
  };

  const handleJoin = async (wishText?: string, wishItemId?: string) => {
    if (activeRoom) {
      await storage.joinSantaRoom(activeRoom.id, user.id, wishText, wishItemId);
      fetchData();
    }
  };

  const handleStart = async () => {
    if (activeRoom) {
      await storage.drawSanta(activeRoom.id, user.id);
      fetchData();
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Загрузка...</div>;

  if (!activeRoom) {
    return <SantaScreenWrapper onBack={onBack}><CreateSantaView group={group} user={user} onCreate={handleCreate} /></SantaScreenWrapper>;
  }

  if (activeRoom.status === SantaRoomStatus.WAITING) {
    return <SantaScreenWrapper onBack={onBack}><SantaLobbyView room={activeRoom} user={user} participants={participants} onJoin={handleJoin} onStart={handleStart} /></SantaScreenWrapper>;
  }

  if (activeRoom.status === SantaRoomStatus.DRAWN || activeRoom.status === SantaRoomStatus.COMPLETED) {
    return <SantaScreenWrapper onBack={onBack}><SantaGameView room={activeRoom} user={user} /></SantaScreenWrapper>;
  }

  return <div>Error state</div>;
};

// --- ROOM DASHBOARD COMPONENTS ---

const RoomHeader = ({ group, user, onSettings, onExit }: { group: Group, user: User, onSettings: () => void, onExit: () => void }) => {
  const [copied, setCopied] = useState(false);
  const isCreator = group.creatorId === user.id;

  const copyId = () => {
    navigator.clipboard.writeText(group.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sticky top-0 z-40 -mx-4 px-4 py-3 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/50 mb-6 flex justify-between items-center transition-all">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{group.title}</h1>
        <button onClick={copyId} className="text-slate-400 text-xs flex items-center gap-1 hover:text-indigo-600 transition-colors font-medium">
          Код: <span className="font-mono">{group.id}</span>
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onSettings} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-100">
          <Settings size={20} />
        </button>
        <button onClick={onExit} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-full text-slate-600 font-medium hover:bg-slate-50">
          Выйти
        </button>
      </div>
    </div>
  );
};

const EventCard: React.FC<{ event: Event, onClick: () => void }> = ({ event, onClick }) => {
  // Подсчет собранной суммы (эмуляция)
  const collected = event.participants.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  const progress = Math.min(100, Math.round((collected / event.targetAmount) * 100));

  return (
    <div
      onClick={onClick}
      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1">{event.title}</h4>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Calendar size={12} /> {new Date(event.date).toLocaleDateString()}
          </p>
        </div>
        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs shadow-inner">
          {new Date(event.date).getDate()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs font-semibold mb-1.5">
          <span className="text-slate-400">Собрано</span>
          <span className="text-indigo-600">{collected.toLocaleString()} / {event.targetAmount.toLocaleString()} {event.currency}</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Avatars */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {event.participants.slice(0, 3).map((p, i) => (
            <div key={i} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
              {p.userId.slice(0, 1).toUpperCase()}
            </div>
          ))}
          {event.participants.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] text-slate-400 font-medium">
              +{event.participants.length - 3}
            </div>
          )}
        </div>
        <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
          Открыть
        </button>
      </div>
    </div>
  );
};

const RoomDashboard = ({ group, user, onOpenSanta, onViewUser, onOpenEvent, onShowAllEvents }: { group: Group, user: User, onOpenSanta: () => void, onViewUser: (id: string) => void, onOpenEvent: (event: Event) => void, onShowAllEvents: () => void }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [santaRooms, setSantaRooms] = useState<SantaRoom[]>([]);

  useEffect(() => {
    storage.getGroupEvents(group.id, user.id).then(setEvents);
    storage.getGroupSantaRooms(group.id).then(rooms => {
      setSantaRooms(rooms.filter(r => !r.eventId));
    });
  }, [group]);

  const handleInvite = () => {
    // Используем корректную ссылку на бота
    const inviteLink = `https://t.me/${BOT_USERNAME}/start?startapp=invite_${group.id}`;
    const text = `Привет! Присоединяйся к комнате "${group.title}" в Togetherly.\nКод: ${group.id}\nПароль: ${group.password}`;

    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="p-4 space-y-8 pb-24">

      {/* Santa Widget */}
      <div
        onClick={onOpenSanta}
        className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl p-6 text-white shadow-lg shadow-rose-200 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform group"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <PartyPopper size={24} className="text-rose-200" /> Тайный Санта
            </h3>
            <div className="bg-white/20 backdrop-blur p-2 rounded-full group-hover:bg-white/30 transition-colors">
              <ChevronRight size={20} className="text-white" />
            </div>
          </div>

          {santaRooms.length > 0 ? (
            <div>
              <p className="text-rose-100 text-sm mb-4 font-medium">{santaRooms[0].title}</p>
              <span className="bg-white text-rose-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-2">
                {santaRooms[0].status === SantaRoomStatus.WAITING ? (
                  <><Users size={14} /> Идет набор</>
                ) : (
                  <><Target size={14} /> Игра идет</>
                )}
              </span>
            </div>
          ) : (
            <div>
              <p className="text-rose-100 text-sm mb-4 opacity-90">Еще не запускали? Самое время!</p>
              <span className="bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold border border-white/40">
                Создать игру
              </span>
            </div>
          )}
        </div>
        <PartyPopper size={120} className="absolute -right-8 -bottom-8 text-white/10 rotate-12 group-hover:rotate-45 transition-transform duration-500" />
      </div>

      {/* Events Preview */}
      <div>
        <SectionHeader
          title="Ближайшие события"
          action={<span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{events.length}</span>}
        />

        {events.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Пока тихо"
            description="Запланируйте день рождения или сбор на подарок."
          />
        ) : (
          <div className="space-y-4">
            {(() => {
              // Filter to show only upcoming events in preview
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const upcomingEvents = events.filter(e => new Date(e.date) >= today);

              return upcomingEvents.length > 0
                ? upcomingEvents.slice(0, 2).map(event => <EventCard key={event.id} event={event} onClick={() => onOpenEvent(event)} />)
                : <div className="text-center py-4 text-slate-400 text-sm">Нет предстоящих событий</div>;
            })()}
            {events.length > 2 && (
              <button
                onClick={onShowAllEvents}
                className="w-full py-3 bg-slate-50 text-slate-500 font-medium rounded-xl text-sm hover:bg-slate-100 transition-colors"
              >
                Показать все ({events.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Members Grid */}
      <div className="pb-40">
        <SectionHeader title="Команда" />
        <div className="grid grid-cols-5 gap-3">
          {group.members.map(memberId => (
            <button
              key={memberId}
              onClick={() => onViewUser(memberId)}
              className="flex flex-col items-center active:scale-95 transition-transform"
            >
              <UserAvatar user={{ id: memberId, name: '?' } as User} />
            </button>
          ))}
          <button
            onClick={handleInvite}
            className="flex flex-col items-center group"
          >
            <div className="w-10 h-10 border-2 border-dashed border-slate-300 rounded-full mb-1.5 flex items-center justify-center text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
              <UserPlus size={20} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

const PlaceholderView = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
      <Icon size={32} />
    </div>
    <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
    <p className="text-slate-500 text-sm max-w-xs">Мы уже работаем над этим экраном. Скоро здесь появится что-то крутое!</p>
  </div>
);

// ProfileScreen now imported from components/screens/ProfileScreen.tsx

// --- MAIN APP COMPONENT ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOBBY);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [inviteGroupId, setInviteGroupId] = useState<string | null>(null);
  const [activeFriend, setActiveFriend] = useState<User | null>(null); // Track selected friend for profile view
  const [activeEvent, setActiveEvent] = useState<Event | null>(null); // Track selected event
  const [activeAngelRoom, setActiveAngelRoom] = useState<SantaRoom | null>(null); // Track active Angel Guardian room
  const [showWishlistAddModal, setShowWishlistAddModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showMagicModal, setShowMagicModal] = useState(false);

  // 1. Initialize Auth and Deep Linking
  useEffect(() => {
    const initApp = async () => {
      console.log('[TOGETHERLY] Starting app initialization...');

      // Initialize Telegram WebApp if available
      if (window.Telegram?.WebApp) {
        console.log('[TOGETHERLY] Telegram WebApp detected');
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.enableClosingConfirmation();
        window.Telegram.WebApp.setHeaderColor('#f8fafc'); // Match bg-slate-50

        // Deep Linking check
        const startParam = window.Telegram.WebApp.initDataUnsafe?.start_param;
        if (startParam && startParam.startsWith('invite_')) {
          const gid = startParam.replace('invite_', '');
          setInviteGroupId(gid);
        }
      } else {
        console.log('[TOGETHERLY] Running in regular browser (no Telegram WebApp)');
      }

      // Get user data (from Telegram or fallback for browser testing)
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {
        id: 123456,
        first_name: "Alex",
        last_name: "Doe",
        username: "alexdoe"
      };

      console.log('[TOGETHERLY] User data:', tgUser);
      console.log('[TOGETHERLY] Attempting login/register...');

      try {
        const appUser = await storage.loginOrRegister(tgUser);
        console.log('[TOGETHERLY] Login successful:', appUser);
        setUser(appUser);
      } catch (e) {
        console.error('[TOGETHERLY] Login failed:', e);
        alert("Доступ к приложению ограничен.");
      }
    };
    initApp();
  }, []);

  // Debug: Switch User
  const debugSwitchUser = async () => {
    const currentTgId = String(user?.telegramId);

    // Cycle through 3 users: Alex -> Ivan -> Maria -> Alex
    let newUser;
    if (currentTgId === '123456') {
      // Alex -> Ivan
      newUser = {
        id: '999999',
        first_name: 'Ivan',
        last_name: 'Ivanov',
        username: 'ivan'
      };
    } else if (currentTgId === '999999') {
      // Ivan -> Maria
      newUser = {
        id: '777777',
        first_name: 'Maria',
        last_name: 'Petrova',
        username: 'maria'
      };
    } else {
      // Maria -> Alex (or any other -> Alex)
      newUser = {
        id: '123456',
        first_name: 'Alex',
        last_name: 'Doe',
        username: 'alexdoe'
      };
    }

    console.log(`[DEBUG] Switching from ${user?.name} (${currentTgId}) to ${newUser.first_name} (${newUser.id})`);

    try {
      const appUser = await storage.loginOrRegister(newUser);
      console.log('[DEBUG] Server returned user:', appUser);

      setUser(appUser);
      setActiveGroup(null);

      alert(`Переключено на: ${appUser.name} (ID: ${appUser.id})`);
    } catch (e) {
      console.error('[DEBUG] Switch failed:', e);
      alert('Ошибка переключения пользователя');
    }
  };

  // Handle invitation flow after user is loaded
  useEffect(() => {
    if (user && inviteGroupId) {
      setCurrentView(ViewState.JOIN_GROUP);
    }
  }, [user, inviteGroupId]);

  // 2. Handle Navigation
  const navigateToGroup = (group: Group) => {
    setActiveGroup(group);
    setCurrentView(ViewState.DASHBOARD);
    if (window.Telegram?.WebApp?.BackButton) {
      window.Telegram.WebApp.BackButton.show();
    }
  };

  const navigateToLobby = () => {
    setActiveGroup(null);
    setCurrentView(ViewState.LOBBY);
    if (window.Telegram?.WebApp?.BackButton) {
      window.Telegram.WebApp.BackButton.hide();
    }
  };

  const navigateToFriendProfile = (friend: User) => {
    setActiveFriend(friend);
    setCurrentView(ViewState.FRIEND_PROFILE);
  }

  const navigateToEvent = (event: Event) => {
    // Check if user is the beneficiary of this event
    if (event.beneficiaryId && event.beneficiaryId === user?.id) {
      setShowMagicModal(true);
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('warning');
      return;
    }
    setActiveEvent(event);
    setCurrentView(ViewState.EVENT_DETAILS);
  }

  useEffect(() => {
    const handleBack = () => {
      if (currentView === ViewState.FRIEND_PROFILE) {
        setCurrentView(ViewState.DASHBOARD);
        return;
      }
      if (currentView === ViewState.EVENTS || currentView === ViewState.WISHLIST || currentView === ViewState.SECRET_SANTA || currentView === ViewState.SANTA_GAME || currentView === ViewState.PROFILE) {
        setCurrentView(ViewState.DASHBOARD);
        return;
      }
      if (currentView === ViewState.CREATE_EVENT) {
        setCurrentView(ViewState.EVENTS);
        return;
      }
      if (currentView === ViewState.EVENT_DETAILS) {
        setCurrentView(ViewState.DASHBOARD);
        return;
      }

      if (activeGroup) {
        if (currentView === ViewState.DASHBOARD) {
          navigateToLobby();
        } else {
          setCurrentView(ViewState.DASHBOARD);
        }
      } else if (currentView === ViewState.CREATE_GROUP || currentView === ViewState.JOIN_GROUP) {
        navigateToLobby();
      }
    };

    if (window.Telegram?.WebApp?.BackButton) {
      window.Telegram.WebApp.BackButton.onClick(handleBack);
    }
    return () => {
      if (window.Telegram?.WebApp?.BackButton) {
        window.Telegram.WebApp.BackButton.offClick(handleBack);
      }
    };
  }, [activeGroup, currentView]);

  // Handle FAB Click from BottomNav
  const handleFabClick = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        // Navigate to Events view
        setCurrentView(ViewState.EVENTS);
        break;

      case ViewState.WISHLIST:
        // Add wishlist item
        setShowWishlistAddModal(true);
        break;

      case ViewState.EVENTS:
        // Create new event
        setCurrentView(ViewState.CREATE_EVENT);
        break;

      case ViewState.PROFILE:
        // Admin panel or About modal
        if (user?.isAdmin) {
          setCurrentView(ViewState.ADMIN);
        } else {
          setShowAboutModal(true);
        }
        break;

      // Santa view is handled internally in BottomNav with confetti
      default:
        break;
    }
  };

  // Handle Dynamic FAB Actions (legacy, keeping for DynamicFAB component)
  const handleFabAction = (action: string) => {
    if (action === 'add_wish') {
      setShowWishlistAddModal(true);
    } else if (action === 'create_event' || action === 'create_event_shortcut') {
      setCurrentView(ViewState.CREATE_EVENT);
    } else if (action === 'santa_magic') {
      window.Telegram?.WebApp?.HapticFeedback.impactOccurred('medium');
    } else if (action === 'admin') {
      setCurrentView(ViewState.ADMIN);
    } else if (action === 'about') {
      setShowAboutModal(true);
    }
  };

  // 3. Render
  if (!user) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-400 font-medium">Загрузка Togetherly...</div>;
  }

  // 4. Admin Routing
  if (currentView === ViewState.ADMIN) {
    return <AdminPanel onExit={() => setCurrentView(ViewState.PROFILE)} />;
  }

  const renderContent = () => {
    // Global Flows (No Group Selected)
    if (!activeGroup) {
      switch (currentView) {
        case ViewState.CREATE_GROUP:
          return <CreateGroupScreen user={user} onBack={navigateToLobby} onCreated={navigateToGroup} />;
        case ViewState.JOIN_GROUP:
          return (
            <JoinGroupScreen
              user={user}
              initialGroupId={inviteGroupId || undefined}
              onBack={navigateToLobby}
              onJoined={(g) => {
                setInviteGroupId(null); // Clear invite
                navigateToGroup(g);
              }}
            />
          );
        case ViewState.PROFILE:
          return <ProfileScreen user={user} onEnterAdmin={() => setCurrentView(ViewState.ADMIN)} onUpdateUser={setUser} />;
        default:
          // Default is LOBBY
          return <LobbyScreen
            user={user}
            onSelectGroup={navigateToGroup}
            onCreateGroup={() => setCurrentView(ViewState.CREATE_GROUP)}
            onJoinGroup={() => setCurrentView(ViewState.JOIN_GROUP)}
            onDebugSwitch={debugSwitchUser}
          />;
      }
    }

    // In-Room Flows
    return (
      <div className="min-h-screen bg-slate-50 relative">
        {currentView !== ViewState.FRIEND_PROFILE && currentView !== ViewState.EVENT_DETAILS && (
          <div className="px-4">
            <RoomHeader
              group={activeGroup}
              user={user}
              onSettings={() => setCurrentView(ViewState.GROUP_SETTINGS)}
              onExit={navigateToLobby}
            />
          </div>
        )}

        {currentView === ViewState.DASHBOARD && (
          <RoomDashboard
            group={activeGroup}
            user={user}
            onOpenSanta={() => setCurrentView(ViewState.SECRET_SANTA)}
            onViewUser={async (id) => {
              if (id === user.id) {
                setCurrentView(ViewState.PROFILE);
              } else {
                const friend = await storage.getUserById(id);
                if (friend) navigateToFriendProfile(friend);
              }
            }}
            onOpenEvent={navigateToEvent}
            onShowAllEvents={() => setCurrentView(ViewState.EVENTS)}
          />
        )}
        {currentView === ViewState.GROUP_SETTINGS && (
          <GroupSettingsScreen
            group={activeGroup}
            user={user}
            onBack={() => setCurrentView(ViewState.DASHBOARD)}
            onUpdated={setActiveGroup}
            onLeaveGroup={() => {
              setActiveGroup(null);
              setCurrentView(ViewState.LOBBY);
            }}
            onDeleteGroup={() => {
              setActiveGroup(null);
              setCurrentView(ViewState.LOBBY);
            }}
          />
        )}
        {currentView === ViewState.WISHLIST && (
          <WishlistScreen
            user={user}
            showAddModal={showWishlistAddModal}
            onCloseAddModal={() => setShowWishlistAddModal(false)}
            onItemAdded={() => { }}
          />
        )}

        {currentView === ViewState.EVENTS && (
          <EventsScreen
            group={activeGroup}
            user={user}
            onOpenEvent={navigateToEvent}
            onCreateEvent={() => setCurrentView(ViewState.CREATE_EVENT)}
          />
        )}

        {currentView === ViewState.CREATE_EVENT && (
          <CreateEventScreen
            group={activeGroup}
            user={user}
            onBack={() => setCurrentView(ViewState.EVENTS)}
            onCreated={() => setCurrentView(ViewState.EVENTS)}
          />
        )}

        {currentView === ViewState.EVENT_DETAILS && activeEvent && (
          <EventDetailsScreen
            event={activeEvent}
            user={user}
            group={activeGroup}
            onBack={() => setCurrentView(ViewState.EVENTS)}
            onOpenAngelGuardian={(event, room) => {
              setActiveEvent(event);
              setActiveAngelRoom(room);
              setCurrentView(ViewState.SANTA_GAME);
            }}
            onEventUpdate={(updatedEvent) => setActiveEvent(updatedEvent)}
          />
        )}

        {currentView === ViewState.SECRET_SANTA && (
          <SecretSantaScreen
            group={activeGroup}
            user={user}
            onBack={() => setCurrentView(ViewState.DASHBOARD)}
          />
        )}

        {currentView === ViewState.SANTA_GAME && activeEvent && activeAngelRoom && (
          <AngelGuardianScreen
            event={activeEvent}
            room={activeAngelRoom}
            user={user}
            onBack={() => setCurrentView(ViewState.EVENT_DETAILS)}
          />
        )}

        {currentView === ViewState.PROFILE && (
          <ProfileScreen
            user={user}
            group={activeGroup}
            onEnterAdmin={() => setCurrentView(ViewState.ADMIN)}
            onUpdateUser={setUser}
            onLeaveGroup={() => {
              setActiveGroup(null);
              setCurrentView(ViewState.LOBBY);
            }}
            onDeleteGroup={() => {
              setActiveGroup(null);
              setCurrentView(ViewState.LOBBY);
            }}
          />
        )}

        {currentView === ViewState.FRIEND_PROFILE && activeFriend && (
          <FriendProfileScreen
            friend={activeFriend}
            currentUser={user}
            onBack={() => setCurrentView(ViewState.DASHBOARD)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      <main className="mx-auto max-w-md min-h-screen bg-slate-50 shadow-2xl relative">
        {renderContent()}
      </main>
      <BottomNav
        currentView={currentView}
        onChangeView={setCurrentView}
        onFABClick={handleFabClick}
        isAdmin={user?.isAdmin || false}
      />

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowAboutModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center animate-in zoom-in-95 relative max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAboutModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <div className="mb-4 flex justify-center"><TogetherlyLogo size="text-3xl" /></div>
            <p className="text-slate-600 font-medium mb-4">Для друзей с любовью ❤️</p>

            {/* Future Features Section */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-4 mb-4 text-left border border-rose-100">
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-lg">🚀</span> Скоро появится
              </h4>
              <div className="space-y-3 text-xs text-slate-600">
                <div>
                  <p className="font-bold text-rose-600 mb-1">🎮 Игры для компании</p>
                  <p className="text-slate-500">Мафия, Шляпа, Шпион</p>
                </div>
                <div>
                  <p className="font-bold text-rose-600 mb-1">🛍️ Интеграция маркетплейсов</p>
                  <p className="text-slate-500">Автоматическая подгрузка товаров с Ozon, AliExpress, Wildberries и Яндекс Маркет</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Специально для Убивателей красками<br />
              © 2025 Togetherly App
            </div>
            <button onClick={() => setShowAboutModal(false)} className="mt-6 w-full py-3 bg-slate-100 rounded-xl font-bold text-slate-600">Закрыть</button>
          </div>
        </div>
      )}

      {/* Magic Modal - Birthday Person Blocked */}
      {showMagicModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowMagicModal(false)}>
          <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 w-full max-w-sm rounded-3xl p-8 text-center animate-in zoom-in-95 relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowMagicModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white">
              <X size={20} />
            </button>
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-2xl font-bold text-white mb-3">Тебе туда нельзя!</h3>
            <p className="text-white/90 text-lg font-medium mb-6">Там происходит магия! 🎁</p>
            <div className="text-sm text-white/70 mb-6">
              Твои друзья готовят для тебя что-то особенное...
            </div>
            <button
              onClick={() => setShowMagicModal(false)}
              className="w-full py-3 bg-white/20 backdrop-blur text-white rounded-xl font-bold hover:bg-white/30 transition-colors"
            >
              Понятно 😊
            </button>
          </div>
        </div>
      )}


    </div>
  );
}
