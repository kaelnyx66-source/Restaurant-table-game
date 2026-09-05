import React, { useState, useRef, useEffect } from 'react';
import { WheelCategory } from '../types';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Disc3,
  RotateCw,
  Utensils,
  Music,
  Film,
  Trees,
  Flame,
  HelpCircle,
  MessageCircle,
  Sparkles,
  Shuffle
} from 'lucide-react';

interface SpinWheelGameProps {
  categories: WheelCategory[];
}

export const SpinWheelGame: React.FC<SpinWheelGameProps> = ({ categories }) => {
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<WheelCategory | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [spinCount, setSpinCount] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastSoundTickAngle = useRef<number>(0);

  // Dynamic Icon resolver
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Utensils':
        return <Utensils className="w-5 h-5" />;
      case 'Music':
        return <Music className="w-5 h-5" />;
      case 'Film':
        return <Film className="w-5 h-5" />;
      case 'Trees':
        return <Trees className="w-5 h-5" />;
      case 'Flame':
        return <Flame className="w-5 h-5" />;
      default:
        return <HelpCircle className="w-5 h-5" />;
    }
  };

  // Draw the Wheel onto Canvas
  const drawWheel = (currentAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 16;

    ctx.clearRect(0, 0, width, height);

    if (categories.length === 0) return;

    const arcSize = (2 * Math.PI) / categories.length;

    // Draw outer thick black ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#1A1A1A';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#1A1A1A';
    ctx.stroke();

    // Draw segments
    categories.forEach((cat, index) => {
      const angle = currentAngle + index * arcSize;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
      ctx.closePath();
      ctx.fillStyle = cat.color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1A1A1A';
      ctx.stroke();

      // Text label on segment
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 13px system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(cat.name, radius - 24, 5);
      ctx.restore();
    });

    // Draw center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#1A1A1A';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFD166';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1A1A1A';
    ctx.stroke();
  };

  // Redraw whenever rotation changes or categories update
  useEffect(() => {
    drawWheel(rotationAngle);
  }, [rotationAngle, categories]);

  // Initial draw
  useEffect(() => {
    drawWheel(0);
  }, []);

  // Spin handler with smooth deceleration physics
  const handleSpin = () => {
    if (isSpinning || categories.length === 0) return;

    setIsSpinning(true);
    setSelectedCategory(null);
    setCurrentQuestion(null);

    // Calculate spin duration and target angle
    const extraRounds = 4 + Math.floor(Math.random() * 4); // 4 to 7 full rotations
    const randomExtraAngle = Math.random() * 2 * Math.PI;
    const totalAddedRotation = extraRounds * 2 * Math.PI + randomExtraAngle;

    const startAngle = rotationAngle;
    const targetAngle = startAngle + totalAddedRotation;
    const duration = 4000; // 4 seconds
    const startTime = performance.now();

    const animateSpin = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startAngle + totalAddedRotation * easeProgress;
      setRotationAngle(current);

      // Play tick sound when passing a segment
      const segmentAngle = (2 * Math.PI) / categories.length;
      if (Math.abs(current - lastSoundTickAngle.current) > segmentAngle * 0.8) {
        sounds.playWheelClick();
        lastSoundTickAngle.current = current;
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateSpin);
      } else {
        // Spin finished! Calculate which category the spike landed on.
        // The spike is at the TOP (angle = 3 * PI / 2, or 270 deg)
        // Normalize rotation
        const normalizedAngle = (current % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        // Spike position is at 3 * PI / 2
        const spikeAngle = (3 * Math.PI) / 2;
        let relativeAngle = (spikeAngle - normalizedAngle) % (2 * Math.PI);
        if (relativeAngle < 0) relativeAngle += 2 * Math.PI;

        const landedIndex = Math.floor(relativeAngle / segmentAngle) % categories.length;
        const landedCategory = categories[landedIndex] || categories[0];

        // Pick a communicative question from that category
        const questions = landedCategory.questions;
        const randomQ =
          questions.length > 0
            ? questions[Math.floor(Math.random() * questions.length)]
            : 'Share your favorite memory related to this category with the table!';

        setSelectedCategory(landedCategory);
        setCurrentQuestion(randomQ);
        setIsSpinning(false);
        setSpinCount((prev) => prev + 1);

        sounds.playFanfare();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    };

    animFrameRef.current = requestAnimationFrame(animateSpin);
  };

  // Get another question from the same category
  const handleAnotherQuestion = () => {
    if (!selectedCategory) return;
    const questions = selectedCategory.questions;
    if (questions.length <= 1) return;
    const others = questions.filter((q) => q !== currentQuestion);
    const nextQ = others[Math.floor(Math.random() * others.length)] || questions[0];
    setCurrentQuestion(nextQ);
    sounds.playCountdownTick();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-[#118AB2] text-white border-4 border-[#1A1A1A] rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#1A1A1A] border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Disc3 className="w-3.5 h-3.5 text-[#FF5A5F]" /> GAME 03: TABLE TALK WHEEL
            </div>
            <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight text-white">
              SPIN THE RESTAURANT WHEEL
            </h2>
            <p className="text-sm font-medium text-white/90 max-w-xl leading-relaxed">
              Take turns spinning the wheel! When the spike lands on a category, discuss and answer the question
              together. Strictly communicative — laugh, chat, and connect while waiting for your order.
            </p>
          </div>

          <button
            id="spin-wheel-btn"
            disabled={isSpinning}
            onClick={handleSpin}
            className={`w-full md:w-auto flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black text-lg border-4 border-[#1A1A1A] transition-all cursor-pointer ${
              isSpinning
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed border-neutral-400 shadow-none'
                : 'bg-[#FFD166] hover:bg-[#ffc93e] text-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
            }`}
          >
            <RotateCw className={`w-6 h-6 stroke-[2.5] ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL!'}</span>
          </button>
        </div>
      </div>

      {/* Main Wheel Stage & Communicative Question Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Wheel Display (Canvas + Spike) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] flex items-center justify-center">
            {/* The Top Spike Pointer */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-[#FF5A5F] drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" />
              <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-black -mt-1 shadow" />
            </div>

            {/* Canvas Wheel */}
            <canvas
              ref={canvasRef}
              width={380}
              height={380}
              className="w-full h-full drop-shadow-[4px_4px_0px_rgba(26,26,26,1)] cursor-pointer"
              onClick={!isSpinning ? handleSpin : undefined}
            />

            {/* Center Tap to Spin Badge */}
            {!isSpinning && !selectedCategory && (
              <button
                onClick={handleSpin}
                className="absolute z-10 w-20 h-20 rounded-full bg-white border-3 border-black text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-wider hover:scale-105 transition cursor-pointer"
              >
                <RotateCw className="w-5 h-5 mb-0.5 stroke-[2.5]" />
                <span>TAP</span>
              </button>
            )}
          </div>

          <p className="text-xs text-[#2D2D2D] font-bold mt-4 text-center">
            {isSpinning ? 'Watching the wheel turn...' : 'Tap anywhere on the wheel or the button above to spin!'}
          </p>
        </div>

        {/* Question & Conversation Panel */}
        <div className="lg:col-span-6 space-y-4">
          {selectedCategory && currentQuestion ? (
            <div className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] space-y-6">
              {/* Category Banner */}
              <div className="flex items-center justify-between">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  style={{ backgroundColor: selectedCategory.color }}
                >
                  {getCategoryIcon(selectedCategory.iconName)}
                  <span>{selectedCategory.name}</span>
                </div>
                <span className="text-xs text-[#1A1A1A] font-black bg-[#FFF9F2] px-2 py-0.5 rounded border border-black">Spin #{spinCount}</span>
              </div>

              {/* The Communicative Question */}
              <div className="space-y-3">
                <p className="text-xs font-black uppercase text-[#FF5A5F] tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 stroke-[2.5]" /> Discussion Prompt for the Table:
                </p>
                <div className="bg-[#FFF9F2] p-6 rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="text-xl sm:text-2xl font-black text-[#1A1A1A] leading-snug tracking-tight">
                    &ldquo;{currentQuestion}&rdquo;
                  </h3>
                </div>
              </div>

              {/* Communication Guidelines */}
              <div className="bg-[#FFF9F2] p-4 rounded-xl border-2 border-black space-y-2 text-xs text-[#2D2D2D] font-bold">
                <p className="font-black text-[#FF5A5F]">How to play at the table:</p>
                <p>
                  1. The player who spun the wheel answers first, then points to the next person at the table to share!
                </p>
                <p>2. Keep it fun, debate playfully, and get to know each other while your dishes are prepped!</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  id="another-question-btn"
                  onClick={handleAnotherQuestion}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-[#FFF9F2] text-[#1A1A1A] text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                >
                  <Shuffle className="w-4 h-4 stroke-[2.5]" />
                  <span>Another Question</span>
                </button>

                <button
                  id="spin-again-btn"
                  onClick={handleSpin}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#06D6A0] hover:bg-[#05b88a] text-[#1A1A1A] text-xs font-black border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
                >
                  <RotateCw className="w-4 h-4 stroke-[2.5]" />
                  <span>Next Player Spin!</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-8 text-center space-y-4 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]">
              <div className="w-16 h-16 rounded-2xl bg-[#FFD166] border-3 border-black flex items-center justify-center mx-auto text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Sparkles className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-[#1A1A1A] italic">Ready for a Conversation Spark?</h3>
                <p className="text-xs text-[#2D2D2D] font-bold max-w-sm mx-auto">
                  Give the wheel a hearty spin to see what topic lands! Categories include Food & Dining, Music,
                  Movies, Nature, Table Confessions, and Would You Rather.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={handleSpin}
                  className="px-6 py-3 rounded-xl bg-[#06D6A0] hover:bg-[#05b88a] text-[#1A1A1A] font-black text-xs border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  Spin Now!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
