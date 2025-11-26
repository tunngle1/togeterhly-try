import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description }) => (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-200">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-400">
            <Icon size={24} />
        </div>
        <h4 className="text-sm font-semibold text-slate-700 mb-1">{title}</h4>
        <p className="text-xs text-slate-400 max-w-[200px]">{description}</p>
    </div>
);
