import React, { useState } from 'react';
import { Calendar, Save, Gift, ChevronRight, Edit3, X } from 'lucide-react';
import { User, Group } from '../../types';
import { storage } from '../../services/storage';
import { TogetherlyLogo } from '../shared/TogetherlyLogo';

interface ProfileScreenProps {
    user: User;
    group?: Group | null;
    onEnterAdmin: () => void;
    onUpdateUser: (u: User) => void;
    onLeaveGroup?: () => void;
    onDeleteGroup?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
    user,
    group,
    onEnterAdmin,
    onUpdateUser,
    onLeaveGroup,
    onDeleteGroup
}) => {
    const [birthday, setBirthday] = useState(user.birthday || '');
    const [saving, setSaving] = useState(false);
    const [showAbout, setShowAbout] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const updatedUser = await storage.updateUser(user.id, { birthday });
        onUpdateUser(updatedUser);
        setSaving(false);
        window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
    };

    return (
        <div className="p-4 pt-8 min-h-[80vh] flex flex-col pb-32">
            <div className="flex justify-center mb-6">
                <TogetherlyLogo size="text-lg" />
            </div>

            <div className="flex flex-col items-center mb-8">
                <div className="relative">
                    <div className="w-28 h-28 bg-gradient-to-br from-rose-500 to-slate-600 rounded-full mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-rose-200 p-1">
                        <div className="w-full h-full bg-rose-500 rounded-full overflow-hidden flex items-center justify-center">
                            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" /> : user.name[0]}
                        </div>
                    </div>
                    <div className="absolute bottom-4 right-0 bg-white p-1.5 rounded-full shadow-md border border-slate-100 text-rose-600">
                        <Edit3 size={16} />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
                <p className="text-slate-500 font-medium">@{user.username || 'user'}</p>
            </div>

            <div className="space-y-4 flex-1">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <div className="p-1.5 bg-red-50 rounded-lg text-rose-600"><Calendar size={16} /></div>
                            День рождения
                        </h4>
                        {saving && <span className="text-xs text-rose-600 animate-pulse">Сохранение...</span>}
                    </div>

                    <div className="flex gap-3">
                        <input
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            className={`w-full p-4 bg-slate-50 rounded-2xl outline-none font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-red-500/20 transition-all ${!user.birthday ? 'ring-2 ring-rose-100 bg-rose-50' : ''}`}
                        />
                        <button
                            onClick={handleSave}
                            disabled={saving || birthday === user.birthday}
                            className="bg-rose-500 text-white px-5 rounded-2xl disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-rose-200 disabled:shadow-none transition-all active:scale-95"
                        >
                            <Save size={20} />
                        </button>
                    </div>
                    {!user.birthday && (
                        <p className="text-xs text-rose-500 mt-3 font-medium px-2">🎁 Укажите дату, чтобы друзья не забыли поздравить!</p>
                    )}
                </div>

                <button
                    onClick={() => setShowAbout(true)}
                    className="w-full bg-gradient-to-br from-rose-500 to-slate-600 text-white p-5 rounded-3xl flex items-center gap-4 shadow-lg shadow-rose-200 active:scale-95 transition-transform mt-6"
                >
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                        <Gift size={24} />
                    </div>
                    <div className="text-left flex-1">
                        <h4 className="font-bold text-lg">О сервисе Togetherly</h4>
                        <p className="text-xs text-red-100">Версия 1.0.2</p>
                    </div>
                    <ChevronRight size={20} className="text-red-200" />
                </button>
            </div>

            {/* About Modal */}
            {showAbout && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowAbout(false)}>
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center animate-in zoom-in-95 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowAbout(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        <div className="mb-4 flex justify-center"><TogetherlyLogo size="text-3xl" /></div>
                        <p className="text-slate-600 font-medium mb-4">Для друзей с любовью ❤️</p>
                        <div className="text-xs text-slate-400">
                            Специально для Убивателей красками<br />
                            © 2025 Togetherly App
                        </div>
                        <button onClick={() => setShowAbout(false)} className="mt-6 w-full py-3 bg-slate-100 rounded-xl font-bold text-slate-600">Закрыть</button>
                    </div>
                </div>
            )}

            <div className="mt-8 text-center">
                <p className="text-[10px] text-slate-300 font-medium uppercase tracking-widest">Togetherly App v1.0.2</p>
            </div>
        </div>
    );
};
