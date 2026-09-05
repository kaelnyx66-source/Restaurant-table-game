import React, { useState, useEffect, useMemo } from 'react';
import { ActiveTab, GameDatabase, Player, RestaurantProfile } from './types';
import { loadGameDatabase, saveGameDatabase, DEFAULT_TABLES } from './utils/storage';
import {
  getOrInitRestaurantProfile,
  DEFAULT_RESTAURANT_ID,
  INITIAL_RESTAURANT_PROFILE,
  updateRestaurantProfile
} from './utils/restaurantService';
import { Header } from './components/Header';
import { HeadsUpGame } from './components/HeadsUpGame';
import { ImposterGame } from './components/ImposterGame';
import { SpinWheelGame } from './components/SpinWheelGame';
import { SnakesAndLaddersGame } from './components/SnakesAndLaddersGame';
import { ChessGame } from './components/ChessGame';
import { LudoGame } from './components/LudoGame';
import { FruitSnakeGame } from './components/FruitSnakeGame';
import { FlappingBirdGame } from './components/FlappingBirdGame';
import { ContentManager } from './components/ContentManager';
import { TableQRModal } from './components/TableQRModal';
import { AdminPortal } from './components/AdminPortal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CustomerFeedbackModal } from './components/CustomerFeedbackModal';
import { UtensilsCrossed, QrCode, Star, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('heads-up');
  const [tableNumber, setTableNumber] = useState<string>('Table 4');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);

  // Restaurant & Admin states
  const [restaurantId, setRestaurantId] = useState<string>(DEFAULT_RESTAURANT_ID);
  const [restaurant, setRestaurant] = useState<RestaurantProfile>(INITIAL_RESTAURANT_PROFILE);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [autoNestedMessage, setAutoNestedMessage] = useState<string | null>(null);

  // Automatic Table & Restaurant Query Param Detection
  // e.g. ?restaurant=pizza-palace&table=7 or ?admin=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const resParam = params.get('restaurant');
      const tableParam = params.get('table');
      const adminParam = params.get('admin');

      const targetRes = resParam ? resParam.trim().toLowerCase() : DEFAULT_RESTAURANT_ID;
      setRestaurantId(targetRes);

      if (tableParam) {
        const clean = tableParam.trim().replace(/^Table\s*#?/i, '');
        const formattedTable = /^[0-9]+$/.test(clean) ? `Table ${clean}` : clean;
        setTableNumber(formattedTable);
        setAutoNestedMessage(`Auto-connected to Table ${clean}`);
        setTimeout(() => setAutoNestedMessage(null), 5000);
      }

      // Check session auth for Admin
      const savedAuth = sessionStorage.getItem(`bites_admin_auth_${targetRes}`);
      if (savedAuth === 'true') {
        setIsAdminLoggedIn(true);
        if (adminParam === 'true') {
          setIsAdminView(true);
        }
      } else if (adminParam === 'true') {
        setIsAdminModalOpen(true);
      }

      // Fetch restaurant profile from Firestore
      getOrInitRestaurantProfile(targetRes)
        .then((profile) => {
          if (profile) {
            setRestaurant(profile);
            // If the restaurant customized game questions, merge them into local database
            if (profile.customGameQuestions) {
              setDb((prev) => ({
                ...prev,
                ...profile.customGameQuestions,
                tables: profile.tables && profile.tables.length > 0 ? profile.tables : prev.tables,
              }));
            }
          }
        })
        .catch((err) => {
          console.warn('Could not fetch restaurant profile:', err);
        });
    }
  }, []);

  // Shared table players (Player 1, Player 2, Player 3, Player 4 default tags)
  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', name: 'Player 1', score: 0 },
    { id: 'p2', name: 'Player 2', score: 0 },
    { id: 'p3', name: 'Player 3', score: 0 },
    { id: 'p4', name: 'Player 4', score: 0 },
  ]);

  // Game content database
  const [db, setDb] = useState<GameDatabase>(() => loadGameDatabase());

  // Tables combined from DB and Restaurant profile
  const tables = useMemo(() => {
    if (restaurant.tables && restaurant.tables.length > 0) {
      return restaurant.tables;
    }
    return db.tables && db.tables.length > 0 ? db.tables : DEFAULT_TABLES;
  }, [restaurant.tables, db.tables]);

  const handleUpdateTables = (newTables: string[]) => {
    const updated: GameDatabase = {
      ...db,
      tables: newTables,
    };
    setDb(updated);
    saveGameDatabase(updated);

    // Also persist to restaurant profile if manager
    if (restaurant) {
      updateRestaurantProfile(restaurant.id, { tables: newTables })
        .then(() => {
          setRestaurant((prev) => ({ ...prev, tables: newTables }));
        })
        .catch((e) => console.warn('Failed to update restaurant tables:', e));
    }
  };

  // Sync questions updated from Admin Portal to active DB and Firestore
  const handleAdminUpdateQuestions = async (updatedQuestions: Partial<GameDatabase>) => {
    const newDb: GameDatabase = {
      ...db,
      ...updatedQuestions,
    };
    setDb(newDb);
    saveGameDatabase(newDb);

    try {
      await updateRestaurantProfile(restaurant.id, {
        customGameQuestions: {
          ...(restaurant.customGameQuestions || {}),
          ...updatedQuestions,
        },
      });
      setRestaurant((prev) => ({
        ...prev,
        customGameQuestions: {
          ...(prev.customGameQuestions || {}),
          ...updatedQuestions,
        },
      }));
    } catch (e) {
      console.error('Failed to sync custom game questions:', e);
    }
  };

  // If in Admin Portal view, render the Admin Portal
  if (isAdminView) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[#FFF9F2] text-[#1A1A1A]">
        {/* Quick Return Bar for Managers */}
        <div className="bg-[#1A1A1A] text-white px-4 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-md">
          <button
            onClick={() => setIsAdminView(false)}
            className="flex items-center gap-2 text-xs sm:text-sm font-black bg-[#FFD166] text-[#1A1A1A] px-3.5 py-1.5 rounded-xl border-2 border-black hover:bg-[#ffc842] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO TABLE VIEW ({tableNumber})</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
            <span className="hidden sm:inline">Active Restaurant:</span>
            <span className="text-[#06D6A0] font-black">{restaurant.name}</span>
          </div>
        </div>

        <AdminPortal
          restaurant={restaurant}
          setRestaurant={(updated) => setRestaurant(updated)}
          onUpdateRestaurant={(updated) => setRestaurant(updated)}
          gameDb={db}
          setGameDb={setDb}
          onUpdateQuestions={handleAdminUpdateQuestions}
          onExitAdmin={() => setIsAdminView(false)}
          onLogout={() => {
            sessionStorage.removeItem(`bites_admin_auth_${restaurant.id}`);
            setIsAdminLoggedIn(false);
            setIsAdminView(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#FFF9F2] text-[#2D2D2D] flex flex-col font-sans selection:bg-[#FFD166] selection:text-[#1A1A1A] safe-px">
      {/* Top Lounge Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenQRModal={() => setIsQRModalOpen(true)}
        tables={tables}
        restaurantName={restaurant.name}
        onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
        onOpenAdminPortal={() => {
          if (isAdminLoggedIn) {
            setIsAdminView(true);
          } else {
            setIsAdminModalOpen(true);
          }
        }}
        isAdminMode={isAdminLoggedIn}
      />

      {/* Auto-nested Notification Banner when scanning table QR */}
      {autoNestedMessage && (
        <div className="max-w-6xl mx-auto w-full px-3.5 sm:px-6 pt-3">
          <div className="bg-[#06D6A0] text-[#1A1A1A] px-4 py-2.5 rounded-xl border-3 border-[#1A1A1A] font-black text-xs flex items-center justify-between shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1A1A1A] shrink-0" />
              <span>
                {autoNestedMessage} at <strong>{restaurant.name}</strong>. No login needed! Enjoy table games & food.
              </span>
            </div>
            <button
              onClick={() => setAutoNestedMessage(null)}
              className="text-xs underline cursor-pointer ml-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Game Stage */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-8 overflow-x-hidden">
        {/* PARTY GAMES */}
        {activeTab === 'heads-up' && (
          <HeadsUpGame
            items={db.headsUpItems}
            players={players}
            setPlayers={setPlayers}
          />
        )}

        {activeTab === 'imposter' && (
          <ImposterGame
            words={db.imposterWords}
            players={players}
            setPlayers={setPlayers}
          />
        )}

        {activeTab === 'spin-wheel' && (
          <SpinWheelGame categories={db.wheelCategories} />
        )}

        {/* FAMILY BOARD GAMES */}
        {activeTab === 'snakes-ladders' && (
          <SnakesAndLaddersGame tablePlayers={players} />
        )}

        {activeTab === 'chess' && <ChessGame />}

        {activeTab === 'ludo' && <LudoGame />}

        {/* SOLO ARCADE GAMES */}
        {activeTab === 'fruit-snake' && <FruitSnakeGame />}

        {activeTab === 'flapping-bird' && <FlappingBirdGame />}

        {/* CONTENT & TABLE MANAGER */}
        {activeTab === 'manage' && (
          <ContentManager
            db={db}
            setDb={setDb}
            onOpenQRForTable={(tbl) => {
              setTableNumber(tbl);
              setIsQRModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Floating Bottom Quick Action for Reviews / Feedback on Mobile */}
      <div className="fixed bottom-4 right-4 z-40 md:hidden">
        <button
          onClick={() => setIsFeedbackModalOpen(true)}
          className="bg-[#FFD166] text-[#1A1A1A] px-4 py-2.5 rounded-full border-3 border-[#1A1A1A] font-black text-xs shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] flex items-center gap-1.5 active:translate-y-0.5 cursor-pointer"
        >
          <Star className="w-4 h-4 fill-[#1A1A1A]" />
          <span>Leave Review</span>
        </button>
      </div>

      {/* Customer Feedback & Google Review Modal */}
      <CustomerFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        restaurant={restaurant}
        tableNumber={tableNumber}
      />

      {/* Admin Login Modal for Restaurant Staff */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onLoginSuccess={(loggedRes) => {
          setRestaurant(loggedRes);
          setRestaurantId(loggedRes.id);
          setIsAdminLoggedIn(true);
          sessionStorage.setItem(`bites_admin_auth_${loggedRes.id}`, 'true');
          setIsAdminView(true);
        }}
        currentRestaurantId={restaurantId}
      />

      {/* Restaurant Table QR Generator & Manager Modal */}
      <TableQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        currentTable={tableNumber}
        onSelectTable={(t) => setTableNumber(t)}
        tables={tables}
        setTables={handleUpdateTables}
        restaurantId={restaurant.id}
      />

      {/* Restaurant Table Footer */}
      <footer className="bg-white border-t-4 border-[#1A1A1A] text-[#1A1A1A] py-6 mt-8 sm:mt-12 w-full overflow-x-hidden shadow-[0px_-4px_0px_0px_rgba(26,26,26,0.05)] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF5A5F] flex items-center justify-center border-2 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-[#1A1A1A] text-sm tracking-tight">{restaurant.name}</span>
              <span className="text-[#1A1A1A] font-bold">•</span>
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="bg-[#FFD166] hover:bg-[#ffc83b] text-[#1A1A1A] font-black px-2.5 py-0.5 rounded-full border border-black text-[11px] flex items-center gap-1 cursor-pointer transition shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                title="Click to view/print QR code for this table"
              >
                <QrCode className="w-3 h-3" />
                <span>{tableNumber} (QR)</span>
              </button>
            </div>
          </div>

          {/* Quick Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'heads-up' as ActiveTab, label: 'Heads Up!' },
              { id: 'imposter' as ActiveTab, label: 'The Imposter' },
              { id: 'spin-wheel' as ActiveTab, label: 'Spin Wheel' },
              { id: 'snakes-ladders' as ActiveTab, label: 'Snakes & Ladders' },
              { id: 'chess' as ActiveTab, label: 'Chess' },
              { id: 'ludo' as ActiveTab, label: 'Ludo' },
              { id: 'fruit-snake' as ActiveTab, label: 'Fruit Snake' },
              { id: 'flapping-bird' as ActiveTab, label: 'Flapping Bird' },
              { id: 'manage' as ActiveTab, label: '+ Customizer' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1 rounded-lg border-2 border-black font-black text-xs transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#FFD166] text-[#1A1A1A]'
                    : 'bg-white text-[#1A1A1A] hover:bg-neutral-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="font-black text-[#1A1A1A] hover:underline flex items-center gap-1 cursor-pointer uppercase tracking-wider text-[11px]"
            >
              <Star className="w-3.5 h-3.5 fill-[#FFD166] text-[#1A1A1A]" />
              <span>Review Table</span>
            </button>
            <button
              onClick={() => {
                if (isAdminLoggedIn) setIsAdminView(true);
                else setIsAdminModalOpen(true);
              }}
              className="font-black text-[#118AB2] hover:underline flex items-center gap-1 cursor-pointer uppercase tracking-wider text-[11px]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="font-black text-[#FF5A5F] hover:underline flex items-center gap-1 cursor-pointer uppercase tracking-wider text-[11px]"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Stands</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

