import { useAuthStore } from '../../stores/auth.store';
import { Bell, Search } from 'lucide-react';

export function TopBar() {
  const { user } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 w-80 max-w-full">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search campaigns, creators, content..."
          className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>
        <div className="h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-none">{user?.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
