import React from 'react';
import { Trash2, ExternalLink, ShoppingCart, CheckCircle2, Lock } from 'lucide-react';
import { WishlistItem, UserId, WishlistItemId } from '../../types';

interface WishlistItemCardProps {
    item: WishlistItem;
    isOwner: boolean;
    currentUserId: UserId;
    onBook?: (itemId: WishlistItemId) => void;
    onUnbook?: (itemId: WishlistItemId) => void;
    onDelete?: (itemId: WishlistItemId) => void;
}

export const WishlistItemCard: React.FC<WishlistItemCardProps> = ({
    item,
    isOwner,
    currentUserId,
    onBook,
    onUnbook,
    onDelete
}) => {
    const isBookedByMe = item.bookedBy === currentUserId;
    const isBookedByOther = item.isBooked && !isBookedByMe;

    const priorityColors = {
        high: 'border-rose-200 bg-rose-50',
        medium: 'border-amber-200 bg-amber-50',
        low: 'border-slate-200 bg-white'
    };

    const priorityBadges = {
        high: <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">Важно</span>,
        medium: <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Средне</span>,
        low: null
    };

    return (
        <div className={`rounded-2xl border-2 p-3 flex flex-col gap-2 ${priorityColors[item.priority]}`}>
            {/* Image */}
            {item.imageUrl && (
                <div className="w-full aspect-square bg-white rounded-xl overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
            )}

            {/* Title and Priority */}
            <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-sm text-slate-800 line-clamp-2 flex-1">{item.title}</h4>
                {priorityBadges[item.priority]}
            </div>

            {/* Price */}
            {item.price && (
                <p className="text-lg font-bold text-indigo-600">{item.price.toLocaleString('ru-RU')} ₽</p>
            )}

            {/* Description */}
            {item.description && (
                <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
                {/* Link button */}
                {item.url && (
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
                    >
                        <ExternalLink size={14} /> Ссылка
                    </a>
                )}

                {/* Owner actions */}
                {isOwner && onDelete && (
                    <button
                        onClick={() => onDelete(item.id)}
                        className="bg-rose-100 text-rose-600 p-2 rounded-xl hover:bg-rose-200 transition-colors"
                        title="Удалить"
                    >
                        <Trash2 size={16} />
                    </button>
                )}

                {/* Non-owner booking actions */}
                {!isOwner && (
                    <>
                        {!item.isBooked && onBook && (
                            <button
                                onClick={() => onBook(item.id)}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-indigo-700 transition-colors active:scale-95"
                            >
                                <ShoppingCart size={14} /> Забронировать
                            </button>
                        )}

                        {isBookedByMe && onUnbook && (
                            <button
                                onClick={() => onUnbook(item.id)}
                                className="flex-1 bg-emerald-100 text-emerald-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-200 transition-colors"
                            >
                                <CheckCircle2 size={14} /> Забронировано
                            </button>
                        )}

                        {isBookedByOther && (
                            <div className="flex-1 bg-slate-100 text-slate-400 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-not-allowed">
                                <Lock size={14} /> Недоступно
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
