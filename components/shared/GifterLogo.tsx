import React from 'react';

interface GifterLogoProps {
    className?: string;
    size?: string;
}

export const GifterLogo: React.FC<GifterLogoProps> = ({ className = "", size = "text-2xl" }) => (
    <div className={`flex items-center gap-2.5 select-none group ${className}`}>
        {/* Geometric gift box icon */}
        <div className="relative w-8 h-8 transition-transform group-hover:scale-110 duration-300">
            {/* Box */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg shadow-md"></div>
            {/* Ribbon vertical */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-full bg-gradient-to-b from-rose-400 to-rose-500"></div>
            {/* Ribbon horizontal */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-2 bg-gradient-to-r from-rose-400 to-rose-500"></div>
            {/* Bow */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-rose-400 rounded-full shadow-sm"></div>
        </div>

        {/* Wordmark */}
        <div className={`font-bold tracking-tight flex items-baseline ${size}`}>
            <span className="text-slate-800 transition-colors group-hover:text-slate-900">gifter</span>
            <span className="text-[0.6em] text-indigo-600 ml-0.5 font-normal">.app</span>
        </div>
    </div>
);
