
import React from 'react';
import { ChevronDown, Plus } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-20 bg-[#161a2b] text-white flex items-center justify-between px-8 border-b border-gray-800 shrink-0">
      <div className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
        <span className="font-medium">Bem-vindo, Pedro</span>
        <ChevronDown size={16} />
      </div>

      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors">
          Adicionar colaborador
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500">
          <img src="https://picsum.photos/seed/user123/100/100" alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <ChevronDown size={16} className="text-gray-400" />
      </div>
    </header>
  );
};
