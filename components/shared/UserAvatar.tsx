import React from 'react';
import { User } from '../../types';

interface UserAvatarProps {
    user?: User;
    size?: string;
    textSize?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
    user,
    size = "w-10 h-10",
    textSize = "text-sm"
}) => (
    <div className={`${size} bg-slate-100 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center shrink-0`}>
        {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
        ) : (
            <span className={`${textSize} font-bold text-slate-400`}>{user?.name?.[0] || '?'}</span>
        )}
    </div>
);
