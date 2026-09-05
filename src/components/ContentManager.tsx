import React, { useState } from 'react';
import { GameDatabase, HeadsUpItem, ImposterWord, WheelCategory } from '../types';
import { saveGameDatabase, resetGameDatabase } from '../utils/storage';
import {
  PlusCircle,
  Trash2,
  Search,
  Sparkles,
  Users,
  Disc3,
  RotateCcw,
  Check,
  Film,
  Smile,
  Cat,
  Utensils,
  Plus,
  QrCode,
  Printer
} from 'lucide-react';
import { DEFAULT_TABLES } from '../utils/storage';

interface ContentManagerProps {
  db: GameDatabase;
  setDb: React.Dispatch<React.SetStateAction<GameDatabase>>;
  onOpenQRForTable?: (table: string) => void;
}

export const ContentManager: React.FC<ContentManagerProps> = ({ db, setDb, onOpenQRForTable }) => {
  const [subTab, setSubTab] = useState<'headsup' | 'imposter' | 'wheel' | 'tables'>('headsup');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tables State
  const [newTableText, setNewTableText] = useState<string>('');
  const currentTables = db.tables && db.tables.length > 0 ? db.tables : DEFAULT_TABLES;

  // Heads Up Form State
  const [headsupText, setHeadsupText] = useState<string>('');
  const [headsupCategory, setHeadsupCategory] = useState<'movies' | 'characters' | 'animals' | 'food' | 'custom'>('movies');
  const [headsupHint, setHeadsupHint] = useState<string>('');

  // Imposter Form State
  const [imposterWord, setImposterWord] = useState<string>('');
  const [imposterCategory, setImposterCategory] = useState<string>('Restaurant Favorites');
  const [imposterHint, setImposterHint] = useState<string>('');

  // Wheel Form State
  const [wheelCategoryId, setWheelCategoryId] = useState<string>(db.wheelCategories[0]?.id || 'wc-food');
  const [wheelQuestion, setWheelQuestion] = useState<string>('');

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Add Heads Up Item
  const handleAddHeadsUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headsupText.trim()) return;

    const newItem: HeadsUpItem = {
      id: `hu-${Date.now()}`,
      text: headsupText.trim(),
      category: headsupCategory,
      hint: headsupHint.trim() || undefined,
    };

    const updated = {
      ...db,
      headsUpItems: [newItem, ...db.headsUpItems],
    };

    setDb(updated);
    saveGameDatabase(updated);
    setHeadsupText('');
    setHeadsupHint('');
    triggerSuccess(`Added "${newItem.text}" to Heads Up!`);
  };

  // Remove Heads Up Item
  const handleRemoveHeadsUp = (id: string) => {
    const updated = {
      ...db,
      headsUpItems: db.headsUpItems.filter((item) => item.id !== id),
    };
    setDb(updated);
    saveGameDatabase(updated);
  };

  // Add Imposter Word
  const handleAddImposter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imposterWord.trim() || !imposterCategory.trim()) return;

    const newWord: ImposterWord = {
      id: `iw-${Date.now()}`,
      word: imposterWord.trim(),
      category: imposterCategory.trim(),
      hintForImposter: imposterHint.trim() || undefined,
    };

    const updated = {
      ...db,
      imposterWords: [newWord, ...db.imposterWords],
    };

    setDb(updated);
    saveGameDatabase(updated);
    setImposterWord('');
    setImposterHint('');
    triggerSuccess(`Added "${newWord.word}" to Imposter!`);
  };

  // Remove Imposter Word
  const handleRemoveImposter = (id: string) => {
    const updated = {
      ...db,
      imposterWords: db.imposterWords.filter((item) => item.id !== id),
    };
    setDb(updated);
    saveGameDatabase(updated);
  };

  // Add Wheel Question
  const handleAddWheelQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wheelQuestion.trim()) return;

    const updatedCategories = db.wheelCategories.map((cat) => {
      if (cat.id === wheelCategoryId) {
        return {
          ...cat,
          questions: [wheelQuestion.trim(), ...cat.questions],
        };
      }
      return cat;
    });

    const updated = {
      ...db,
      wheelCategories: updatedCategories,
    };

    setDb(updated);
    saveGameDatabase(updated);
    setWheelQuestion('');
    triggerSuccess('Added new discussion question to Spin the Wheel!');
  };

  // Remove Wheel Question
  const handleRemoveWheelQuestion = (catId: string, questionText: string) => {
    const updatedCategories = db.wheelCategories.map((cat) => {
      if (cat.id === catId) {
        return {
          ...cat,
          questions: cat.questions.filter((q) => q !== questionText),
        };
      }
      return cat;
    });

    const updated = {
      ...db,
      wheelCategories: updatedCategories,
    };

    setDb(updated);
    saveGameDatabase(updated);
  };

  // Add Table
  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTableText.trim();
    if (!trimmed) return;

    const formatted = /^\d+$/.test(trimmed) ? `Table ${trimmed}` : trimmed;
    if (currentTables.some((t) => t.toLowerCase() === formatted.toLowerCase())) {
      alert(`"${formatted}" is already in your tables list!`);
      return;
    }

    const updated = {
      ...db,
      tables: [...currentTables, formatted],
    };
    setDb(updated);
    saveGameDatabase(updated);
    setNewTableText('');
    triggerSuccess(`Added "${formatted}" to restaurant tables!`);
  };

  // Quick Auto-Add Next Table
  const handleAddNextTable = () => {
    let maxNum = 0;
    currentTables.forEach((t) => {
      const match = t.match(/Table\s*#?\s*(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    const nextTable = `Table ${maxNum + 1}`;
    const updated = {
      ...db,
      tables: [...currentTables, nextTable],
    };
    setDb(updated);
    saveGameDatabase(updated);
    triggerSuccess(`Added "${nextTable}"!`);
  };

  // Remove Table
  const handleRemoveTable = (tableToRemove: string) => {
    if (currentTables.length <= 1) {
      alert('You must keep at least one restaurant table.');
      return;
    }
    const updated = {
      ...db,
      tables: currentTables.filter((t) => t !== tableToRemove),
    };
    setDb(updated);
    saveGameDatabase(updated);
    triggerSuccess(`Removed "${tableToRemove}".`);
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (confirm('Reset all game words, movies, characters, and wheel questions to original restaurant defaults?')) {
      const resetDb = resetGameDatabase();
      setDb(resetDb);
      triggerSuccess('All game content reset to defaults!');
    }
  };

  // Filtered Heads Up
  const filteredHeadsUp = db.headsUpItems.filter((item) => {
    const matchesSearch =
      item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Filtered Imposter
  const filteredImposter = db.imposterWords.filter((w) => {
    return (
      w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filtered Tables
  const filteredTables = currentTables.filter((t) =>
    t.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#06D6A0] text-[#1A1A1A] border-4 border-[#1A1A1A] rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-black border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
            <PlusCircle className="w-3.5 h-3.5 text-[#FF5A5F]" /> CONTENT & TABLE MANAGER
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] italic tracking-tight">
            CUSTOMIZE RESTAURANT & GAMES
          </h2>
          <p className="text-xs sm:text-sm text-[#1A1A1A] font-bold mt-1 max-w-xl">
            Add or remove tables, custom party words, imposter vocabulary, and icebreaker questions!
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FFF9F2] text-black text-xs font-black border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          <span>Reset to Defaults</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-[#06D6A0]/30 border-3 border-black text-[#1A1A1A] px-4 py-3 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
          <Check className="w-5 h-5 text-[#06D6A0] bg-black rounded-full p-0.5 stroke-[3]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Sub tabs: Heads Up | Imposter | Spin Wheel | Tables */}
      <div className="flex flex-wrap items-center gap-2 border-b-3 border-black pb-4">
        <button
          onClick={() => {
            setSubTab('headsup');
            setSearchTerm('');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
            subTab === 'headsup'
              ? 'bg-[#FF5A5F] text-white border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white text-[#1A1A1A] border-2 border-black hover:bg-[#FFF9F2]'
          }`}
        >
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          <span>Heads Up Words ({db.headsUpItems.length})</span>
        </button>

        <button
          onClick={() => {
            setSubTab('imposter');
            setSearchTerm('');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
            subTab === 'imposter'
              ? 'bg-[#FF5A5F] text-white border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white text-[#1A1A1A] border-2 border-black hover:bg-[#FFF9F2]'
          }`}
        >
          <Users className="w-4 h-4 stroke-[2.5]" />
          <span>Imposter Words ({db.imposterWords.length})</span>
        </button>

        <button
          onClick={() => {
            setSubTab('wheel');
            setSearchTerm('');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
            subTab === 'wheel'
              ? 'bg-[#FF5A5F] text-white border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white text-[#1A1A1A] border-2 border-black hover:bg-[#FFF9F2]'
          }`}
        >
          <Disc3 className="w-4 h-4 stroke-[2.5]" />
          <span>
            Wheel Questions ({db.wheelCategories.reduce((sum, c) => sum + c.questions.length, 0)})
          </span>
        </button>

        <button
          onClick={() => {
            setSubTab('tables');
            setSearchTerm('');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
            subTab === 'tables'
              ? 'bg-[#06D6A0] text-[#1A1A1A] border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white text-[#1A1A1A] border-2 border-black hover:bg-[#FFF9F2]'
          }`}
        >
          <QrCode className="w-4 h-4 stroke-[2.5]" />
          <span>Restaurant Tables ({currentTables.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: HEADS UP (Movies, Characters, Animals, Food) */}
      {subTab === 'headsup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add New Item Form */}
          <div className="lg:col-span-5 bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-4">
            <h3 className="font-black text-sm text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2 italic">
              <Plus className="w-4 h-4 text-[#FF5A5F] stroke-[3]" />
              <span>Add Movie, Character, or Animal</span>
            </h3>

            <form onSubmit={handleAddHeadsUp} className="space-y-3">
              <div>
                <label className="block text-xs text-[#1A1A1A] font-black mb-1">Item / Name *</label>
                <input
                  type="text"
                  value={headsupText}
                  onChange={(e) => setHeadsupText(e.target.value)}
                  placeholder="e.g. Harry Potter, Kangaroo, Inception"
                  className="w-full bg-[#FFF9F2] border-2 border-black rounded-xl px-3 py-2 text-xs text-[#1A1A1A] placeholder-neutral-500 font-bold focus:border-[#FF5A5F] outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#1A1A1A] font-black mb-1">Category *</label>
                <select
                  value={headsupCategory}
                  onChange={(e) => setHeadsupCategory(e.target.value as any)}
                  className="w-full bg-[#FFF9F2] border-2 border-black rounded-xl px-3 py-2 text-xs text-[#1A1A1A] font-bold focus:border-[#FF5A5F] outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <option value="movies">🎬 Famous Movie</option>
                  <option value="characters">🦸 Iconic Character</option>
                  <option value="animals">🐾 Animal or Creature</option>
                  <option value="food">🍽️ Restaurant & Food</option>
                  <option value="custom">✨ Custom Item</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#1A1A1A] font-black mb-1">Optional Clue / Hint</label>
                <input
                  type="text"
                  value={headsupHint}
                  onChange={(e) => setHeadsupHint(e.target.value)}
                  placeholder="e.g. Wears a lightning scar"
                  className="w-full bg-[#FFF9F2] border-2 border-black rounded-xl px-3 py-2 text-xs text-[#1A1A1A] placeholder-neutral-500 font-bold focus:border-[#FF5A5F] outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#FFD166] hover:bg-[#ffc93e] text-[#1A1A1A] font-black text-xs border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
              >
                + Add To Heads Up
              </button>
            </form>
          </div>

          {/* List & Search */}
          <div className="lg:col-span-7 bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5 stroke-[2.5]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search movies, characters, animals..."
                  className="w-full bg-[#FFF9F2] border-2 border-black rounded-xl pl-9 pr-3 py-2 text-xs text-[#1A1A1A] placeholder-neutral-500 font-bold focus:border-[#FF5A5F] outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
              <span className="text-xs text-[#1A1A1A] font-black font-mono whitespace-nowrap bg-[#FFF9F2] px-2 py-1 rounded border border-black">
                {filteredHeadsUp.length} items
              </span>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredHeadsUp.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FFF9F2] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#1A1A1A]">{item.text}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#1A1A1A] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {item.category}
                      </span>
                    </div>
                    {item.hint && <p className="text-[11px] text-[#2D2D2D] font-medium">Hint: {item.hint}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveHeadsUp(item.id)}
                    className="p-1.5 text-neutral-500 hover:text-[#FF5A5F] transition cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: IMPOSTER WORDS */}
      {subTab === 'imposter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Imposter Word Form */}
          <div className="lg:col-span-5 bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-4">
            <h3 className="font-black text-sm text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2 italic">
              <Plus className="w-4 h-4 text-[#FF5A5F] stroke-[3]" />
              <span>Add Imposter Word & Category</span>
            </h3>

            <form onSubmit={handleAddImposter} className="space-y-3">
              <div>
                <label className="block text-xs text-[#1A1A1A] font-black mb-1">Secret Word *</label>
                <input
                  type="text"
                  value={imposterWord}
                  onChange={(e) => setImposterWord(e.target.value)}
                  placeholder="e.g. Pepperoni Pizza, Dolphin"
                  className="w-full bg-[#FFF9F2] border-2 border-black rounded-xl px-3 py-2 text-xs text-[#1A1A1A] placeholder-neutral-500 font-bold focus:border-[#FF5A5F] outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#1A1A1A] font-black mb-1">Topic / Category *</label>
                <input
                  type="text"
                  value={imposterCategory}
                  onChange={(e) => setImposterCategory(e.target.value)}
                  placeholder="e.g. Italian Cuisine, Ocean Animals"
                  className="w-full bg-[#FFF9F2] border-2 border-black rounded-xl px-3 py-2 text-xs text-[#1A1A1A] placeholder-neutral-500 font-bold focus:border-[#FF5A5F] outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#1A1A1A] font-black mb-1">Hint For The Imposter</label>
                <input
                  type="text"
                  value={imposterHint}
                  onChange={(e) => setImposterHint(e.target.value)}
                  placeholder="e.g. A savory baked dough specialty"
                  className="w-full bg-[#FFF9F2] border-2 border-black rounded-xl px-3 py-2 text-xs text-[#1A1A1A] placeholder-neutral-500 font-bold focus:border-[#FF5A5F] outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#FFD166] hover:bg-[#ffc93e] text-[#1A1A1A] font-black text-xs border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
              >
                + Add Secret Word
              </button>
            </form>
          </div>

          {/* Imposter Word List */}
          <div className="lg:col-span-7 bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5 stroke-[2.5]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search imposter words & categories..."
                  className="w-full bg-[#FFF9F2] border-2 border-black rounded-xl pl-9 pr-3 py-2 text-xs text-[#1A1A1A] placeholder-neutral-500 font-bold focus:border-[#FF5A5F] outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
              <span className="text-xs text-[#1A1A1A] font-black font-mono whitespace-nowrap bg-[#FFF9F2] px-2 py-1 rounded border border-black">
                {filteredImposter.length} words
              </span>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredImposter.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FFF9F2] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#1A1A1A]">{w.word}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#1A1A1A] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {w.category}
                      </span>
                    </div>
                    {w.hintForImposter && (
                      <p className="text-[11px] text-[#2D2D2D] font-medium">Imposter Clue: {w.hintForImposter}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveImposter(w.id)}
                    className="p-1.5 text-neutral-500 hover:text-[#FF5A5F] transition cursor-pointer"
                    title="Delete word"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: SPIN THE WHEEL QUESTIONS */}
      {subTab === 'wheel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Question Form */}
          <div className="lg:col-span-5 bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-4">
            <h3 className="font-black text-sm text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2 italic">
              <Plus className="w-4 h-4 text-[#FF5A5F] stroke-[3]" />
              <span>Add Communicative Question</span>
            </h3>

            <form onSubmit={handleAddWheelQuestion} className="space-y-3">
              <div>
                <label className="block text-xs text-[#1A1A1A] font-black mb-1">Wheel Category *</label>
                <select
                  value={wheelCategoryId}
                  onChange={(e) => setWheelCategoryId(e.target.value)}
                  className="w-full bg-[#FFF9F2] border-2 border-black rounded-xl px-3 py-2 text-xs text-[#1A1A1A] font-bold focus:border-[#FF5A5F] outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  {db.wheelCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#1A1A1A] font-black mb-1">
                  Table Discussion Question *
                </label>
                <textarea
                  value={wheelQuestion}
                  onChange={(e) => setWheelQuestion(e.target.value)}
                  placeholder="e.g. What is the single funniest misunderstanding you have ever experienced?"
                  rows={3}
                  className="w-full bg-[#FFF9F2] border-2 border-black rounded-xl px-3 py-2 text-xs text-[#1A1A1A] placeholder-neutral-500 font-bold focus:border-[#FF5A5F] outline-none resize-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  required
                />
                <p className="text-[11px] text-[#2D2D2D] font-bold mt-1">
                  💡 Keep questions communicative for the table to discuss aloud.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#FFD166] hover:bg-[#ffc93e] text-[#1A1A1A] font-black text-xs border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
              >
                + Add Discussion Question
              </button>
            </form>
          </div>

          {/* Wheel Categories & Questions Browser */}
          <div className="lg:col-span-7 bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-black text-[#1A1A1A] tracking-wider">
                Questions By Category
              </h4>
              <span className="text-xs text-[#1A1A1A] font-black font-mono bg-[#FFF9F2] px-2 py-1 rounded border border-black">
                {db.wheelCategories.length} categories
              </span>
            </div>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {db.wheelCategories.map((cat) => (
                <div key={cat.id} className="bg-[#FFF9F2] p-4 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2">
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full border border-black" style={{ backgroundColor: cat.color }} />
                      <span className="font-black text-sm text-[#1A1A1A]">{cat.name}</span>
                    </div>
                    <span className="text-xs text-[#1A1A1A] font-black font-mono">{cat.questions.length} prompts</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {cat.questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="flex items-start justify-between gap-3 text-xs text-[#1A1A1A] font-bold p-2.5 rounded-xl bg-white border border-black hover:bg-neutral-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <span className="flex-1 leading-relaxed">&ldquo;{q}&rdquo;</span>
                        {cat.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveWheelQuestion(cat.id, q)}
                            className="text-neutral-500 hover:text-[#FF5A5F] transition cursor-pointer"
                            title="Remove question"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: RESTAURANT TABLES (Add / Remove / Print QR) */}
      {subTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Table Form */}
          <div className="lg:col-span-5 bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2 italic">
                <Plus className="w-4 h-4 text-[#FF5A5F] stroke-[3]" />
                <span>Add Restaurant Table</span>
              </h3>
              <button
                type="button"
                onClick={handleAddNextTable}
                className="text-xs font-black text-[#118AB2] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Auto-Next #</span>
              </button>
            </div>

            <p className="text-xs text-neutral-600 font-bold">
              Add any table, bar seat, patio booth, or VIP lounge. Guests can scan the table QR code to open the game lounge on their phones.
            </p>

            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-xs text-[#1A1A1A] font-black mb-1">
                  Table Name or Number *
                </label>
                <input
                  type="text"
                  value={newTableText}
                  onChange={(e) => setNewTableText(e.target.value)}
                  placeholder="e.g. Table 9, Patio 3, Booth A, Bar 2"
                  className="w-full bg-[#FFF9F2] border-2 border-black rounded-xl px-3 py-2.5 text-xs text-[#1A1A1A] placeholder-neutral-500 font-bold focus:border-[#FF5A5F] outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  required
                />
                <p className="text-[11px] text-[#2D2D2D] font-bold mt-1">
                  💡 Typing &quot;9&quot; will automatically format as &quot;Table 9&quot;.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#06D6A0] hover:bg-[#05be8d] text-[#1A1A1A] font-black text-xs border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Table to Restaurant</span>
              </button>
            </form>
          </div>

          {/* Tables List & Actions */}
          <div className="lg:col-span-7 bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs uppercase font-black text-[#1A1A1A] tracking-wider">
                  Configured Tables
                </h4>
                <span className="text-xs text-neutral-500 font-bold">
                  {currentTables.length} total active tables
                </span>
              </div>

              {/* Search input for tables */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter tables..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FFF9F2] border-2 border-black rounded-xl font-bold outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredTables.map((tbl) => (
                <div
                  key={tbl}
                  className="bg-[#FFF9F2] p-3.5 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#FFD166] flex items-center justify-center border border-black font-black text-xs shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <span className="font-black text-sm text-[#1A1A1A] truncate">{tbl}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onOpenQRForTable && (
                      <button
                        type="button"
                        onClick={() => onOpenQRForTable(tbl)}
                        className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 border border-black text-[#1A1A1A] transition cursor-pointer"
                        title={`Generate / Print QR Stand for ${tbl}`}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveTable(tbl)}
                      className="p-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-black transition cursor-pointer"
                      title={`Remove ${tbl}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredTables.length === 0 && (
                <div className="col-span-full text-center py-8 text-neutral-500 font-bold text-xs bg-[#FFF9F2] rounded-2xl border-2 border-dashed border-neutral-300">
                  No tables match &ldquo;{searchTerm}&rdquo;
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
