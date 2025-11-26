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

interface JoinGroupScreenProps {
    user: User;
    initialGroupId?: string;
    onBack: () => void;
    onJoined: (g: Group) => void;
}

export const JoinGroupScreen: React.FC<JoinGroupScreenProps> = ({
    user,
    initialGroupId,
    onBack,
    onJoined
}) => {
    const [groupId, setGroupId] = useState(initialGroupId || '');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!groupId.trim() || !password.trim()) return;
        setIsSubmitting(true);
        setError(null);

        const result = await storage.joinGroup(groupId.trim(), user.id, password);

        if (result.success) {
            const group = await storage.getGroupById(groupId.trim().toUpperCase());
            if (group) onJoined(group);
            else setError("Ошибка загрузки данных комнаты");
        } else {
            setError(result.message || "Не удалось войти");
        }
        setIsSubmitting(false);
    };

    useTelegramMainButton("Войти", handleSubmit, !!groupId.trim() && !!password.trim(), isSubmitting);

    return (
        <div className="p-4 min-h-screen bg-white flex flex-col">
            <button onClick={onBack} className="mb-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 py-2 self-start">
                <ArrowLeft size={20} /> Назад
            </button>
            <h2 className="text-2xl font-bold mb-1 text-slate-900">Войти в комнату</h2>
            <p className="text-slate-500 text-sm mb-8">Введите код комнаты и пароль</p>

            <div className="space-y-6 flex-1">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">ID Комнаты</label>
                    <input
                        type="text"
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value.toUpperCase().replace(/\s/g, ''))}
                        placeholder="Например: AX9Z2B"
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-mono text-lg tracking-widest uppercase"
                        maxLength={6}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Пароль</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Введите пароль комнаты"
                            className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none pl-12"
                        />
                        <Lock size={20} className="absolute left-4 top-4 text-slate-400" />
                    </div>
                </div>
                {error && (
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {error}
                    </div>
                )}
            </div>

            {/* Explicit Button for Browser/Desktop */}
            <div className="mt-6">
                <button
                    onClick={handleSubmit}
                    disabled={!groupId.trim() || !password.trim() || isSubmitting}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all"
                >
                    {isSubmitting ? "Вход..." : "Войти"}
                </button>
            </div>
        </div>
    );
};
