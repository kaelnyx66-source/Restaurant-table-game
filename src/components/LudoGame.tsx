import React, { useState } from 'react';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Dice6,
  RotateCcw,
  Trophy,
  Users,
  Sparkles,
  Shield,
  CircleDot
} from 'lucide-react';

export type LudoColor = 'red' | 'green' | 'yellow' | 'blue';

interface LudoPlayer {
  id: LudoColor;
  name: string;
  colorHex: string;
  bgHex: string;
  tokens: number[]; // Step count from 0 to 57. 0 = in yard, 1 = start square, 52 = end of main track, 57 = home!
  startTrackIndex: number; // Index on 52-step main track
  tokensHome: number;
}

// Track coordinates on 15x15 grid:
// 52 common path squares around perimeter
const MAIN_TRACK_COORDS: [number, number][] = [
  // Red start & arm going right
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Going up
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  // Turn right
  [0, 7],
  // Going down Green arm
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // Turn right
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  // Turn down
  [7, 14],
  // Going left Yellow arm
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // Turn down
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  // Turn left
  [14, 7],
  // Going up Blue arm
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Turn left
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  // Turn up
  [7, 0],
];

// Colored home columns (5 steps) leading to center home:
const HOME_COLUMNS: Record<LudoColor, [number, number][]> = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
};

// Safe squares on the main track (starting squares + star squares)
const SAFE_TRACK_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

const COLOR_CONFIGS: Record<
  LudoColor,
  { name: string; hex: string; bgHex: string; startTrackIndex: number; homeCoord: [number, number] }
> = {
  red: { name: 'Red', hex: '#FF5A5F', bgHex: '#FFE5E6', startTrackIndex: 0, homeCoord: [7, 7] },
  green: { name: 'Green', hex: '#06D6A0', bgHex: '#E2FBF4', startTrackIndex: 13, homeCoord: [7, 7] },
  yellow: { name: 'Yellow', hex: '#FFD166', bgHex: '#FFF8E6', startTrackIndex: 26, homeCoord: [7, 7] },
  blue: { name: 'Blue', hex: '#118AB2', bgHex: '#E2F3F8', startTrackIndex: 39, homeCoord: [7, 7] },
};

export const LudoGame: React.FC = () => {
  const [numPlayers, setNumPlayers] = useState<number>(4);
  const [activeColors, setActiveColors] = useState<LudoColor[]>(['red', 'green', 'yellow', 'blue']);

  const createInitialPlayers = (colors: LudoColor[]): LudoPlayer[] => {
    return colors.map((col) => ({
      id: col,
      name: COLOR_CONFIGS[col].name,
      colorHex: COLOR_CONFIGS[col].hex,
      bgHex: COLOR_CONFIGS[col].bgHex,
      tokens: [0, 0, 0, 0], // all 4 in yard
      startTrackIndex: COLOR_CONFIGS[col].startTrackIndex,
      tokensHome: 0,
    }));
  };

  const [players, setPlayers] = useState<LudoPlayer[]>(() =>
    createInitialPlayers(['red', 'green', 'yellow', 'blue'])
  );
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [turnMessage, setTurnMessage] = useState<string>('Red rolls first! Roll a 6 to release a token.');
  const [movableTokenIndices, setMovableTokenIndices] = useState<number[]>([]);
  const [winner, setWinner] = useState<LudoPlayer | null>(null);

  // Switch player counts
  const handleSetPlayerCount = (count: number) => {
    let colors: LudoColor[];
    if (count === 2) {
      colors = ['red', 'yellow'];
    } else if (count === 3) {
      colors = ['red', 'green', 'yellow'];
    } else {
      colors = ['red', 'green', 'yellow', 'blue'];
    }
    setNumPlayers(count);
    setActiveColors(colors);
    setPlayers(createInitialPlayers(colors));
    setCurrentTurnIndex(0);
    setDiceRoll(null);
    setMovableTokenIndices([]);
    setWinner(null);
    setTurnMessage(`${COLOR_CONFIGS[colors[0]].name} rolls first! Roll a 6 to enter.`);
  };

  // Convert player's token step (0..57) to grid row & col
  const getTokenGridPos = (player: LudoPlayer, step: number, tokenIdx: number): [number, number] => {
    if (step === 0) {
      // Yard coordinates (4 inner circles in 6x6 yard box)
      const yardOffsets: Record<LudoColor, [number, number]> = {
        red: [1, 1],
        green: [1, 10],
        yellow: [10, 10],
        blue: [10, 1],
      };
      const [baseR, baseC] = yardOffsets[player.id];
      const positions: [number, number][] = [
        [baseR + 1, baseC + 1],
        [baseR + 1, baseC + 3],
        [baseR + 3, baseC + 1],
        [baseR + 3, baseC + 3],
      ];
      return positions[tokenIdx];
    }

    if (step >= 1 && step <= 51) {
      // Main track (52 squares loop)
      const trackIdx = (player.startTrackIndex + (step - 1)) % 52;
      return MAIN_TRACK_COORDS[trackIdx];
    }

    if (step >= 52 && step <= 56) {
      // Home runway (5 squares)
      const homeStep = step - 52;
      return HOME_COLUMNS[player.id][homeStep];
    }

    // Step 57 = Home center
    return [7, 7];
  };

  // Handle Roll Dice
  const handleRollDice = () => {
    if (isRolling || movableTokenIndices.length > 0 || winner) return;

    setIsRolling(true);
    sounds.playDiceRoll();

    let rollCount = 0;
    const interval = setInterval(() => {
      const rand = Math.floor(Math.random() * 6) + 1;
      setDiceRoll(rand);
      rollCount++;
      if (rollCount > 7) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceRoll(finalRoll);
        setIsRolling(false);
        checkMovableTokens(finalRoll);
      }
    }, 60);
  };

  // Determine which tokens can move
  const checkMovableTokens = (rolled: number) => {
    const player = players[currentTurnIndex];
    const movable: number[] = [];

    player.tokens.forEach((step, idx) => {
      // In yard: needs a 6
      if (step === 0) {
        if (rolled === 6) movable.push(idx);
      } else if (step < 57) {
        // In play: can move if doesn't overshoot 57
        if (step + rolled <= 57) {
          movable.push(idx);
        }
      }
    });

    if (movable.length === 0) {
      setTurnMessage(`No legal moves for ${player.name} with roll of ${rolled}.`);
      setTimeout(() => {
        passTurn(false);
      }, 1000);
    } else if (movable.length === 1) {
      // Auto move single eligible token
      setMovableTokenIndices(movable);
      setTimeout(() => {
        handleMoveToken(movable[0], rolled);
      }, 400);
    } else {
      setMovableTokenIndices(movable);
      setTurnMessage(`${player.name}, tap which token you want to move!`);
    }
  };

  // Move selected token
  const handleMoveToken = (tokenIdx: number, roll: number) => {
    const player = players[currentTurnIndex];
    const currentStep = player.tokens[tokenIdx];
    let newStep = currentStep;

    if (currentStep === 0 && roll === 6) {
      newStep = 1; // Enter start square!
      sounds.playScoreDing();
    } else {
      newStep = currentStep + roll;
      sounds.playChessMove();
    }

    let isHome = false;
    if (newStep === 57) {
      isHome = true;
      sounds.playLadderClimb();
    }

    // Check Capture on main track
    let capturedOpponent = false;
    let updatedPlayers = players.map((p, pIdx) => {
      if (pIdx !== currentTurnIndex) return p;
      const newTokens = [...p.tokens];
      newTokens[tokenIdx] = newStep;
      return {
        ...p,
        tokens: newTokens,
        tokensHome: isHome ? p.tokensHome + 1 : p.tokensHome,
      };
    });

    if (newStep >= 1 && newStep <= 51) {
      const landedTrackIdx = (player.startTrackIndex + (newStep - 1)) % 52;
      const isSafeSquare = SAFE_TRACK_INDICES.includes(landedTrackIdx);

      if (!isSafeSquare) {
        updatedPlayers = updatedPlayers.map((otherPlayer, otherIdx) => {
          if (otherIdx === currentTurnIndex) return otherPlayer;
          const newOtherTokens = otherPlayer.tokens.map((otherStep) => {
            if (otherStep >= 1 && otherStep <= 51) {
              const otherTrackIdx = (otherPlayer.startTrackIndex + (otherStep - 1)) % 52;
              if (otherTrackIdx === landedTrackIdx) {
                // Captured!
                capturedOpponent = true;
                sounds.playSnakeBite();
                return 0; // Send back to yard
              }
            }
            return otherStep;
          });
          return { ...otherPlayer, tokens: newOtherTokens };
        });
      }
    }

    setPlayers(updatedPlayers);
    setMovableTokenIndices([]);

    // Check Win
    const activeCurrentPlayer = updatedPlayers[currentTurnIndex];
    if (activeCurrentPlayer.tokens.every((t) => t === 57)) {
      setWinner(activeCurrentPlayer);
      sounds.playFanfare();
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
      setTurnMessage(`🏆 ${activeCurrentPlayer.name} HAS BROUGHT ALL TOKENS HOME!`);
      return;
    }

    // Bonus roll if rolled 6 or captured opponent
    const getsBonus = roll === 6 || capturedOpponent;
    if (getsBonus) {
      sounds.playCorrect();
      setTurnMessage(
        capturedOpponent
          ? `💥 CAPTURED! ${player.name} gets a bonus roll!`
          : `🎲 ROLLED A 6! ${player.name} gets another turn!`
      );
      setDiceRoll(null);
    } else {
      passTurn(false);
    }
  };

  const passTurn = (isImmediate: boolean) => {
    setMovableTokenIndices([]);
    setDiceRoll(null);
    const nextIdx = (currentTurnIndex + 1) % players.length;
    setCurrentTurnIndex(nextIdx);
    setTurnMessage(`Turn passed to ${players[nextIdx].name}!`);
  };

  const handleResetGame = () => {
    setPlayers(createInitialPlayers(activeColors));
    setCurrentTurnIndex(0);
    setDiceRoll(null);
    setMovableTokenIndices([]);
    setWinner(null);
    setTurnMessage(`${players[0].name} rolls first!`);
  };

  const activePlayer = players[currentTurnIndex];

  // Render 15x15 board cells
  const renderCell = (r: number, c: number) => {
    const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;

    // Check Yards
    const isRedYard = r < 6 && c < 6;
    const isGreenYard = r < 6 && c >= 9;
    const isYellowYard = r >= 9 && c >= 9;
    const isBlueYard = r >= 9 && c < 6;

    // Check Home Runways
    const isRedHomeRunway = r === 7 && c >= 1 && c <= 5;
    const isGreenHomeRunway = c === 7 && r >= 1 && r <= 5;
    const isYellowHomeRunway = r === 7 && c >= 9 && c <= 13;
    const isBlueHomeRunway = c === 7 && r >= 9 && r <= 13;

    // Starting squares
    const isRedStart = r === 6 && c === 1;
    const isGreenStart = r === 1 && c === 8;
    const isYellowStart = r === 8 && c === 13;
    const isBlueStart = r === 13 && c === 6;

    // Star Safe Squares
    const isStarSquare =
      (r === 6 && c === 1) ||
      (r === 2 && c === 6) ||
      (r === 1 && c === 8) ||
      (r === 6 && c === 12) ||
      (r === 8 && c === 13) ||
      (r === 12 && c === 8) ||
      (r === 13 && c === 6) ||
      (r === 8 && c === 2);

    let cellBg = 'bg-white';
    if (isRedYard) cellBg = 'bg-[#FFE5E6]';
    else if (isGreenYard) cellBg = 'bg-[#E2FBF4]';
    else if (isYellowYard) cellBg = 'bg-[#FFF8E6]';
    else if (isBlueYard) cellBg = 'bg-[#E2F3F8]';
    else if (isRedHomeRunway || isRedStart) cellBg = 'bg-[#FF5A5F]';
    else if (isGreenHomeRunway || isGreenStart) cellBg = 'bg-[#06D6A0]';
    else if (isYellowHomeRunway || isYellowStart) cellBg = 'bg-[#FFD166]';
    else if (isBlueHomeRunway || isBlueStart) cellBg = 'bg-[#118AB2]';
    else if (isCenter) cellBg = 'bg-[#FFF9F2]';

    // Find any tokens sitting on this exact cell
    const tokensHere: { player: LudoPlayer; tokenIdx: number; isMovable: boolean }[] = [];
    players.forEach((p, pIdx) => {
      p.tokens.forEach((step, tIdx) => {
        const [posR, posC] = getTokenGridPos(p, step, tIdx);
        if (posR === r && posC === c) {
          tokensHere.push({
            player: p,
            tokenIdx: tIdx,
            isMovable: pIdx === currentTurnIndex && movableTokenIndices.includes(tIdx),
          });
        }
      });
    });

    return (
      <div
        key={`${r}-${c}`}
        className={`relative flex items-center justify-center border border-black/15 text-[9px] font-black select-none ${cellBg}`}
      >
        {isStarSquare && !isCenter && (
          <span className="text-black/30 text-[10px] pointer-events-none">★</span>
        )}

        {isCenter && r === 7 && c === 7 && (
          <span className="text-sm font-black text-[#1A1A1A] pointer-events-none">HOME</span>
        )}

        {/* Tokens rendered inside this cell */}
        <div className="absolute inset-0 flex items-center justify-center flex-wrap gap-0.5 p-0.5 z-20">
          {tokensHere.map(({ player, tokenIdx, isMovable }) => (
            <button
              key={`${player.id}-${tokenIdx}`}
              disabled={!isMovable}
              onClick={() => handleMoveToken(tokenIdx, diceRoll || 1)}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-black flex items-center justify-center shadow transition-transform ${
                isMovable
                  ? 'cursor-pointer ring-3 ring-[#1A1A1A] animate-bounce scale-125 z-30'
                  : 'cursor-default'
              }`}
              style={{ backgroundColor: player.colorHex }}
              title={`${player.name} token`}
            >
              <span className="w-1 h-1 rounded-full bg-white" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-[#FFD166] text-[#1A1A1A] border-4 border-black rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#1A1A1A] border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5A5F]" /> FAMILY BOARD FAVORITE
          </div>
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight">
            TABLE LUDO ARENA
          </h2>
          <p className="text-sm font-bold text-[#1A1A1A]/80 max-w-xl">
            Roll a 6 to bring tokens out of the yard! Race clockwise along the perimeter, capture opponent pieces, and lead all four tokens into the Home triangle!
          </p>
        </div>

        {/* Players count */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-xs font-black uppercase text-[#1A1A1A] px-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Players:
          </span>
          {[2, 3, 4].map((cnt) => (
            <button
              key={cnt}
              onClick={() => handleSetPlayerCount(cnt)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs border-2 border-black cursor-pointer transition ${
                numPlayers === cnt
                  ? 'bg-[#FF5A5F] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-neutral-100 text-[#1A1A1A] hover:bg-neutral-200'
              }`}
            >
              {cnt}P
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 15x15 Ludo Board */}
        <div className="lg:col-span-8 flex flex-col items-center bg-white border-4 border-black rounded-3xl p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
          <div className="relative w-full max-w-[500px] aspect-square border-4 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] bg-white">
            <div className="grid grid-cols-15 grid-rows-15 w-full h-full">
              {Array(15)
                .fill(null)
                .map((_, r) =>
                  Array(15)
                    .fill(null)
                    .map((_, c) => renderCell(r, c))
                )}
            </div>
          </div>

          {/* Quick Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs font-black text-[#1A1A1A]">
            <div className="flex items-center gap-1.5 bg-[#FFF9F2] px-2.5 py-1 rounded-lg border border-black">
              <span>🎲 Roll 6:</span> Release token & get bonus roll!
            </div>
            <div className="flex items-center gap-1.5 bg-[#FFF9F2] px-2.5 py-1 rounded-lg border border-black">
              <span>★ Star:</span> Safe zone (no captures)
            </div>
          </div>
        </div>

        {/* Right Panel: Dice, Turn, Tokens Home Tracker */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Turn Card */}
          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-black tracking-wider text-[#FF5A5F]">
                ACTIVE TURN
              </span>
              <button
                onClick={handleResetGame}
                className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-lg transition"
                title="Reset Ludo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div
              className="p-4 rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between"
              style={{ backgroundColor: activePlayer.colorHex }}
            >
              <div className="text-white">
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                  Player {currentTurnIndex + 1}
                </span>
                <h3 className="text-2xl font-black">{activePlayer.name}</h3>
              </div>
              <div className="bg-white text-[#1A1A1A] px-3 py-1.5 rounded-xl border-2 border-black font-black text-xs">
                {activePlayer.tokensHome} / 4 Home
              </div>
            </div>

            {/* Interactive Dice */}
            <div className="flex flex-col items-center justify-center p-4 bg-[#FFF9F2] rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div
                className={`w-20 h-20 bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-4xl font-black text-[#1A1A1A] transition-transform ${
                  isRolling ? 'animate-spin' : ''
                }`}
              >
                {diceRoll || '🎲'}
              </div>

              <button
                disabled={isRolling || movableTokenIndices.length > 0 || Boolean(winner)}
                onClick={handleRollDice}
                className={`mt-4 w-full py-4 rounded-2xl font-black text-base border-3 border-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isRolling || movableTokenIndices.length > 0 || Boolean(winner)
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed border-neutral-400 shadow-none'
                    : 'bg-[#FFD166] hover:bg-[#ffc83b] text-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
                }`}
              >
                <Dice6 className="w-5 h-5 stroke-[2.5]" />
                <span>{isRolling ? 'ROLLING...' : 'ROLL THE DICE!'}</span>
              </button>
            </div>

            {/* Instruction Message */}
            <p className="text-xs text-center font-bold text-[#2D2D2D] min-h-[2rem]">
              {turnMessage}
            </p>
          </div>

          {/* Tokens Status Tracker */}
          <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-3">
            <h4 className="text-xs font-black uppercase text-[#1A1A1A] tracking-wider">
              PLAYERS & TOKENS HOME
            </h4>

            <div className="space-y-2">
              {players.map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border-2 border-black transition ${
                    idx === currentTurnIndex
                      ? 'bg-[#FFF9F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-black"
                      style={{ backgroundColor: p.colorHex }}
                    />
                    <span className="font-black text-xs text-[#1A1A1A]">{p.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {p.tokens.map((st, tIdx) => (
                      <div
                        key={tIdx}
                        className={`w-3 h-3 rounded-full border border-black ${
                          st === 57
                            ? 'bg-[#06D6A0]'
                            : st > 0
                            ? 'bg-[#FFD166]'
                            : 'bg-neutral-300'
                        }`}
                        title={st === 57 ? 'Home' : st > 0 ? `Step ${st}` : 'In Yard'}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      {winner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-[#FFD166] border-4 border-black flex items-center justify-center mx-auto text-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Trophy className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#FF5A5F]">
                LUDO CHAMPION!
              </span>
              <h3 className="text-3xl font-black text-[#1A1A1A] italic">
                {winner.name} WINS!
              </h3>
              <p className="text-xs font-bold text-[#2D2D2D]">
                All 4 tokens made it safely around the board and into the home stretch!
              </p>
            </div>

            <button
              onClick={handleResetGame}
              className="w-full py-4 rounded-2xl bg-[#06D6A0] hover:bg-[#05b88a] text-[#1A1A1A] font-black text-sm border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
            >
              PLAY AGAIN!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
