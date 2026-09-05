import React, { useState, useEffect } from 'react';
import { ActiveTab, GameDatabase, Player } from './types';
import { loadGameDatabase, saveGameDatabase, DEFAULT_TABLES } from './utils/storage';
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
import { UtensilsCrossed, QrCode } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('heads-up');
  const [tableNumber, setTableNumber] = useState<string>('Table 4');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);

  // Automatic Table Query Param Detection (?table=12 or ?table=4)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get('table');
      if (tableParam) {
        const clean = tableParam.trim().replace(/^Table\s*#?/i, '');
        setTableNumber(/^[0-9]+$/.test(clean) ? `Table ${clean}` : clean);
      }
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

  const tables = db.tables && db.tables.length > 0 ? db.tables : DEFAULT_TABLES;

  const handleUpdateTables = (newTables: string[]) => {
    const updated: GameDatabase = {
      ...db,
      tables: newTables,
    };
    setDb(updated);
    saveGameDatabase(updated);
  };

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
      />

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

      {/* Restaurant Table QR Generator & Manager Modal */}
      <TableQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        currentTable={tableNumber}
        onSelectTable={(t) => setTableNumber(t)}
        tables={tables}
        setTables={handleUpdateTables}
      />

      {/* Restaurant Table Footer */}
      <footer className="bg-white border-t-4 border-[#1A1A1A] text-[#1A1A1A] py-6 mt-8 sm:mt-12 w-full overflow-x-hidden shadow-[0px_-4px_0px_0px_rgba(26,26,26,0.05)] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF5A5F] flex items-center justify-center border-2 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-[#1A1A1A] text-sm tracking-tight">BITES & GAMES</span>
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="font-black text-[#FF5A5F] hover:underline flex items-center gap-1 cursor-pointer uppercase tracking-wider text-[11px]"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Print Table Stands</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
