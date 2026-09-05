import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Gamepad2,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles
} from 'lucide-react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type FruitType = 'apple' | 'banana' | 'strawberry' | 'grapes' | 'watermelon';

interface Fruit {
  x: number;
  y: number;
  type: FruitType;
  points: number;
  symbol: string;
}

const GRID_SIZE = 20;

const FRUITS_CONFIG: { type: FruitType; points: number; symbol: string; color: string }[] = [
  { type: 'apple', points: 10, symbol: '🍎', color: '#FF5A5F' },
  { type: 'banana', points: 20, symbol: '🍌', color: '#FFD166' },
  { type: 'strawberry', points: 30, symbol: '🍓', color: '#E63946' },
  { type: 'grapes', points: 40, symbol: '🍇', color: '#7209B7' },
  { type: 'watermelon', points: 50, symbol: '🍉', color: '#06D6A0' },
];

export const FruitSnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [direction, setDirection] = useState<Direction>('UP');
  const [fruit, setFruit] = useState<Fruit>({
    x: 5,
    y: 5,
    type: 'apple',
    points: 10,
    symbol: '🍎',
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('fruit_snake_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  // Ref to hold the mutable current direction to prevent rapid double-key self collision
  const currentDirectionRef = useRef<Direction>('UP');
  const nextDirectionRef = useRef<Direction>('UP');
  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = isPlaying;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Speed intervals
  const speedMs = speed === 'slow' ? 140 : speed === 'normal' ? 100 : 70;

  // Generate random fruit not on snake body
  const spawnFruit = useCallback((currentSnake: { x: number; y: number }[]): Fruit => {
    let x = Math.floor(Math.random() * GRID_SIZE);
    let y = Math.floor(Math.random() * GRID_SIZE);

    while (currentSnake.some((segment) => segment.x === x && segment.y === y)) {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
    }

    // Weighted random fruit selection (Apples common, watermelons rare)
    const rand = Math.random();
    let selectedFruit = FRUITS_CONFIG[0];
    if (rand > 0.85) selectedFruit = FRUITS_CONFIG[4]; // Watermelon
    else if (rand > 0.7) selectedFruit = FRUITS_CONFIG[3]; // Grapes
    else if (rand > 0.5) selectedFruit = FRUITS_CONFIG[2]; // Strawberry
    else if (rand > 0.3) selectedFruit = FRUITS_CONFIG[1]; // Banana

    return {
      x,
      y,
      type: selectedFruit.type,
      points: selectedFruit.points,
      symbol: selectedFruit.symbol,
    };
  }, []);

  // Handle Direction Change
  const changeDirection = (newDir: Direction) => {
    const current = currentDirectionRef.current;
    if (
      (newDir === 'UP' && current === 'DOWN') ||
      (newDir === 'DOWN' && current === 'UP') ||
      (newDir === 'LEFT' && current === 'RIGHT') ||
      (newDir === 'RIGHT' && current === 'LEFT')
    ) {
      return;
    }
    nextDirectionRef.current = newDir;
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        changeDirection('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        changeDirection('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        changeDirection('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        changeDirection('RIGHT');
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Game Loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const timer = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const dir = nextDirectionRef.current;
        currentDirectionRef.current = dir;

        if (dir === 'UP') head.y -= 1;
        else if (dir === 'DOWN') head.y += 1;
        else if (dir === 'LEFT') head.x -= 1;
        else if (dir === 'RIGHT') head.x += 1;

        // Wall collision check
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          handleGameOver();
          return prevSnake;
        }

        // Self collision check
        if (prevSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Fruit collision check
        if (head.x === fruit.x && head.y === fruit.y) {
          sounds.playFruitEat();
          const earned = fruit.points;
          setScore((s) => {
            const nextScore = s + earned;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              localStorage.setItem('fruit_snake_high_score', String(nextScore));
            }
            return nextScore;
          });
          setFruit(spawnFruit(newSnake));
        } else {
          newSnake.pop(); // Remove tail
        }

        return newSnake;
      });
    }, speedMs);

    return () => clearInterval(timer);
  }, [isPlaying, isGameOver, fruit, speedMs, spawnFruit, highScore]);

  const handleGameOver = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    sounds.playBuzzer();
  };

  const handleRestart = () => {
    const initSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initSnake);
    setDirection('UP');
    currentDirectionRef.current = 'UP';
    nextDirectionRef.current = 'UP';
    setFruit(spawnFruit(initSnake));
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  // Render on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Background Grid
    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle checkered grid pattern
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if ((r + c) % 2 === 0) {
          ctx.fillStyle = '#FFF5EB';
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }

    // Grid outer border
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw Fruit
    ctx.font = `${cellSize * 0.8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      fruit.symbol,
      fruit.x * cellSize + cellSize / 2,
      fruit.y * cellSize + cellSize / 2 + 1
    );

    // Draw Snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;

      ctx.fillStyle = isHead ? '#06D6A0' : '#118AB2';
      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 2;

      // Rounded rect segment
      const rad = isHead ? 6 : 4;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, rad);
      ctx.fill();
      ctx.stroke();

      // Eyes on head
      if (isHead) {
        ctx.fillStyle = '#1A1A1A';
        const eyeSize = 3;
        const curDir = currentDirectionRef.current;
        let eye1X = x + 5;
        let eye1Y = y + 5;
        let eye2X = x + cellSize - 7;
        let eye2Y = y + 5;

        if (curDir === 'DOWN') {
          eye1Y = y + cellSize - 7;
          eye2Y = y + cellSize - 7;
        } else if (curDir === 'LEFT') {
          eye1X = x + 5;
          eye1Y = y + 5;
          eye2X = x + 5;
          eye2Y = y + cellSize - 7;
        } else if (curDir === 'RIGHT') {
          eye1X = x + cellSize - 7;
          eye1Y = y + 5;
          eye2X = x + cellSize - 7;
          eye2Y = y + cellSize - 7;
        }

        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [snake, fruit]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-[#06D6A0] text-[#1A1A1A] border-4 border-black rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#1A1A1A] border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Gamepad2 className="w-3.5 h-3.5 text-[#FF5A5F]" /> SOLO RETRO ARCADE
          </div>
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight">
            FRUIT HUNTER SNAKE
          </h2>
          <p className="text-sm font-bold text-[#1A1A1A]/90 max-w-xl">
            Slither around the orchard, gobble delicious fruits, rack up huge points, and don't hit the fences or your own tail!
          </p>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5 bg-white p-2 rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-xs font-black uppercase text-[#1A1A1A] px-2 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[#FF5A5F]" /> Speed:
          </span>
          {(['slow', 'normal', 'fast'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSpeed(lvl)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs border-2 border-black cursor-pointer transition ${
                speed === lvl
                  ? 'bg-[#FFD166] text-[#1A1A1A] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-neutral-100 text-[#1A1A1A] hover:bg-neutral-200'
              }`}
            >
              {lvl.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Game Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Canvas Area */}
        <div className="lg:col-span-8 flex flex-col items-center bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
          {/* Top Score Bar */}
          <div className="w-full max-w-[420px] flex items-center justify-between pb-4">
            <div className="flex items-center gap-2 bg-[#FFF9F2] px-4 py-2 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-xs font-black uppercase text-neutral-500">SCORE:</span>
              <span className="text-2xl font-black text-[#1A1A1A] font-mono">{score}</span>
            </div>

            <div className="flex items-center gap-2 bg-[#FFD166] px-4 py-2 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-black uppercase text-[#1A1A1A]">BEST:</span>
              <span className="text-2xl font-black text-[#1A1A1A] font-mono">{highScore}</span>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] border-4 border-black">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="w-full h-full block cursor-pointer"
              onClick={() => {
                if (!isPlaying && !isGameOver) setIsPlaying(true);
              }}
            />

            {/* Tap to Start Overlay */}
            {!isPlaying && !isGameOver && (
              <div
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center cursor-pointer text-white p-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#FFD166] text-[#1A1A1A] border-3 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-3 animate-pulse">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
                <h3 className="text-2xl font-black italic">TAP OR PRESS PLAY</h3>
                <p className="text-xs font-bold opacity-80 mt-1">Use Arrow Keys, WASD, or the D-Pad</p>
              </div>
            )}
          </div>

          {/* Touch D-Pad for Mobile & Easy Table Play */}
          <div className="flex flex-col items-center justify-center mt-6 gap-2">
            <button
              onClick={() => changeDirection('UP')}
              className="w-14 h-14 rounded-2xl bg-[#FFF9F2] border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center active:translate-y-1 active:shadow-none transition cursor-pointer"
            >
              <ArrowUp className="w-6 h-6 stroke-[3]" />
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeDirection('LEFT')}
                className="w-14 h-14 rounded-2xl bg-[#FFF9F2] border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center active:translate-x-1 active:shadow-none transition cursor-pointer"
              >
                <ArrowLeft className="w-6 h-6 stroke-[3]" />
              </button>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="w-14 h-14 rounded-2xl bg-[#FFD166] border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center active:translate-y-1 active:shadow-none transition cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>
              <button
                onClick={() => changeDirection('RIGHT')}
                className="w-14 h-14 rounded-2xl bg-[#FFF9F2] border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center active:-translate-x-1 active:shadow-none transition cursor-pointer"
              >
                <ArrowRight className="w-6 h-6 stroke-[3]" />
              </button>
            </div>
            <button
              onClick={() => changeDirection('DOWN')}
              className="w-14 h-14 rounded-2xl bg-[#FFF9F2] border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center active:-translate-y-1 active:shadow-none transition cursor-pointer"
            >
              <ArrowDown className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Right Panel: Fruit Values & Controls */}
        <div className="lg:col-span-4 space-y-4">
          {/* Controls Card */}
          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] space-y-4">
            <span className="text-xs uppercase font-black tracking-wider text-[#FF5A5F]">
              GAMEPLAY CONTROLS
            </span>

            <button
              onClick={() => {
                if (isGameOver) handleRestart();
                else setIsPlaying((p) => !p);
              }}
              className="w-full py-4 rounded-2xl bg-[#FFD166] hover:bg-[#ffc83b] text-[#1A1A1A] font-black text-base border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isGameOver ? (
                <>
                  <RotateCcw className="w-5 h-5" />
                  <span>PLAY AGAIN</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>PAUSE GAME</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>START SLITHERING</span>
                </>
              )}
            </button>

            <button
              onClick={handleRestart}
              className="w-full py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-[#1A1A1A] font-black text-xs border-2 border-black transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Game</span>
            </button>
          </div>

          {/* Fruit Point Values Menu */}
          <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-3">
            <h4 className="text-xs font-black uppercase text-[#1A1A1A] tracking-wider flex items-center justify-between">
              <span>ORCHARD MENU</span>
              <span className="text-[10px] text-neutral-500">POINTS</span>
            </h4>

            <div className="space-y-2">
              {FRUITS_CONFIG.map((f) => (
                <div
                  key={f.type}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF9F2] border-2 border-black"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{f.symbol}</span>
                    <span className="font-black text-xs text-[#1A1A1A] capitalize">{f.type}</span>
                  </div>
                  <span className="font-mono font-black text-xs px-2.5 py-0.5 bg-white rounded-lg border border-black text-[#1A1A1A]">
                    +{f.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-[#FF5A5F] border-4 border-black flex items-center justify-center mx-auto text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <RotateCcw className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#FF5A5F]">
                CRUNCH!
              </span>
              <h3 className="text-3xl font-black text-[#1A1A1A] italic">GAME OVER</h3>
              <p className="text-xs font-bold text-[#2D2D2D]">
                You collided with the fence or your own body!
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 py-2">
              <div className="bg-[#FFF9F2] p-3 rounded-2xl border-2 border-black flex-1">
                <span className="text-[10px] font-black uppercase text-neutral-500 block">FINAL SCORE</span>
                <span className="text-2xl font-black font-mono text-[#1A1A1A]">{score}</span>
              </div>
              <div className="bg-[#FFD166] p-3 rounded-2xl border-2 border-black flex-1">
                <span className="text-[10px] font-black uppercase text-[#1A1A1A] block">BEST SCORE</span>
                <span className="text-2xl font-black font-mono text-[#1A1A1A]">{highScore}</span>
              </div>
            </div>

            <button
              onClick={handleRestart}
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
