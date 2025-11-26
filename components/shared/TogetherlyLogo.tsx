import React from 'react';

interface TogetherlyLogoProps {
    className?: string;
    size?: string;
}

export const TogetherlyLogo: React.FC<TogetherlyLogoProps> = ({ className = "", size = "text-2xl" }) => (
    <div className={`inline-flex items-center group ${className}`}>
        <span className={`font-black ${size} tracking-tight relative`}>
            {/* Main text with softer gradient */}
            <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-slate-700 bg-clip-text text-transparent transition-all duration-300 group-hover:from-rose-700 group-hover:via-rose-600 group-hover:to-slate-800">
                togetherly
            </span>

            {/* Subtle underline accent */}
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-rose-600/0 via-rose-500/50 to-rose-600/0 rounded-full transition-all duration-300 group-hover:via-rose-500/70" />
        </span>
    </div>
);
