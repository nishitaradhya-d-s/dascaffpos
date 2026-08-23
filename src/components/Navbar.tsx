import React from 'react';
import { 
  Receipt, 
  History, 
  FileSpreadsheet, 
  UtensilsCrossed, 
  Settings, 
  ChefHat, 
  Plus, 
  LogOut, 
  UserCheck, 
  Lock, 
  Boxes 
} from 'lucide-react';
import { CafeSettings } from '../types';

export type ActiveTab = 'pos' | 'history' | 'gst' | 'menu' | 'kot' | 'inventory';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: CafeSettings;
  openSettings: () => void;
  onNewOrder: () => void;
  todaySalesTotal: number;
  todayBillsCount: number;
  onLogout: () => void;
  isManagerUnlocked?: boolean;
  onExitManagerMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  openSettings,
  onNewOrder,
  todaySalesTotal,
  todayBillsCount,
  onLogout,
  isManagerUnlocked,
  onExitManagerMode,
}) => {
  const navItems = [
    { id: 'pos' as ActiveTab, label: 'POS Billing', icon: Receipt },
    { id: 'kot' as ActiveTab, label: 'Kitchen KOT', icon: ChefHat },
    { id: 'history' as ActiveTab, label: 'Bill Register', icon: History },
    { id: 'inventory' as ActiveTab, label: '📦 Inventory', icon: Boxes },
    { id: 'gst' as ActiveTab, label: 'GST Reports', icon: FileSpreadsheet },
    { id: 'menu' as ActiveTab, label: 'Menu & Rates', icon: UtensilsCrossed },
  ];

  return (
    <header className="bg-white text-[#2D241E] sticky top-0 z-30 shadow-xs border-b border-[#E0D7D0] shrink-0">
      {/* Top Primary Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-13 sm:h-14 flex items-center justify-between gap-2 sm:gap-3">
        {/* Zone 1: Brand Title & Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#4B3621] text-white flex items-center justify-center font-black text-sm sm:text-base tracking-wider shadow-xs font-cinzel">
            DC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base md:text-lg font-black text-[#4B3621] leading-none tracking-widest uppercase font-cinzel truncate max-w-[150px] sm:max-w-xs">
                {settings.cafeName}
              </h1>
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[10px] font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>ONLINE</span>
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-[#8B7E74] font-medium tracking-wide mt-0.5 truncate max-w-[140px] sm:max-w-xs">
              {settings.tagline || 'Al Dhawq Wal Madaaq | Taste & Refinement'}
            </p>
          </div>
        </div>

        {/* Zone 2: Desktop Navigation Links (Visible on lg screens and up) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSel = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isSel
                    ? 'bg-[#4B3621] text-white shadow-xs'
                    : 'text-[#8B7E74] hover:text-[#2D241E] hover:bg-[#F4F1EE]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Metrics */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Exit Admin Mode Button (When Unlocked) */}
          {isManagerUnlocked && onExitManagerMode && (
            <button
              type="button"
              onClick={onExitManagerMode}
              className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Lock manager mode. Next time password will be required."
            >
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden md:inline">Exit Admin</span>
              <span className="md:hidden">Lock</span>
            </button>
          )}

          {/* Today's Sales Counter (Visible on sm and up) */}
          <div className="hidden sm:flex flex-col items-end px-2.5 py-1 bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg">
            <span className="text-[9px] uppercase font-bold text-[#8B7E74] leading-none">Today Sales</span>
            <div className="text-xs font-bold font-mono text-[#4B3621] flex items-center gap-1 mt-0.5">
              <span>₹{todaySalesTotal.toFixed(0)}</span>
              <span className="text-[#8B7E74] font-normal text-[10px]">({todayBillsCount})</span>
            </div>
          </div>

          {/* New Bill Button */}
          <button
            type="button"
            onClick={onNewOrder}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white rounded-lg text-xs font-bold shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
            title="Start fresh new bill (Clears cart and focuses on bill)"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">New Bill</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={openSettings}
            className="p-1.5 sm:p-2 text-[#8B7E74] hover:text-[#2D241E] hover:bg-[#F4F1EE] rounded-lg transition-colors border border-transparent hover:border-[#E0D7D0] cursor-pointer"
            title="Cafe & Invoice Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Badge & Logout */}
          <div className="flex items-center gap-1 pl-1 border-l border-[#E0D7D0]">
            <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-[#F4F1EE] border border-[#E0D7D0] rounded-md text-[11px] font-bold text-[#4B3621]">
              <UserCheck className="w-3 h-3 text-[#4B3621]" />
              <span>DASCAFF</span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 sm:p-2 text-[#8B7E74] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Logout from POS Terminal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Zone 4: Mobile & Tablet Dedicated Navigation Bar (Always Visible on Mobile) */}
      <nav className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-[#F9F7F5] border-t border-[#E0D7D0] overflow-x-auto no-scrollbar scroll-smooth">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isSel = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-2xs ${
                isSel
                  ? 'bg-[#4B3621] text-white'
                  : 'bg-white text-[#8B7E74] hover:text-[#2D241E] border border-[#E0D7D0]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
