import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../types';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Dice6,
  RotateCcw,
  Trophy,
  Users,
  Play,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Volume2
} from 'lucide-react';

interface SnakesAndLaddersProps {
  tablePlayers?: Player[];
}

interface GamePlayer {
  id: string;
  name: string;
  color: string;
  badgeColor: string;
  position: number; // 1 to 100 (0 before start)
}

// Fixed snakes: Head -> Tail
const SNAKES: Record<number, number> = {
  98: 78,
  95: 56,
  88: 24,
  62: 19,
  48: 26,
  36: 6,
  32: 10,
};

// Fixed ladders: Bottom -> Top
const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};

const PLAYER_COLORS = [
  { color: '#FF5A5F', bg: 'bg-[#FF5A5F]', text: 'text-white', border: 'border-[#1A1A1A]' },
  { color: '#118AB2', bg: 'bg-[#118AB2]', text: 'text-white', border: 'border-[#1A1A1A]' },
  { color: '#06D6A0', bg: 'bg-[#06D6A0]', text: 'text-[#1A1A1A]', border: 'border-[#1A1A1A]' },
  { color: '#FFD166', bg: 'bg-[#FFD166]', text: 'text-[#1A1A1A]', border: 'border-[#1A1A1A]' },
];

export const SnakesAndLaddersGame: React.FC<SnakesAndLaddersProps> = ({ tablePlayers = [] }) => {
  const [numPlayers, setNumPlayers] = useState<number>(2);
  const [players, setPlayers] = useState<GamePlayer[]>([
    { id: '1', name: tablePlayers[0]?.name || 'Player 1', color: '#FF5A5F', badgeColor: 'bg-[#FF5A5F]', position: 0 },
    { id: '2', name: tablePlayers[1]?.name || 'Player 2', color: '#118AB2', badgeColor: 'bg-[#118AB2]', position: 0 },
  ]);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [winner, setWinner] = useState<GamePlayer | null>(null);
  const [gameMessage, setGameMessage] = useState<string>('Roll the dice to begin your climb to 100!');
  const [eventAlert, setEventAlert] = useState<{ type: 'snake' | 'ladder' | 'six'; text: string } | null>(null);

  // Sync player count
  const handlePlayerCountChange = (count: number) => {
    setNumPlayers(count);
    const newPlayers: GamePlayer[] = [];
    for (let i = 0; i < count; i++) {
      newPlayers.push({
        id: String(i + 1),
        name: tablePlayers[i]?.name || `Player ${i + 1}`,
        color: PLAYER_COLORS[i].color,
        badgeColor: PLAYER_COLORS[i].bg,
        position: 0,
      });
    }
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setWinner(null);
    setGameMessage(`Ready with ${count} players! Player 1 rolls first.`);
    setEventAlert(null);
  };

  // Convert cell number 1-100 to grid coordinate (0 to 9 row, 0 to 9 col)
  // Row 0 is cell 100..91 at top
  // Row 9 is cell 1..10 at bottom
  const getCellCoords = (cellNum: number) => {
    if (cellNum < 1) cellNum = 1;
    if (cellNum > 100) cellNum = 100;
    const rowFromBottom = Math.floor((cellNum - 1) / 10);
    const row = 9 - rowFromBottom;
    const colInRow = (cellNum - 1) % 10;
    const col = rowFromBottom % 2 === 0 ? colInRow : 9 - colInRow;
    return { row, col };
  };

  // Roll Dice and handle movement
  const handleRollDice = () => {
    if (isRolling || isMoving || winner) return;

    setIsRolling(true);
    sounds.playDiceRoll();
    setEventAlert(null);

    // Dice animation cycles
    let rolls = 0;
    const interval = setInterval(() => {
      const rand = Math.floor(Math.random() * 6) + 1;
      setDiceValue(rand);
      rolls++;
      if (rolls > 8) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setIsRolling(false);
        processMove(finalRoll);
      }
    }, 60);
  };

  const processMove = async (rolled: number) => {
    setIsMoving(true);
    const player = players[currentPlayerIndex];
    const startPos = player.position === 0 ? 0 : player.position;
    let targetPos = startPos + rolled;

    // Bounce back if > 100
    if (targetPos > 100) {
      targetPos = 100 - (targetPos - 100);
      setGameMessage(`${player.name} bounced off 100 back to ${targetPos}!`);
    }

    // Move step by step
    let curr = startPos;
    const stepInterval = setInterval(() => {
      if (curr < targetPos) {
        curr++;
      } else if (curr > targetPos) {
        curr--;
      }

      setPlayers((prev) =>
        prev.map((p, idx) => (idx === currentPlayerIndex ? { ...p, position: curr } : p))
      );

      if (curr === targetPos) {
        clearInterval(stepInterval);
        finishStep(targetPos, rolled);
      }
    }, 140);
  };

  const finishStep = (landedPos: number, rolled: number) => {
    const player = players[currentPlayerIndex];

    // Check ladder
    if (LADDERS[landedPos]) {
      const climbTo = LADDERS[landedPos];
      sounds.playLadderClimb();
      setEventAlert({
        type: 'ladder',
        text: `🪜 YAY! ${player.name} climbed a ladder from #${landedPos} to #${climbTo}!`,
      });
      setTimeout(() => {
        setPlayers((prev) =>
          prev.map((p, idx) => (idx === currentPlayerIndex ? { ...p, position: climbTo } : p))
        );
        checkWinOrNext(climbTo, rolled);
      }, 700);
      return;
    }

    // Check snake
    if (SNAKES[landedPos]) {
      const slideTo = SNAKES[landedPos];
      sounds.playSnakeBite();
      setEventAlert({
        type: 'snake',
        text: `🐍 OUCH! ${player.name} got bitten by a snake at #${landedPos} and slid to #${slideTo}!`,
      });
      setTimeout(() => {
        setPlayers((prev) =>
          prev.map((p, idx) => (idx === currentPlayerIndex ? { ...p, position: slideTo } : p))
        );
        checkWinOrNext(slideTo, rolled);
      }, 700);
      return;
    }

    checkWinOrNext(landedPos, rolled);
  };

  const checkWinOrNext = (finalPos: number, rolled: number) => {
    setIsMoving(false);
    const player = players[currentPlayerIndex];

    // Check win condition
    if (finalPos === 100) {
      setWinner(player);
      sounds.playFanfare();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      setGameMessage(`🏆 VICTORY! ${player.name} reached cell 100 and won!`);
      return;
    }

    // Check bonus roll on 6
    if (rolled === 6) {
      sounds.playCorrect();
      setEventAlert({
        type: 'six',
        text: `🎲 ROLLED A 6! ${player.name} gets an extra roll!`,
      });
      setGameMessage(`${player.name} rolled a 6 and gets another turn!`);
    } else {
      const nextIdx = (currentPlayerIndex + 1) % players.length;
      setCurrentPlayerIndex(nextIdx);
      setGameMessage(`Turn passed to ${players[nextIdx].name}!`);
    }
  };

  const handleResetGame = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, position: 0 })));
    setCurrentPlayerIndex(0);
    setDiceValue(null);
    setWinner(null);
    setIsRolling(false);
    setIsMoving(false);
    setEventAlert(null);
    setGameMessage('Game reset! Player 1 rolls first.');
  };

  // Render dice face dots
  const renderDiceFace = (val: number | null) => {
    if (!val) {
      return (
        <div className="flex items-center justify-center h-full text-xs font-black text-neutral-400">
          ROLL
        </div>
      );
    }
    const dotPositions: Record<number, number[][]> = {
      1: [[50, 50]],
      2: [[25, 25], [75, 75]],
      3: [[25, 25], [50, 50], [75, 75]],
      4: [[25, 25], [25, 75], [75, 25], [75, 75]],
      5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
      6: [[25, 20], [25, 50], [25, 80], [75, 20], [75, 50], [75, 80]],
    };

    const dots = dotPositions[val] || [];
    return (
      <div className="relative w-full h-full">
        {dots.map(([top, left], i) => (
          <div
            key={i}
            className="absolute w-3.5 h-3.5 rounded-full bg-[#1A1A1A] -translate-x-1/2 -translate-y-1/2 shadow-inner"
            style={{ top: `${top}%`, left: `${left}%` }}
          />
        ))}
      </div>
    );
  };

  // Generate 100 cells
  const cells = [];
  for (let r = 0; r < 10; r++) {
    const rowFromBottom = 9 - r;
    for (let c = 0; c < 10; c++) {
      const colInRow = rowFromBottom % 2 === 0 ? c : 9 - c;
      const cellNum = rowFromBottom * 10 + colInRow + 1;
      cells.push({ num: cellNum, row: r, col: c });
    }
  }

  const activePlayer = players[currentPlayerIndex];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#FF5A5F] text-white border-4 border-[#1A1A1A] rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#1A1A1A] border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5A5F]" /> FAMILY CLASSIC
          </div>
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight text-white">
            SNAKES & LADDERS
          </h2>
          <p className="text-sm font-bold text-white/90 max-w-xl">
            Take turns rolling the dice! Climb up wooden ladders to surge ahead, but watch out for sneaky snakes that slide you down!
          </p>
        </div>

        {/* Player count selector */}
        <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border-2 border-white/40">
          <span className="text-xs font-black uppercase tracking-wider text-white px-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Players:
          </span>
          {[2, 3, 4].map((cnt) => (
            <button
              key={cnt}
              onClick={() => handlePlayerCountChange(cnt)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs border-2 border-black cursor-pointer transition ${
                numPlayers === cnt
                  ? 'bg-[#FFD166] text-[#1A1A1A] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-[#1A1A1A] hover:bg-neutral-100'
              }`}
            >
              {cnt}P
            </button>
          ))}
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Board */}
        <div className="lg:col-span-8 bg-white border-4 border-[#1A1A1A] rounded-3xl p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex flex-col items-center">
          <div className="relative w-full max-w-[500px] aspect-square border-4 border-[#1A1A1A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] bg-[#FFFDF9]">
            {/* 10x10 Grid */}
            <div className="grid grid-cols-10 grid-rows-10 w-full h-full">
              {cells.map(({ num, row, col }) => {
                const isSnakeHead = Boolean(SNAKES[num]);
                const isSnakeTail = Object.values(SNAKES).includes(num);
                const isLadderBottom = Boolean(LADDERS[num]);
                const isLadderTop = Object.values(LADDERS).includes(num);
                const is100 = num === 100;
                const isEvenCell = (row + col) % 2 === 0;

                return (
                  <div
                    key={num}
                    className={`relative flex flex-col justify-between p-0.5 sm:p-1 border border-black/10 text-[9px] sm:text-xs font-black select-none ${
                      is100
                        ? 'bg-[#FFD166] text-[#1A1A1A]'
                        : isSnakeHead
                        ? 'bg-rose-100 text-rose-800'
                        : isLadderBottom
                        ? 'bg-emerald-100 text-emerald-800'
                        : isEvenCell
                        ? 'bg-[#FFF9F2]'
                        : 'bg-white'
                    }`}
                  >
                    {/* Cell Number */}
                    <span className="leading-none opacity-80">{num}</span>

                    {/* Feature indicators */}
                    <div className="flex items-center justify-center flex-1">
                      {is100 && <Trophy className="w-4 h-4 text-amber-600 animate-bounce" />}
                      {isSnakeHead && (
                        <span className="text-[12px] sm:text-[14px] leading-none filter drop-shadow">
                          🐍
                        </span>
                      )}
                      {isLadderBottom && (
                        <span className="text-[12px] sm:text-[14px] leading-none filter drop-shadow">
                          🪜
                        </span>
                      )}
                    </div>

                    {/* Tokens in this cell */}
                    <div className="absolute inset-0 flex items-center justify-center gap-0.5 pointer-events-none z-20">
                      {players.map(
                        (p, idx) =>
                          p.position === num && (
                            <div
                              key={p.id}
                              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-black flex items-center justify-center text-[9px] font-black text-white shadow-md animate-pulse"
                              style={{ backgroundColor: p.color }}
                              title={`${p.name} on #${num}`}
                            >
                              {idx + 1}
                            </div>
                          )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Legend under board */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs font-black text-[#1A1A1A]">
            <div className="flex items-center gap-1.5 bg-[#FFF9F2] px-2.5 py-1 rounded-lg border border-black">
              <span>🪜</span> Ladders: Climb Up (e.g. 28 ➔ 84)
            </div>
            <div className="flex items-center gap-1.5 bg-[#FFF9F2] px-2.5 py-1 rounded-lg border border-black">
              <span>🐍</span> Snakes: Slide Down (e.g. 88 ➔ 24)
            </div>
            <div className="flex items-center gap-1.5 bg-[#FFD166] px-2.5 py-1 rounded-lg border border-black">
              <span>🏆</span> #100: Win Condition
            </div>
          </div>
        </div>

        {/* Right Panel: Dice, Turn Control, Standings */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Player Card */}
          <div className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-black tracking-wider text-[#FF5A5F]">
                CURRENT TURN
              </span>
              <button
                onClick={handleResetGame}
                className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-lg transition"
                title="Restart Game"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Player Banner */}
            <div
              className="p-4 rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between text-white"
              style={{ backgroundColor: activePlayer.color }}
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                  Player {currentPlayerIndex + 1}
                </span>
                <h3 className="text-xl font-black">{activePlayer.name}</h3>
              </div>
              <div className="bg-white text-[#1A1A1A] px-3 py-1.5 rounded-xl border-2 border-black font-black text-sm">
                Square #{activePlayer.position || 'Start'}
              </div>
            </div>

            {/* Interactive 3D Dice Box */}
            <div className="flex flex-col items-center justify-center p-4 bg-[#FFF9F2] rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div
                className={`w-20 h-20 bg-white border-4 border-[#1A1A1A] rounded-2xl shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-2 transition-transform ${
                  isRolling ? 'animate-spin' : ''
                }`}
              >
                {renderDiceFace(diceValue)}
              </div>

              <button
                id="roll-dice-btn"
                disabled={isRolling || isMoving || Boolean(winner)}
                onClick={handleRollDice}
                className={`mt-4 w-full py-4 rounded-2xl font-black text-base border-3 border-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isRolling || isMoving || Boolean(winner)
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed border-neutral-400 shadow-none'
                    : 'bg-[#FFD166] hover:bg-[#ffc83b] text-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
                }`}
              >
                <Dice6 className="w-5 h-5 stroke-[2.5]" />
                <span>{isRolling ? 'ROLLING...' : isMoving ? 'MOVING...' : 'ROLL THE DICE!'}</span>
              </button>
            </div>

            {/* Alert Event Message */}
            {eventAlert && (
              <div
                className={`p-3 rounded-xl border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in fade-in ${
                  eventAlert.type === 'ladder'
                    ? 'bg-[#06D6A0] text-[#1A1A1A]'
                    : eventAlert.type === 'snake'
                    ? 'bg-[#FF5A5F] text-white'
                    : 'bg-[#FFD166] text-[#1A1A1A]'
                }`}
              >
                {eventAlert.text}
              </div>
            )}

            {/* Game Message */}
            <p className="text-xs text-center font-bold text-[#2D2D2D] min-h-[1.5rem]">
              {gameMessage}
            </p>
          </div>

          {/* Player Standings Leaderboard */}
          <div className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-3">
            <h4 className="text-xs font-black uppercase text-[#1A1A1A] tracking-wider flex items-center justify-between">
              <span>STANDINGS</span>
              <span className="text-[10px] text-neutral-500">GOAL: 100</span>
            </h4>

            <div className="space-y-2">
              {players.map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border-2 border-black transition ${
                    idx === currentPlayerIndex
                      ? 'bg-[#FFF9F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full border border-black"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-black text-xs text-[#1A1A1A]">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs font-black">
                    <span className="bg-black/5 px-2 py-0.5 rounded border border-black/20">
                      Cell #{p.position}
                    </span>
                    {p.position === 100 && <span>🏆</span>}
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
                WE HAVE A WINNER!
              </span>
              <h3 className="text-3xl font-black text-[#1A1A1A] italic">{winner.name} WINS!</h3>
              <p className="text-xs font-bold text-[#2D2D2D]">
                Congratulations on conquering the board, dodging the snakes, and reaching cell #100!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResetGame}
                className="flex-1 py-4 rounded-2xl bg-[#06D6A0] hover:bg-[#05b88a] text-[#1A1A1A] font-black text-sm border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
              >
                PLAY AGAIN!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
