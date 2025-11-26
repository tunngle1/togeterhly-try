import React from 'react';
import { User } from '../../types';

interface ClickableUserNameProps {
    user: User;
    onClick: (user: User) => void;
    className?: string;
}

export const ClickableUserName: React.FC<ClickableUserNameProps> = ({ user, onClick, className = '' }) => (
    <button
        onClick={() => onClick(user)}
        className={`hover:text-indigo-600 transition-colors font-medium ${className}`}
    >
        {user.name}
    </button>
);
