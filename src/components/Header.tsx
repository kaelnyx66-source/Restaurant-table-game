import React, { useState } from 'react';
import { ActiveTab, GameCategory } from '../types';
import {
  Sparkles,
  Users,
  Disc3,
  PlusCircle,
  Volume2,
  VolumeX,
  UtensilsCrossed,
  Gamepad2,
  Dice6,
  Crown,
  Wind,
  CircleDot,
  QrCode,
  Star,
  ShieldCheck
} from 'lucide-react';
import { sounds } from '../utils/sound';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  tableNumber: string;
  setTableNumber: (num: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onOpenQRModal?: () => void;
  tables?: string[];
  restaurantName?: string;
  onOpenFeedbackModal?: () => void;
  onOpenAdminPortal?: () => void;
  isAdminMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  tableNumber,
  setTableNumber,
  soundEnabled,
  setSoundEnabled,
  onOpenQRModal,
  tables = [],
  restaurantName = 'BITES & GAMES',
  onOpenFeedbackModal,
  onOpenAdminPortal,
  isAdminMode = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');


  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) sounds.playCountdownTick();
  };

  const allNavItems = [
    // Party Games
    {
      id: 'heads-up' as ActiveTab,
      label: "WHAT'S ON MY HEAD?",
      shortLabel: 'Heads Up!',
      icon: Sparkles,
      badge: 'PARTY',
      category: 'party' as GameCategory,
      activeColor: 'bg-[#FFD166] text-[#1A1A1A]',
    },
    {
      id: 'imposter' as ActiveTab,
      label: 'THE IMPOSTER',
      shortLabel: 'The Imposter',
      icon: Users,
      badge: 'PARTY',
      category: 'party' as GameCategory,
      activeColor: 'bg-[#06D6A0] text-[#1A1A1A]',
    },
    {
      id: 'spin-wheel' as ActiveTab,
      label: 'WHEEL OF CHAT',
      shortLabel: 'Spin Wheel',
      icon: Disc3,
      badge: 'PARTY',
      category: 'party' as GameCategory,
      activeColor: 'bg-[#118AB2] text-white',
    },
    // Family Board Games
    {
      id: 'snakes-ladders' as ActiveTab,
      label: 'SNAKES & LADDERS',
      shortLabel: 'Snakes & Ladders',
      icon: Dice6,
      badge: 'FAMILY',
      category: 'family' as GameCategory,
      activeColor: 'bg-[#FF5A5F] text-white',
    },
    {
      id: 'chess' as ActiveTab,
      label: 'CHESS LOUNGE',
      shortLabel: 'Chess',
      icon: Crown,
      badge: 'FAMILY',
      category: 'family' as GameCategory,
      activeColor: 'bg-[#1A1A1A] text-white',
    },
    {
      id: 'ludo' as ActiveTab,
      label: 'TABLE LUDO',
      shortLabel: 'Ludo Arena',
      icon: CircleDot,
      badge: 'FAMILY',
      category: 'family' as GameCategory,
      activeColor: 'bg-[#FFD166] text-[#1A1A1A]',
    },
    // Solo Games
    {
      id: 'fruit-snake' as ActiveTab,
      label: 'FRUIT SNAKE',
      shortLabel: 'Fruit Snake',
      icon: Gamepad2,
      badge: 'SOLO',
      category: 'solo' as GameCategory,
      activeColor: 'bg-[#06D6A0] text-[#1A1A1A]',
    },
    {
      id: 'flapping-bird' as ActiveTab,
      label: 'FLAPPING BIRD',
      shortLabel: 'Flappy Bird',
      icon: Wind,
      badge: 'SOLO',
      category: 'solo' as GameCategory,
      activeColor: 'bg-[#118AB2] text-white',
    },
    // Management
    {
      id: 'manage' as ActiveTab,
      label: '+ ADD CONTENT',
      shortLabel: '+ Customizer',
      icon: PlusCircle,
      badge: 'TOOLS',
      category: 'manage' as GameCategory,
      activeColor: 'bg-[#FF5A5F] text-white',
    },
  ];

  const categories: { id: GameCategory; label: string; count: number }[] = [
    { id: 'all', label: 'All Games', count: allNavItems.length - 1 },
    { id: 'party', label: 'Party Games', count: 3 },
    { id: 'family', label: 'Family Board', count: 3 },
    { id: 'solo', label: 'Solo Arcade', count: 2 },
    { id: 'manage', label: 'Customizer', count: 1 },
  ];

  const displayedNavItems =
    selectedCategory === 'all'
      ? allNavItems
      : allNavItems.filter((item) => item.category === selectedCategory);

  const handleCategorySelect = (cat: GameCategory) => {
    setSelectedCategory(cat);
    sounds.playWheelClick();
    if (cat !== 'all') {
      const match = allNavItems.find((item) => item.category === cat);
      if (match && activeTab !== match.id) {
        setActiveTab(match.id);
      }
    }
  };

  return (
    <header className="bg-[#FFF9F2] text-[#1A1A1A] border-b-4 border-[#1A1A1A] sticky top-0 z-40 shadow-[0_4px_0_0_rgba(26,26,26,1)] w-full max-w-full overflow-hidden safe-pt">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-3 sm:py-4">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Row 1 on mobile: Logo, Title, and Sound toggle */}
          <div className="flex items-center justify-between w-full md:w-auto gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FF5A5F] rounded-2xl flex items-center justify-center border-3 border-[#1A1A1A] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] sm:shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] text-white shrink-0">
                <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-black italic tracking-tight text-[#1A1A1A] leading-tight truncate">
                  {restaurantName}
                </h1>
                <p className="text-[#FF5A5F] font-bold text-[10px] sm:text-xs uppercase tracking-wider truncate">
                  Table Entertainment Lounge
                </p>
              </div>
            </div>

            {/* Mobile Controls: Sound & Admin quick trigger */}
            <div className="flex items-center gap-1.5 md:hidden shrink-0">
              {onOpenAdminPortal && (
                <button
                  onClick={onOpenAdminPortal}
                  className={`p-2 rounded-xl border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-y-0.5 ${
                    isAdminMode ? 'bg-[#06D6A0] text-[#1A1A1A]' : 'bg-white text-neutral-700'
                  }`}
                  title="Restaurant Admin Portal"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}

              <button
                id="mobile-sound-toggle"
                onClick={toggleSound}
                className="p-2 rounded-xl bg-[#FFD166] text-[#1A1A1A] border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-y-0.5"
                aria-label="Toggle Sound"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <VolumeX className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>

          {/* Row 2 on mobile: Table Selector, Review button, QR Button, and PWA Install */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:hidden w-full pt-1 border-t border-black/10">
            {/* Mobile Table Selector */}
            <div className="flex-1 bg-white px-2 py-1.5 rounded-xl border-2 border-[#1A1A1A] font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between min-w-0">
              <span className="text-[10px] uppercase text-[#FF5A5F] font-black mr-1 shrink-0">TABLE:</span>
              <select
                value={tables.includes(tableNumber) ? tableNumber : ''}
                onChange={(e) => {
                  if (e.target.value === '__manage__') {
                    onOpenQRModal?.();
                  } else if (e.target.value) {
                    setTableNumber(e.target.value);
                  }
                }}
                className="bg-transparent text-[#1A1A1A] font-black text-xs outline-none cursor-pointer w-full text-right"
              >
                {!tables.includes(tableNumber) && (
                  <option value="">{tableNumber}</option>
                )}
                {tables.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="__manage__">+ Manage...</option>
              </select>
            </div>

            {/* Customer Review Button on Mobile */}
            {onOpenFeedbackModal && (
              <button
                onClick={onOpenFeedbackModal}
                className="px-2.5 py-1.5 rounded-xl bg-[#FFD166] text-[#1A1A1A] border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer shrink-0 flex items-center gap-1 active:translate-y-0.5"
                title="Leave Review or Alert Manager"
              >
                <Star className="w-3.5 h-3.5 fill-[#1A1A1A] text-[#1A1A1A]" />
                <span className="text-[11px] font-black">Review</span>
              </button>
            )}

            {/* QR Modal Trigger */}
            {onOpenQRModal && (
              <button
                onClick={onOpenQRModal}
                className="px-2.5 py-1.5 rounded-xl bg-white text-[#1A1A1A] border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer shrink-0 flex items-center gap-1 active:translate-y-0.5"
                title="Print Table QR"
              >
                <QrCode className="w-3.5 h-3.5 text-[#FF5A5F]" />
                <span className="text-[11px] font-black">QR</span>
              </button>
            )}

            {/* Install PWA Button */}
            <PWAInstallButton className="shrink-0" />
          </div>

          {/* Table ID, Review Button, Admin Portal, QR Maker, Install PWA, and Sound on Desktop */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Customer Review Button */}
            {onOpenFeedbackModal && (
              <button
                onClick={onOpenFeedbackModal}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#FFD166] hover:bg-[#ffc847] border-3 border-black text-xs font-black text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] transition cursor-pointer"
                title="Leave feedback or complaint"
              >
                <Star className="w-4 h-4 fill-[#1A1A1A] text-[#1A1A1A]" />
                <span>FEEDBACK & REVIEWS</span>
              </button>
            )}

            {/* Admin Portal Toggle */}
            {onOpenAdminPortal && (
              <button
                onClick={onOpenAdminPortal}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border-3 border-black text-xs font-black transition cursor-pointer ${
                  isAdminMode
                    ? 'bg-[#06D6A0] text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]'
                    : 'bg-white hover:bg-neutral-50 text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]'
                }`}
                title="Restaurant Admin Portal"
              >
                <ShieldCheck className="w-4 h-4 text-[#1A1A1A]" />
                <span>{isAdminMode ? 'ADMIN ACTIVE' : 'RESTAURANT ADMIN'}</span>
              </button>
            )}

            {/* Table QR Maker Button */}
            {onOpenQRModal && (
              <button
                onClick={onOpenQRModal}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-neutral-50 border-3 border-black text-xs font-black text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] transition cursor-pointer"
                title="Generate and print QR code for this table"
              >
                <QrCode className="w-4 h-4 text-[#FF5A5F]" />
                <span>TABLE QR</span>
              </button>
            )}

            {/* In-app PWA install button */}
            <PWAInstallButton />

            {/* Desktop Table Selector Dropdown */}
            <div className="bg-white px-3 py-2 rounded-xl border-3 border-[#1A1A1A] font-black text-sm shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] flex items-center gap-2">
              <span className="text-xs uppercase text-[#FF5A5F] tracking-wider">Table:</span>
              <select
                id="desktop-table-select"
                value={tables.includes(tableNumber) ? tableNumber : ''}
                onChange={(e) => {
                  if (e.target.value === '__manage__') {
                    onOpenQRModal?.();
                  } else if (e.target.value) {
                    setTableNumber(e.target.value);
                  }
                }}
                className="bg-transparent text-[#1A1A1A] font-black text-sm outline-none cursor-pointer pr-1"
              >
                {!tables.includes(tableNumber) && (
                  <option value="">{tableNumber}</option>
                )}
                {tables.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="__manage__">+ Manage Tables...</option>
              </select>
            </div>

            <button
              id="desktop-sound-toggle"
              onClick={toggleSound}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border-3 border-black text-xs font-black text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] transition cursor-pointer"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 stroke-[2.5]" />
                  <span>AUDIO</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 stroke-[2.5]" />
                  <span>MUTED</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 mt-3 sm:mt-4 overflow-x-auto pb-1 scrollbar-none border-t-2 border-black/10 pt-2.5 overscroll-x-contain touch-pan-x">
          {categories.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border-2 border-black shrink-0 ${
                  isCatActive
                    ? 'bg-[#1A1A1A] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                    : 'bg-white text-[#1A1A1A] hover:bg-neutral-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isCatActive ? 'bg-white text-[#1A1A1A]' : 'bg-neutral-200 text-neutral-800'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Game Navigation Tabs */}
        <nav className="flex items-center gap-2 sm:gap-3 mt-2.5 sm:mt-3 overflow-x-auto pb-1 scrollbar-none overscroll-x-contain touch-pan-x">
          {displayedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  sounds.playWheelClick();
                }}
                className={`flex items-center gap-2 sm:gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap border-3 border-[#1A1A1A] cursor-pointer ${
                  isActive
                    ? `${item.activeColor} shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] -translate-y-0.5`
                    : 'bg-white text-[#1A1A1A] hover:bg-[#FFF9F2] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-0.5'
                }`}
              >
                <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full border border-black bg-white text-[#1A1A1A]">
                  {item.badge}
                </span>
                <Icon className="w-4 h-4 stroke-[2.5]" />
                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
