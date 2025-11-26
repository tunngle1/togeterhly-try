import React, { useState } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { User, Group } from '../../types';
import { storage } from '../../services/storage';

// Telegram Main Button Hook (copied from App.tsx)
const useTelegramMainButton = (
    text: string,
    onClick: () => void,
    enabled: boolean = true,
    loading: boolean = false
) => {
    React.useEffect(() => {
        const tg = window.Telegram?.WebApp;
        if (!tg) return;

        if (enabled && !loading) {
            tg.MainButton.setText(text);
            tg.MainButton.show();
            tg.MainButton.enable();
            tg.MainButton.onClick(onClick);
        } else {
            tg.MainButton.hide();
        }

        return () => {
            tg.MainButton.offClick(onClick);
            tg.MainButton.hide();
        };
    }, [text, onClick, enabled, loading]);
};

interface CreateGroupScreenProps {
    user: User;
    onBack: () => void;
    onCreated: (g: Group) => void;
}

export const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({ user, onBack, onCreated }) => {
    const [title, setTitle] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim() || !password.trim()) return;
        setIsSubmitting(true);
        const group = await storage.createGroup(user.id, title, password);
        setIsSubmitting(false);
        onCreated(group);
    };

    useTelegramMainButton("Создать комнату", handleSubmit, !!title.trim() && !!password.trim(), isSubmitting);

    return (
        <div className="p-4 min-h-screen bg-white flex flex-col">
            <button onClick={onBack} className="mb-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 py-2 self-start">
                <ArrowLeft size={20} /> Назад
            </button>
            <h2 className="text-2xl font-bold mb-1 text-slate-900">Новая комната</h2>
            <p className="text-slate-500 text-sm mb-8">Объедините друзей в одну группу</p>

            <div className="space-y-6 flex-1">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Название</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Например: Семья ❤️"
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-lg"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Пароль (обязательно)</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Придумайте пароль"
                            className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none pl-12"
                        />
                        <Lock size={20} className="absolute left-4 top-4 text-slate-400" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 px-2">Этот пароль понадобится друзьям для входа</p>
                </div>
            </div>

            {/* Explicit Button for Browser/Desktop */}
            <div className="mt-6">
                <button
                    onClick={handleSubmit}
                    disabled={!title.trim() || !password.trim() || isSubmitting}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all"
                >
                    {isSubmitting ? "Создание..." : "Создать комнату"}
                </button>
            </div>
        </div>
    );
};
