
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Group, User, AdminStats } from '../types';
import { 
  LayoutDashboard, Users, FolderOpen, Ban, Trash2, 
  LogOut, DollarSign, Gift, Search, ShieldAlert, ChevronRight
} from 'lucide-react';

enum AdminTab {
  DASHBOARD = 'DASHBOARD',
  GROUPS = 'GROUPS',
  USERS = 'USERS'
}

export const AdminPanel = ({ onExit }: { onExit: () => void }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(AdminTab.DASHBOARD);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
    // Reset search when tab changes
    setSearchTerm('');
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === AdminTab.DASHBOARD) {
      const data = await storage.getAdminStats();
      setStats(data);
    } else if (activeTab === AdminTab.GROUPS) {
      const data = await storage.getAllGroups();
      setGroups(data);
    } else if (activeTab === AdminTab.USERS) {
      const data = await storage.getAllUsers();
      setUsers(data);
    }
    setLoading(false);
  };

  const handleDeleteGroup = async (id: string) => {
    if (confirm('Вы уверены? Это действие необратимо.')) {
      await storage.deleteGroup(id);
      loadData();
    }
  };

  const handleToggleBlockUser = async (id: string) => {
    await storage.toggleUserBlock(id);
    loadData();
  };

  const TabButton = ({ tab, label }: { tab: AdminTab, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
        activeTab === tab 
          ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <ShieldAlert size={20} className="text-indigo-600" /> Админка
        </h1>
        <button 
          onClick={onExit}
          className="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Navigation (Segmented Control) */}
      <div className="px-4 pt-4 pb-2 sticky top-[57px] bg-slate-50 z-40">
         <div className="flex p-1 bg-slate-200/60 rounded-xl">
            <TabButton tab={AdminTab.DASHBOARD} label="Обзор" />
            <TabButton tab={AdminTab.GROUPS} label="Комнаты" />
            <TabButton tab={AdminTab.USERS} label="Люди" />
         </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto pb-24">
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* Dashboard View */}
        {!loading && activeTab === AdminTab.DASHBOARD && stats && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-3">
               <StatCard icon={Users} label="Пользователей" value={stats.totalUsers} color="bg-blue-50 text-blue-600" />
               <StatCard icon={FolderOpen} label="Комнат" value={stats.totalGroups} color="bg-emerald-50 text-emerald-600" />
               <StatCard icon={Gift} label="Событий" value={stats.totalEvents} color="bg-purple-50 text-purple-600" />
               <StatCard icon={DollarSign} label="Сумма сборов" value={stats.totalMoneyExpected.toLocaleString()} color="bg-amber-50 text-amber-600" />
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mt-4">
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-rose-50 text-rose-500 rounded-lg"><LayoutDashboard size={20}/></div>
                  <h3 className="font-bold text-slate-700">Тайный Санта</h3>
               </div>
               <p className="text-3xl font-bold text-slate-900">{stats.totalSantaRooms}</p>
               <p className="text-xs text-slate-400">Активных игр запущено</p>
            </div>
          </div>
        )}

        {/* Search Bar for Lists */}
        {!loading && activeTab !== AdminTab.DASHBOARD && (
           <div className="relative mb-4">
              <input 
                type="text"
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border-none rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
           </div>
        )}

        {/* Groups List */}
        {!loading && activeTab === AdminTab.GROUPS && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {groups.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()) || g.id.toLowerCase().includes(searchTerm.toLowerCase())).map(group => (
              <div key={group.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                 <div className="flex justify-between items-start mb-3">
                    <div>
                       <h3 className="font-bold text-slate-800 text-lg leading-snug">{group.title}</h3>
                       <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">{group.id}</span>
                    </div>
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg">
                       {group.members.length} уч.
                    </span>
                 </div>
                 <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400">
                       {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Удалить
                    </button>
                 </div>
              </div>
            ))}
            {groups.length === 0 && <div className="text-center text-slate-400 py-10">Список пуст</div>}
          </div>
        )}

        {/* Users List */}
        {!loading && activeTab === AdminTab.USERS && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
              <div key={user.id} className={`bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-4 ${user.isBlocked ? 'border-rose-100 bg-rose-50/30' : 'border-slate-100'}`}>
                 <div className="w-12 h-12 bg-slate-100 rounded-full shrink-0 overflow-hidden">
                    {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">{user.name[0]}</div>}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{user.name}</h3>
                    <p className="text-xs text-slate-500 truncate">@{user.username || 'no_username'}</p>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">{user.telegramId}</div>
                 </div>
                 <button 
                   onClick={() => handleToggleBlockUser(user.id)}
                   className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${user.isBlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}
                 >
                   {user.isBlocked ? <ShieldAlert size={20} /> : <Ban size={20} />}
                 </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${color}`}>
      <Icon size={20} />
    </div>
    <div className="text-xl font-bold text-slate-900 leading-none mb-1">{value}</div>
    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{label}</div>
  </div>
);