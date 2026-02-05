import { useState, type ReactNode } from 'react';
import { Menu, Home } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-800">ColocApp</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="py-8 px-5 sm:px-6 lg:py-10 lg:px-12 xl:py-12 xl:px-16">
            <div className="max-w-6xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
