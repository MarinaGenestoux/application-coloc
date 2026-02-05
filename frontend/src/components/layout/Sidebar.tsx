import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Receipt, Wallet, LogOut, ChevronDown, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useColocation } from '../../context/ColocationContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Synthèse' },
  { to: '/expenses', icon: Receipt, label: 'Dépenses' },
  { to: '/balances', icon: Wallet, label: 'Soldes' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { currentColocation, colocations, selectColocation } = useColocation();
  const navigate = useNavigate();
  const [showColocDropdown, setShowColocDropdown] = useState(false);

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  const handleSelectColocation = (id: string) => {
    selectColocation(id);
    setShowColocDropdown(false);
  };

  const userInitials = user
    ? `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`.toUpperCase()
    : 'U';

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72
          bg-white border-r border-slate-100 shadow-sm
          flex flex-col
          transition-transform duration-300 ease-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">ColocApp</span>
          </div>
        </div>

        {/* Colocation Selector — click-based for touch support */}
        {currentColocation && (
          <div className="px-5 pb-6">
            <div className="relative">
              <button
                onClick={() => setShowColocDropdown(!showColocDropdown)}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-100 transition-all duration-200 border border-slate-100 hover:border-slate-200 hover:shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                    {currentColocation.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 truncate">
                    {currentColocation.name}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
                    showColocDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {showColocDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-2"
                  >
                    {colocations.map((coloc) => (
                      <button
                        key={coloc.id}
                        onClick={() => handleSelectColocation(coloc.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${
                          coloc.id === currentColocation.id ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                          {coloc.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-600 truncate">{coloc.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-5 overflow-y-auto">
          <ul className="flex flex-col gap-1.5">
            {navItems.map((item, index) => (
              <motion.li
                key={item.to}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </motion.li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="px-5 py-6 mt-auto border-t border-slate-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent-dark font-bold text-sm shadow-sm">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-50 border border-slate-100 hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
