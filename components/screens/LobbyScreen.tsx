import React, { useState, useEffect } from 'react';
import { Users, Plus, LogIn, ChevronRight } from 'lucide-react';
import { User, Group } from '../../types';
import { storage } from '../../services/storage';
import { TogetherlyLogo } from '../shared/TogetherlyLogo';
import { EmptyState } from '../shared/EmptyState';

// Section Header component
const SectionHeader = ({ title, action }: { title: string, action?: React.ReactNode }) => (
    <div className="flex justify-between items-end mb-4 px-1">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
        {action}
    </div>
);

interface LobbyScreenProps {
    user: User;
    onSelectGroup: (g: Group) => void;
    onCreateGroup: () => void;
    onJoinGroup: () => void;
    onDebugSwitch?: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
    user,
    onSelectGroup,
    onCreateGroup,
    onJoinGroup,
    onDebugSwitch
}) => {
    const [myGroups, setMyGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        storage.getUserGroups(user.id).then(groups => {
            setMyGroups(groups);
            setLoading(false);
        });
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="flex-1 p-4 pb-32 overflow-y-auto">
                <header className="mb-8 pt-4 flex justify-between items-start">
                    <div onClick={onDebugSwitch} className="cursor-pointer">
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-1">Привет, {user.name.split(' ')[0]}!</h1>
                        <p className="text-slate-500 text-xs">Готов к праздникам? (Tap to switch)</p>
                    </div>
                    <TogetherlyLogo />
                </header>

                <SectionHeader title="Твои компании" />

                <div className="space-y-3">
                    {loading ? (
                        <div className="animate-pulse space-y-3">
                            {[1, 2].map(i => <div key={i} className="h-20 bg-slate-200 rounded-2xl"></div>)}
                        </div>
                    ) : myGroups.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title="У вас пока нет компаний"
                            description="Создайте комнату для семьи, друзей или коллег, чтобы начать."
                        />
                    ) : (
                        myGroups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => onSelectGroup(group)}
                                className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all flex items-center justify-between group hover:shadow-md"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-slate-100 rounded-xl flex items-center justify-center text-indigo-600">
                                        <Users size={20} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-800">{group.title}</h3>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {group.members.length} участников
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500" />
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Floating Action Buttons (Fixed position with safe area support) */}
            <div className="fixed bottom-safe-extra left-4 right-4 flex flex-col gap-3 z-40">
                <button
                    onClick={onCreateGroup}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                    <Plus size={20} /> Создать новую
                </button>
                <button
                    onClick={onJoinGroup}
                    className="w-full bg-white/90 backdrop-blur text-indigo-600 py-4 rounded-2xl font-bold shadow-lg border border-indigo-50 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                    <LogIn size={20} /> Войти по коду
                </button>
            </div>
        </div>
    );
};
