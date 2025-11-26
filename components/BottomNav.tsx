
import React, { useState } from 'react';
import { Home, Gift, Calendar, User, PartyPopper, Plus, Trees, ShieldCheck } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onFABClick?: () => void;
  isAdmin?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView, onFABClick, isAdmin = false }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  // Do not show Bottom Nav in Lobby or Room Selection flows
  const isLobbyFlow = [ViewState.LOBBY, ViewState.CREATE_GROUP, ViewState.JOIN_GROUP].includes(currentView);

  if (isLobbyFlow) return null;

  // Determine FAB icon and action based on current view
  let fabIcon = Calendar;
  let fabAction = () => onChangeView(ViewState.EVENTS);
  let fabColor = 'bg-indigo-600 shadow-indigo-200';
  let fabActiveColor = 'bg-indigo-700 shadow-indigo-300';
  let fabLabel = 'События';

  switch (currentView) {
    case ViewState.DASHBOARD:
      fabIcon = Calendar;
      fabAction = () => {
        if (onFABClick) onFABClick();
      };
      fabLabel = 'События';
      break;

    case ViewState.WISHLIST:
      fabIcon = Plus;
      fabAction = () => {
        if (onFABClick) onFABClick();
      };
      fabLabel = 'Добавить';
      break;

    case ViewState.EVENTS:
      fabIcon = Plus;
      fabAction = () => {
        if (onFABClick) onFABClick();
      };
      fabLabel = 'Создать';
      break;

    case ViewState.SECRET_SANTA:
    case ViewState.SANTA_GAME:
      fabIcon = Trees;
      fabAction = () => {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      };
      fabColor = 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-200';
      fabActiveColor = 'bg-gradient-to-br from-rose-600 to-pink-700 shadow-rose-300';
      fabLabel = 'Санта';
      break;

    case ViewState.PROFILE:
      fabIcon = isAdmin ? ShieldCheck : Gift;
      fabAction = () => {
        if (onFABClick) onFABClick();
      };
      fabColor = isAdmin ? 'bg-slate-800 shadow-slate-400' : 'bg-gradient-to-br from-indigo-500 to-violet-500 shadow-indigo-300';
      fabActiveColor = isAdmin ? 'bg-slate-900 shadow-slate-500' : 'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-400';
      fabLabel = isAdmin ? 'Админка' : 'О нас';
      break;
  }

  const navItems = [
    { view: ViewState.DASHBOARD, icon: Home, label: 'Главная' },
    { view: ViewState.WISHLIST, icon: Gift, label: 'Вишлист' },
    { view: ViewState.EVENTS, icon: Calendar, label: 'События', isPrimary: true },
    { view: ViewState.SECRET_SANTA, icon: PartyPopper, label: 'Санта' },
    { view: ViewState.PROFILE, icon: User, label: 'Профиль' },
  ];

  const FabIcon = fabIcon;

  return (
    <>
      {/* Confetti/Snow effect for Santa */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {Math.random() > 0.5 ? (
                <span className="text-2xl">❄️</span>
              ) : (
                <span className="text-xl">✨</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe-extra pt-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-end max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            const Icon = item.icon;

            if (item.isPrimary) {
              return (
                <button
                  key={item.view}
                  onClick={fabAction}
                  className="relative -top-6 flex flex-col items-center justify-center group"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-white transform transition-all active:scale-95 group-hover:scale-105 ${fabColor}`}>
                    <FabIcon size={28} />
                  </div>
                  <span className={`text-xs font-bold mt-1.5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>{fabLabel}</span>
                </button>
              );
            }

            return (
              <button
                key={item.view}
                onClick={() => onChangeView(item.view)}
                className={`flex flex-col items-center justify-center w-14 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
                <span className={`text-[10px] font-medium ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};