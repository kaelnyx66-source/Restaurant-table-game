import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  Trophy,
  Gamepad2,
  Sparkles,
  Medal,
  Wind
} from 'lucide-react';

interface Pipe {
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
}

export const FlappingBirdGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('flapping_bird_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Game state refs for 60fps canvas loop
  const gameStateRef = useRef({
    birdY: 200,
    birdVy: 0,
    pipes: [] as Pipe[],
    frameCount: 0,
    isPlaying: false,
    isGameOver: false,
    score: 0,
  });

  const GRAVITY = 0.38;
  const JUMP = -6.8;
  const PIPE_GAP = 125;
  const PIPE_WIDTH = 54;
  const PIPE_SPEED = 2.4;
  const BIRD_X = 75;
  const BIRD_RADIUS = 15;

  // Jump / Flap action
  const flap = () => {
    if (gameStateRef.current.isGameOver) return;

    if (!gameStateRef.current.isPlaying) {
      gameStateRef.current.isPlaying = true;
      setIsPlaying(true);
    }

    gameStateRef.current.birdVy = JUMP;
    sounds.playFlap();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const state = gameStateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // 1. UPDATE PHYSICS (if playing and not game over)
      if (state.isPlaying && !state.isGameOver) {
        state.birdVy += GRAVITY;
        state.birdY += state.birdVy;

        // Ground or ceiling collision
        if (state.birdY + BIRD_RADIUS >= height - 20) {
          state.birdY = height - 20 - BIRD_RADIUS;
          triggerGameOver();
        } else if (state.birdY - BIRD_RADIUS <= 0) {
          state.birdY = BIRD_RADIUS;
          state.birdVy = 0;
        }

        // Spawn Pipes
        state.frameCount++;
        if (state.frameCount % 90 === 0) {
          const minH = 50;
          const maxH = height - PIPE_GAP - minH - 30;
          const topHeight = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
          const bottomHeight = height - topHeight - PIPE_GAP - 20;

          state.pipes.push({
            x: width,
            topHeight,
            bottomHeight,
            passed: false,
          });
        }

        // Move Pipes & Check Collisions
        for (let i = state.pipes.length - 1; i >= 0; i--) {
          const p = state.pipes[i];
          p.x -= PIPE_SPEED;

          // Check if bird passed pipe
          if (!p.passed && p.x + PIPE_WIDTH < BIRD_X - BIRD_RADIUS) {
            p.passed = true;
            state.score++;
            setScore(state.score);
            sounds.playScoreDing();

            setHighScore((prev) => {
              if (state.score > prev) {
                localStorage.setItem('flapping_bird_high_score', String(state.score));
                return state.score;
              }
              return prev;
            });
          }

          // Check Collision with Pipe
          const birdLeft = BIRD_X - BIRD_RADIUS + 4;
          const birdRight = BIRD_X + BIRD_RADIUS - 4;
          const birdTop = state.birdY - BIRD_RADIUS + 4;
          const birdBottom = state.birdY + BIRD_RADIUS - 4;

          if (birdRight > p.x && birdLeft < p.x + PIPE_WIDTH) {
            // Check top pipe hit
            if (birdTop < p.topHeight) {
              triggerGameOver();
            }
            // Check bottom pipe hit
            if (birdBottom > height - 20 - p.bottomHeight) {
              triggerGameOver();
            }
          }

          // Remove off-screen pipes
          if (p.x + PIPE_WIDTH < -20) {
            state.pipes.splice(i, 1);
          }
        }
      }

      // 2. DRAWING
      // Sky Background
      ctx.fillStyle = '#E8F5E9';
      ctx.fillRect(0, 0, width, height);

      // Clouds & scenery
      ctx.fillStyle = '#C8E6C9';
      ctx.beginPath();
      ctx.arc(80, 100, 35, 0, Math.PI * 2);
      ctx.arc(120, 90, 45, 0, Math.PI * 2);
      ctx.arc(160, 100, 35, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(280, 140, 30, 0, Math.PI * 2);
      ctx.arc(320, 130, 40, 0, Math.PI * 2);
      ctx.arc(360, 140, 30, 0, Math.PI * 2);
      ctx.fill();

      // Draw Pipes
      state.pipes.forEach((p) => {
        // Top Pipe
        ctx.fillStyle = '#06D6A0';
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topHeight);
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 3;
        ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.topHeight);

        // Top Pipe Lip
        ctx.fillStyle = '#05b88a';
        ctx.fillRect(p.x - 4, p.topHeight - 20, PIPE_WIDTH + 8, 20);
        ctx.strokeRect(p.x - 4, p.topHeight - 20, PIPE_WIDTH + 8, 20);

        // Bottom Pipe
        const bottomY = height - 20 - p.bottomHeight;
        ctx.fillStyle = '#06D6A0';
        ctx.fillRect(p.x, bottomY, PIPE_WIDTH, p.bottomHeight);
        ctx.strokeRect(p.x, bottomY, PIPE_WIDTH, p.bottomHeight);

        // Bottom Pipe Lip
        ctx.fillStyle = '#05b88a';
        ctx.fillRect(p.x - 4, bottomY, PIPE_WIDTH + 8, 20);
        ctx.strokeRect(p.x - 4, bottomY, PIPE_WIDTH + 8, 20);
      });

      // Ground
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(0, height - 20, width, 20);
      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, height - 20, width, 20);

      // Draw Bird
      ctx.save();
      ctx.translate(BIRD_X, state.birdY);

      // Angle tilt based on velocity
      const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, state.birdVy * 0.08));
      ctx.rotate(angle);

      // Bird Body (Golden Yellow)
      ctx.fillStyle = '#FF5A5F';
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Wing
      ctx.fillStyle = '#FFD166';
      ctx.beginPath();
      ctx.ellipse(-4, 2, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Eye
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(7, -5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1A1A1A';
      ctx.beginPath();
      ctx.arc(8.5, -5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#FFD166';
      ctx.beginPath();
      ctx.moveTo(12, -2);
      ctx.lineTo(20, 2);
      ctx.lineTo(12, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const triggerGameOver = () => {
    gameStateRef.current.isGameOver = true;
    gameStateRef.current.isPlaying = false;
    setIsGameOver(true);
    setIsPlaying(false);
    sounds.playBuzzer();
  };

  const handleRestart = () => {
    gameStateRef.current = {
      birdY: 200,
      birdVy: 0,
      pipes: [],
      frameCount: 0,
      isPlaying: true,
      isGameOver: false,
      score: 0,
    };
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
    sounds.playFlap();
  };

  // Get Medal based on score
  const getMedal = (pts: number) => {
    if (pts >= 40) return { label: 'PLATINUM', color: 'bg-indigo-100 text-indigo-700', icon: '🏆' };
    if (pts >= 25) return { label: 'GOLD', color: 'bg-amber-100 text-amber-700', icon: '🥇' };
    if (pts >= 15) return { label: 'SILVER', color: 'bg-slate-200 text-slate-700', icon: '🥈' };
    if (pts >= 8) return { label: 'BRONZE', color: 'bg-amber-200 text-amber-900', icon: '🥉' };
    return null;
  };

  const currentMedal = getMedal(score);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-[#118AB2] text-white border-4 border-black rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD166] text-[#1A1A1A] border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Gamepad2 className="w-3.5 h-3.5 text-[#FF5A5F]" /> SOLO SKILL ARCADE
          </div>
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight text-white">
            FLAPPING BIRD RETRO
          </h2>
          <p className="text-sm font-bold text-white/90 max-w-xl">
            Tap or press Spacebar to flap wings, glide through green pipe gateways, and beat your restaurant high score record!
          </p>
        </div>

        {/* High Score Badge */}
        <div className="bg-white text-[#1A1A1A] px-5 py-3 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-500" />
          <div>
            <span className="text-[10px] font-black uppercase text-neutral-500 block tracking-wider">
              TABLE RECORD
            </span>
            <span className="text-2xl font-black font-mono">{highScore} PTS</span>
          </div>
        </div>
      </div>

      {/* Main Game Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Canvas Area */}
        <div className="lg:col-span-8 flex flex-col items-center bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
          {/* Top Score Bar */}
          <div className="w-full max-w-[380px] flex items-center justify-between pb-4">
            <div className="flex items-center gap-2 bg-[#FFF9F2] px-4 py-2 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-xs font-black uppercase text-neutral-500">CURRENT:</span>
              <span className="text-2xl font-black text-[#1A1A1A] font-mono">{score}</span>
            </div>

            {currentMedal && (
              <div
                className={`px-3 py-1.5 rounded-xl border-2 border-black font-black text-xs flex items-center gap-1.5 ${currentMedal.color}`}
              >
                <span>{currentMedal.icon}</span>
                <span>{currentMedal.label}</span>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div
            onClick={flap}
            className="relative w-full max-w-[380px] h-[460px] rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] border-4 border-black cursor-pointer select-none"
          >
            <canvas
              ref={canvasRef}
              width={380}
              height={460}
              className="w-full h-full block"
            />

            {/* Click to Flap Prompt if idle */}
            {!isPlaying && !isGameOver && (
              <div className="absolute inset-0 bg-black/35 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                <div className="w-16 h-16 rounded-2xl bg-[#FFD166] text-[#1A1A1A] border-3 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-3 animate-bounce">
                  <Wind className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-2xl font-black italic">TAP OR CLICK TO FLAP</h3>
                <p className="text-xs font-bold opacity-85 mt-1">Press Spacebar on desktop or tap screen</p>
              </div>
            )}
          </div>

          {/* Giant Flap Button for Easy Table Play */}
          <button
            onClick={flap}
            className="mt-6 w-full max-w-[380px] py-4 rounded-2xl bg-[#FF5A5F] hover:bg-[#e04348] text-white font-black text-base border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Wind className="w-6 h-6 stroke-[3]" />
            <span>FLAP WINGS! (TAP HERE)</span>
          </button>
        </div>

        {/* Right Panel: How to Play & Medal Tiers */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Info Box */}
          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] space-y-4">
            <span className="text-xs uppercase font-black tracking-wider text-[#FF5A5F]">
              HOW TO PLAY
            </span>

            <div className="space-y-2 text-xs font-bold text-[#2D2D2D]">
              <p>• Every tap or spacebar press gives the bird an upward flap burst.</p>
              <p>• Time your flaps to sail through the gaps between upper and lower pipes.</p>
              <p>• Hitting any pipe, roof, or floor will end your flight!</p>
            </div>

            <button
              onClick={handleRestart}
              className="w-full py-3 rounded-2xl bg-[#FFD166] hover:bg-[#ffc83b] text-[#1A1A1A] font-black text-xs border-2 border-black transition cursor-pointer flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart Run</span>
            </button>
          </div>

          {/* Medal Tiers */}
          <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-3">
            <h4 className="text-xs font-black uppercase text-[#1A1A1A] tracking-wider flex items-center justify-between">
              <span>MEDAL TIERS</span>
              <Medal className="w-4 h-4 text-amber-500" />
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-100 border-2 border-black">
                <div className="flex items-center gap-2">
                  <span>🥉</span>
                  <span className="font-black text-xs text-amber-900">Bronze Medal</span>
                </div>
                <span className="font-mono font-black text-xs">8+ pts</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-200 border-2 border-black">
                <div className="flex items-center gap-2">
                  <span>🥈</span>
                  <span className="font-black text-xs text-slate-800">Silver Medal</span>
                </div>
                <span className="font-mono font-black text-xs">15+ pts</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-200 border-2 border-black">
                <div className="flex items-center gap-2">
                  <span>🥇</span>
                  <span className="font-black text-xs text-amber-900">Gold Medal</span>
                </div>
                <span className="font-mono font-black text-xs">25+ pts</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-100 border-2 border-black">
                <div className="flex items-center gap-2">
                  <span>🏆</span>
                  <span className="font-black text-xs text-indigo-900">Platinum Star</span>
                </div>
                <span className="font-mono font-black text-xs">40+ pts</span>
              </div>
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
                BONK!
              </span>
              <h3 className="text-3xl font-black text-[#1A1A1A] italic">FLIGHT ENDED</h3>
              <p className="text-xs font-bold text-[#2D2D2D]">
                You clipped an obstacle or hit the turf!
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 py-2">
              <div className="bg-[#FFF9F2] p-3 rounded-2xl border-2 border-black flex-1">
                <span className="text-[10px] font-black uppercase text-neutral-500 block">SCORE</span>
                <span className="text-2xl font-black font-mono text-[#1A1A1A]">{score}</span>
              </div>
              <div className="bg-[#FFD166] p-3 rounded-2xl border-2 border-black flex-1">
                <span className="text-[10px] font-black uppercase text-[#1A1A1A] block">BEST</span>
                <span className="text-2xl font-black font-mono text-[#1A1A1A]">{highScore}</span>
              </div>
            </div>

            {currentMedal && (
              <div className={`p-3 rounded-2xl border-2 border-black font-black text-sm flex items-center justify-center gap-2 ${currentMedal.color}`}>
                <span>{currentMedal.icon}</span>
                <span>EARNED {currentMedal.label} MEDAL!</span>
              </div>
            )}

            <button
              onClick={handleRestart}
              className="w-full py-4 rounded-2xl bg-[#06D6A0] hover:bg-[#05b88a] text-[#1A1A1A] font-black text-sm border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
            >
              FLY AGAIN!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
