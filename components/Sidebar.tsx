
import React from 'react';
import { LayoutGrid, Users, TrendingUp, Wallet, LogOut } from 'lucide-react';

interface SidebarProps {
  currentView: 'dashboard' | 'leads';
  onViewChange: (view: 'dashboard' | 'leads') => void;
}

const NavItem = ({ icon: Icon, active = false, onClick }: { icon: any; active?: boolean; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-gray-800'}`}
  >
    <Icon size={24} />
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  return (
    <aside className="w-20 bg-[#0f121d] flex flex-col items-center py-8 gap-8 border-r border-gray-800 shrink-0">
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-4">
        <div className="w-6 h-6 bg-indigo-600 rounded-sm transform rotate-45"></div>
      </div>
      
      <nav className="flex flex-col gap-6 flex-1">
        <NavItem icon={LayoutGrid} active={currentView === 'dashboard'} onClick={() => onViewChange('dashboard')} />
        <NavItem icon={Users} active={currentView === 'leads'} onClick={() => onViewChange('leads')} />
        <NavItem icon={TrendingUp} />
        <NavItem icon={Wallet} />
      </nav>

      <div className="mt-auto">
        <NavItem icon={LogOut} />
      </div>
    </aside>
  );
};
