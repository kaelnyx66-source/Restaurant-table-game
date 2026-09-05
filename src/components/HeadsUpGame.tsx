import React, { useState, useEffect, useRef } from 'react';
import { HeadsUpItem, Player } from '../types';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Play,
  RotateCcw,
  SkipForward,
  XCircle,
  Clock,
  Trophy,
  UserPlus,
  Trash2,
  HelpCircle,
  Film,
  Smile,
  Cat,
  Utensils,
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface HeadsUpGameProps {
  items: HeadsUpItem[];
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

export const HeadsUpGame: React.FC<HeadsUpGameProps> = ({ items, players, setPlayers }) => {
  // Game Setup States
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [selectedTimerOption, setSelectedTimerOption] = useState<number>(60); // 30, 45, 60, 90
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Game Phases: 'setup' | 'countdown' | 'playing' | 'round_end'
  const [phase, setPhase] = useState<'setup' | 'countdown' | 'playing' | 'round_end'>('setup');
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);
  const [remainingTime, setRemainingTime] = useState<number>(selectedTimerOption);
  const [currentItem, setCurrentItem] = useState<HeadsUpItem | null>(null);
  const [usedItemIds, setUsedItemIds] = useState<Set<string>>(new Set());
  const [lastRoundResult, setLastRoundResult] = useState<{
    word: string;
    category: string;
    pointsEarned: number;
    timeTaken: number;
    reason: 'guessed' | 'timeup' | 'quit';
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer options required by user: "three or four timer options"
  const timerOptions = [30, 45, 60, 90];

  const getFilteredItems = () => {
    if (selectedCategory === 'all') return items;
    return items.filter((item) => item.category === selectedCategory);
  };

  const pickRandomItem = (): HeadsUpItem | null => {
    const pool = getFilteredItems();
    if (pool.length === 0) return null;
    const available = pool.filter((item) => !usedItemIds.has(item.id));
    const targetPool = available.length > 0 ? available : pool;
    const randomIndex = Math.floor(Math.random() * targetPool.length);
    const chosen = targetPool[randomIndex];
    setUsedItemIds((prev) => new Set(prev).add(chosen.id));
    return chosen;
  };

  // Start the 3-second countdown
  const handleStartGame = () => {
    const item = pickRandomItem();
    if (!item) {
      alert('Please add more words to this category in the Manage Content tab!');
      return;
    }
    setCurrentItem(item);
    setCountdownSeconds(3);
    setPhase('countdown');
    sounds.playCountdownTick();
  };

  // 3-second countdown effect
  useEffect(() => {
    if (phase === 'countdown') {
      if (countdownSeconds > 1) {
        countdownTimerRef.current = setTimeout(() => {
          setCountdownSeconds((prev) => prev - 1);
          sounds.playCountdownTick();
        }, 1000);
      } else if (countdownSeconds === 1) {
        countdownTimerRef.current = setTimeout(() => {
          setCountdownSeconds(0);
          sounds.playStartHorn();
          setRemainingTime(selectedTimerOption);
          setPhase('playing');
        }, 1000);
      }
    }
    return () => {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, [phase, countdownSeconds, selectedTimerOption]);

  // Main game timer effect
  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            // Time is up!
            clearInterval(timerRef.current!);
            handleTimeUp();
            return 0;
          }
          if (prev <= 6) {
            sounds.playCountdownTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleTimeUp = () => {
    sounds.playBuzzer();
    const timeTaken = selectedTimerOption;
    setLastRoundResult({
      word: currentItem?.text || '',
      category: currentItem?.category || '',
      pointsEarned: 0,
      timeTaken,
      reason: 'timeup',
    });
    setPhase('round_end');
  };

  // Player taps screen anywhere -> stops timer & gets points according to time taken
  const handleTapScreenCorrect = () => {
    if (phase !== 'playing') return;
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = Math.max(1, selectedTimerOption - remainingTime);
    // Points formula: higher remaining time = more points! Minimum 50 points.
    // e.g. out of 60s, answered in 15s (remaining 45s): points = Math.round((45/60)*1000) = 750 pts
    const calculatedPoints = Math.max(50, Math.round((remainingTime / selectedTimerOption) * 1000));

    sounds.playCorrect();
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });

    // Award points to the active player
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === activePlayerIndex ? { ...p, score: p.score + calculatedPoints } : p))
    );

    setLastRoundResult({
      word: currentItem?.text || '',
      category: currentItem?.category || '',
      pointsEarned: calculatedPoints,
      timeTaken,
      reason: 'guessed',
    });

    setPhase('round_end');
  };

  // Skip button: Used if the players don't know the movie, character or animal
  const handleSkipWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playSkip();
    const nextItem = pickRandomItem();
    if (nextItem) {
      setCurrentItem(nextItem);
    }
  };

  // Quit button: For the player who is asking questions and can't get any clues and just wants to quit
  const handleQuitRound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerRef.current) clearInterval(timerRef.current);
    sounds.playBuzzer();

    const timeTaken = selectedTimerOption - remainingTime;
    setLastRoundResult({
      word: currentItem?.text || '',
      category: currentItem?.category || '',
      pointsEarned: 0,
      timeTaken,
      reason: 'quit',
    });

    setPhase('round_end');
  };

  // Add new player tag
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    setPlayers((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        name: newPlayerName.trim(),
        score: 0,
      },
    ]);
    setNewPlayerName('');
  };

  const handleRemovePlayer = (idxToRemove: number) => {
    if (players.length <= 2) {
      alert('Keep at least 2 players for Heads Up!');
      return;
    }
    setPlayers((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    if (activePlayerIndex >= players.length - 1) {
      setActivePlayerIndex(0);
    }
  };

  const handleNextTurn = () => {
    setActivePlayerIndex((prev) => (prev + 1) % players.length);
    setPhase('setup');
  };

  const activePlayer = players[activePlayerIndex] || players[0];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'movies':
        return <Film className="w-4 h-4 text-blue-400" />;
      case 'characters':
        return <Smile className="w-4 h-4 text-emerald-400" />;
      case 'animals':
        return <Cat className="w-4 h-4 text-amber-400" />;
      case 'food':
        return <Utensils className="w-4 h-4 text-rose-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
  };

  // Render 3-second Countdown Screen
  if (phase === 'countdown') {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center bg-[#FFD166] text-[#1A1A1A] p-6 sm:p-10 rounded-3xl border-4 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] relative overflow-hidden">
        <div className="relative z-10 max-w-xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#1A1A1A] border-3 border-black text-sm font-black tracking-wide shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="w-4 h-4 text-[#FF5A5F]" /> READY, {activePlayer.name.toUpperCase()}!
          </div>

          <div className="py-2">
            <span className="text-8xl sm:text-9xl font-black tracking-tighter text-[#1A1A1A] drop-shadow-[4px_4px_0px_rgba(255,255,255,1)]">
              {countdownSeconds}
            </span>
          </div>

          {/* Explicit required prompt */}
          <div className="bg-white border-4 border-[#1A1A1A] p-6 sm:p-8 rounded-3xl shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-3">
            <p className="text-xs uppercase font-black text-[#FF5A5F] tracking-wider">
              Instruction for {activePlayer.name}
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#1A1A1A] leading-snug tracking-tight">
              &ldquo;Put the phone on your head visible to the other players but you&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-[#2D2D2D] font-bold">
              Turn the screen outwards toward your table so they can see the word!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render Active Playing Screen
  if (phase === 'playing' && currentItem) {
    const progressPercent = (remainingTime / selectedTimerOption) * 100;
    const isUrgent = remainingTime <= 10;

    return (
      <div
        id="heads-up-tap-arena"
        onClick={handleTapScreenCorrect}
        className="min-h-[82vh] flex flex-col justify-between bg-[#FFD166] text-[#1A1A1A] p-4 sm:p-8 rounded-3xl border-4 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] cursor-pointer select-none relative overflow-hidden transition-colors duration-300"
      >
        {/* Top Bar: Player Turn, Category, Timer */}
        <div className="relative z-10 flex items-center justify-between gap-4 border-b-3 border-[#1A1A1A] pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-white text-[#1A1A1A] font-black text-xs sm:text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {activePlayer.name}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#06D6A0] text-[#1A1A1A] text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {getCategoryIcon(currentItem.category)}
              {currentItem.category}
            </span>
          </div>

          {/* Countdown Clock & Flip toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped((prev) => !prev);
              }}
              className="p-2 rounded-xl bg-white text-[#1A1A1A] hover:bg-[#FFF9F2] border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
              title="Flip display 180°"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            </button>
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border-3 border-black font-mono font-black text-xl sm:text-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all ${
                isUrgent
                  ? 'bg-[#FF5A5F] text-white animate-bounce'
                  : 'bg-white text-[#1A1A1A]'
              }`}
            >
              <Clock className="w-5 h-5 stroke-[2.5]" />
              <span>{remainingTime}s</span>
            </div>
          </div>
        </div>

        {/* Timer progress bar */}
        <div className="relative z-10 w-full bg-white h-4 rounded-full border-2 border-black overflow-hidden my-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isUrgent ? 'bg-[#FF5A5F]' : 'bg-[#06D6A0]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* The Word to Guess (Visible to others at the restaurant table) */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-6 text-center px-2">
          <p className="text-xs sm:text-sm font-black text-[#1A1A1A] uppercase tracking-widest mb-3 bg-white px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Other players give clues — Do NOT say the word!
          </p>

          <div className={`bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 sm:p-10 max-w-2xl w-full shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-transform duration-300 ${isFlipped ? 'rotate-180' : ''}`}>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-[#1A1A1A] tracking-tight leading-tight uppercase">
              {currentItem.text}
            </h2>
            {currentItem.hint && (
              <p className="mt-4 text-xs sm:text-sm text-[#1A1A1A] font-bold bg-[#FFD166] py-1.5 px-4 rounded-full inline-block border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Hint: {currentItem.hint}
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2 text-[#1A1A1A] text-xs sm:text-sm font-black bg-white px-4 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Maximize2 className="w-4 h-4 text-[#FF5A5F] animate-pulse stroke-[2.5]" />
            <span>Tap anywhere on screen when {activePlayer.name} guesses correctly!</span>
          </div>
        </div>

        {/* Bottom Actions: Skip Button & Quit Button */}
        <div className="relative z-20 flex items-center justify-between gap-4 pt-4 border-t-3 border-[#1A1A1A]">
          {/* Quit Button */}
          <button
            id="heads-up-quit-btn"
            type="button"
            onClick={handleQuitRound}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#FF5A5F] hover:bg-[#FFF9F2] border-3 border-black transition font-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none cursor-pointer"
          >
            <XCircle className="w-5 h-5 stroke-[2.5]" />
            <span>Quit Round (0 pts)</span>
          </button>

          {/* Skip Button */}
          <button
            id="heads-up-skip-btn"
            type="button"
            onClick={handleSkipWord}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#06D6A0] text-[#1A1A1A] hover:bg-[#05b88a] transition font-black text-sm border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none cursor-pointer"
          >
            <span>Skip Word</span>
            <SkipForward className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    );
  }

  // Render Round End / Points Summary Screen
  if (phase === 'round_end' && lastRoundResult) {
    const isSuccess = lastRoundResult.reason === 'guessed';
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center bg-white text-[#1A1A1A] p-6 sm:p-10 rounded-3xl border-4 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Success / Fail Badge */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#FFD166] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto">
            {isSuccess ? (
              <Trophy className="w-10 h-10 text-[#1A1A1A] animate-bounce stroke-[2.5]" />
            ) : (
              <XCircle className="w-10 h-10 text-[#FF5A5F] stroke-[2.5]" />
            )}
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight text-[#1A1A1A]">
              {isSuccess ? 'CORRECT ANSWER!' : lastRoundResult.reason === 'quit' ? 'ROUND QUIT' : "TIME'S UP!"}
            </h2>
            <p className="text-[#2D2D2D] font-bold text-sm mt-1">
              The secret word was <span className="bg-[#FFD166] px-2 py-0.5 rounded border border-black font-black">&ldquo;{lastRoundResult.word}&rdquo;</span>
            </p>
          </div>

          {/* Points Breakdown */}
          <div className="bg-[#FFF9F2] border-3 border-black p-6 rounded-2xl space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left">
            <div className="flex justify-between items-center text-sm font-bold text-[#2D2D2D]">
              <span>Player:</span>
              <span className="font-black text-[#1A1A1A]">{activePlayer.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-[#2D2D2D]">
              <span>Time Taken:</span>
              <span className="font-black text-[#1A1A1A]">{lastRoundResult.timeTaken} seconds</span>
            </div>
            <div className="pt-2 border-t-2 border-black flex justify-between items-center">
              <span className="text-[#1A1A1A] font-black">Points Awarded:</span>
              <span className="text-2xl font-black text-[#06D6A0] bg-white px-3 py-0.5 rounded-lg border-2 border-black">
                +{lastRoundResult.pointsEarned} pts
              </span>
            </div>
          </div>

          {/* Current Scoreboard Preview */}
          <div className="bg-white p-4 rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="text-xs uppercase tracking-wider font-black text-[#FF5A5F] mb-2 text-left">Table Standings</h4>
            <div className="space-y-1.5">
              {players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div key={p.id} className="flex justify-between text-xs py-1.5 px-3 rounded-lg bg-[#FFF9F2] border border-black font-bold">
                    <span className="text-[#1A1A1A]">
                      #{idx + 1} {p.name}
                    </span>
                    <span className="font-black text-[#1A1A1A]">{p.score} pts</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Next Turn Button */}
          <button
            id="heads-up-next-turn-btn"
            onClick={handleNextTurn}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#06D6A0] text-[#1A1A1A] hover:bg-[#05b88a] font-black text-base border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
          >
            <span>NEXT PLAYER TURN ({players[(activePlayerIndex + 1) % players.length]?.name})</span>
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    );
  }

  // Render Setup Screen
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Game Intro Banner */}
      <div className="bg-[#FFD166] border-4 border-[#1A1A1A] rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#1A1A1A] border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5A5F]" /> GAME 01: WHAT&apos;S ON MY HEAD?
            </div>
            <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight text-[#1A1A1A]">
              WHAT&apos;S ON MY HEAD?
            </h2>
            <p className="text-sm font-medium text-[#1A1A1A] max-w-xl leading-relaxed">
              Place the phone on your forehead facing your friends. Ask questions to figure out which movie, character,
              or food is on your screen before time expires!
            </p>
          </div>

          {/* Big Start Button */}
          <button
            id="heads-up-start-game-btn"
            onClick={handleStartGame}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-[#FF5A5F] hover:bg-[#fa494e] text-white font-black text-lg border-4 border-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>START GAME</span>
          </button>
        </div>
      </div>

      {/* Settings Grid: Player Tags, Timer Duration, Category */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Player Tag Selection */}
        <div className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 space-y-4 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xs text-[#FF5A5F] uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-4 h-4 stroke-[2.5]" />
              <span>Select Player</span>
            </h3>
            <span className="bg-[#FFF9F2] px-2.5 py-0.5 rounded-full border border-black text-[11px] font-black">{players.length} Players</span>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1 flex-1">
            {players.map((player, idx) => {
              const isSelected = activePlayerIndex === idx;
              return (
                <div
                  key={player.id}
                  onClick={() => setActivePlayerIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border-2 border-black cursor-pointer transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                    isSelected
                      ? 'bg-[#FFD166] text-[#1A1A1A]'
                      : 'bg-[#FFF9F2] text-[#1A1A1A] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 border-black ${
                        isSelected ? 'bg-black text-white' : 'bg-white text-black'
                      }`}
                    >
                      P{idx + 1}
                    </div>
                    <span className="text-sm font-black">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-[#1A1A1A] bg-white px-2 py-0.5 rounded border border-black">{player.score} pts</span>
                    {players.length > 2 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePlayer(idx);
                        }}
                        className="p-1 hover:text-[#FF5A5F] text-[#1A1A1A] transition"
                        title="Remove Player"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Tag Form */}
          <form onSubmit={handleAddPlayer} className="flex gap-2 pt-3 border-t-2 border-black">
            <input
              id="heads-up-add-player-input"
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Add player tag..."
              className="flex-1 bg-[#FFF9F2] border-2 border-black rounded-xl px-3 py-2 text-xs text-[#1A1A1A] font-bold placeholder-stone-400 outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-[#06D6A0] text-[#1A1A1A] hover:bg-[#05b88a] font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>

        {/* Column 2: 3 or 4 Timer Options */}
        <div className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 space-y-4 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col">
          <h3 className="font-black text-xs text-[#FF5A5F] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 stroke-[2.5]" />
            <span>Select Timer</span>
          </h3>
          <p className="text-xs text-[#2D2D2D] font-medium">Choose countdown duration for each turn:</p>

          <div className="grid grid-cols-2 gap-2.5">
            {timerOptions.map((opt) => {
              const isSelected = selectedTimerOption === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  id={`timer-option-${opt}`}
                  onClick={() => setSelectedTimerOption(opt)}
                  className={`py-3 px-4 rounded-xl border-3 border-black text-center font-mono font-black text-base transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${
                    isSelected
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:bg-[#FFF9F2]'
                  }`}
                >
                  {opt}s
                </button>
              );
            })}
          </div>

          <div className="bg-[#FFF9F2] p-3.5 rounded-xl border-2 border-black text-[11px] text-[#2D2D2D] font-bold leading-normal mt-auto">
            💡 <strong>Scoring rule:</strong> Faster guesses win more points. If time runs out, 0 points are awarded!
          </div>
        </div>

        {/* Column 3: Category Selection */}
        <div className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 space-y-4 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col">
          <h3 className="font-black text-xs text-[#FF5A5F] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>Word Category</span>
          </h3>
          <p className="text-xs text-[#2D2D2D] font-medium">Pick what words will appear:</p>

          <div className="space-y-2">
            {[
              { id: 'all', label: 'All Mixed (Everything)', icon: Sparkles },
              { id: 'movies', label: 'Famous Movies', icon: Film },
              { id: 'characters', label: 'Iconic Characters', icon: Smile },
              { id: 'animals', label: 'Animals & Creatures', icon: Cat },
              { id: 'food', label: 'Restaurant & Food', icon: Utensils },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  id={`cat-option-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border-2 border-black text-xs font-black transition text-left shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF5A5F] text-white'
                      : 'bg-white text-[#1A1A1A] hover:bg-[#FFF9F2]'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.5]" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
