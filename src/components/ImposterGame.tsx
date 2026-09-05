import React, { useState } from 'react';
import { ImposterWord, Player } from '../types';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Users,
  Eye,
  EyeOff,
  Vote,
  Sparkles,
  HelpCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  Flame,
  UserPlus,
  Trash2,
  Clock,
  ArrowRight
} from 'lucide-react';

interface ImposterGameProps {
  words: ImposterWord[];
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

export const ImposterGame: React.FC<ImposterGameProps> = ({ words, players, setPlayers }) => {
  // Game Setup
  const [selectedWordCategory, setSelectedWordCategory] = useState<string>('all');
  const [newPlayerName, setNewPlayerName] = useState<string>('');

  // Flow Phases: 'setup' | 'pass_roles' | 'discussion' | 'pass_votes' | 'reveal'
  const [phase, setPhase] = useState<'setup' | 'pass_roles' | 'discussion' | 'pass_votes' | 'reveal'>('setup');

  // Active game states
  const [currentWord, setCurrentWord] = useState<ImposterWord | null>(null);
  const [imposterPlayerId, setImposterPlayerId] = useState<string>('');
  const [currentPassIndex, setCurrentPassIndex] = useState<number>(0);
  const [isRoleRevealed, setIsRoleRevealed] = useState<boolean>(false);

  // Voting states
  const [currentVotePassIndex, setCurrentVotePassIndex] = useState<number>(0);
  const [votes, setVotes] = useState<Record<string, string>>({}); // voterId -> suspectId
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);

  // Discussion timer
  const [discussionSeconds, setDiscussionSeconds] = useState<number>(120);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Start the game
  const handleStartGame = () => {
    if (players.length < 3) {
      alert('You need at least 3 players to play Who’s the Imposter!');
      return;
    }

    // Pick random word
    const pool =
      selectedWordCategory === 'all'
        ? words
        : words.filter((w) => w.category === selectedWordCategory);
    const chosenWord = pool[Math.floor(Math.random() * pool.length)] || words[0];

    // Pick random imposter
    const randomImposterIndex = Math.floor(Math.random() * players.length);
    const imposterId = players[randomImposterIndex].id;

    setCurrentWord(chosenWord);
    setImposterPlayerId(imposterId);
    setCurrentPassIndex(0);
    setIsRoleRevealed(false);
    setVotes({});
    setSelectedSuspect(null);
    setDiscussionSeconds(120);
    setIsTimerRunning(false);

    setPhase('pass_roles');
    sounds.playCountdownTick();
  };

  // Passing Role: Next Player
  const handleNextPlayerRole = () => {
    setIsRoleRevealed(false);
    if (currentPassIndex + 1 < players.length) {
      setCurrentPassIndex((prev) => prev + 1);
      sounds.playCountdownTick();
    } else {
      // Everyone received role! Go to discussion
      setPhase('discussion');
      setIsTimerRunning(true);
      sounds.playStartHorn();
    }
  };

  // Voting flow: cast secret vote & pass to next
  const handleConfirmVoteAndPass = () => {
    if (!selectedSuspect) return;
    const voter = players[currentVotePassIndex];
    const newVotes = { ...votes, [voter.id]: selectedSuspect };
    setVotes(newVotes);
    setSelectedSuspect(null);

    if (currentVotePassIndex + 1 < players.length) {
      setCurrentVotePassIndex((prev) => prev + 1);
      sounds.playCountdownTick();
    } else {
      // Everyone voted! Reveal!
      setPhase('reveal');
      sounds.playFanfare();

      // Check if civilians caught the imposter
      // Count votes
      const voteCounts: Record<string, number> = {};
      (Object.values(newVotes) as string[]).forEach((suspectId: string) => {
        voteCounts[suspectId] = (voteCounts[suspectId] || 0) + 1;
      });

      let highestCount = 0;
      let mostVotedId = '';
      Object.entries(voteCounts).forEach(([id, count]) => {
        if (count > highestCount) {
          highestCount = count;
          mostVotedId = id;
        }
      });

      if (mostVotedId === imposterPlayerId) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  // Helper to add player
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

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 3) {
      alert('Imposter requires at least 3 players!');
      return;
    }
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const currentRolePlayer = players[currentPassIndex];
  const isImposter = currentRolePlayer?.id === imposterPlayerId;

  const currentVoter = players[currentVotePassIndex];

  // Calculate vote totals for reveal
  const getVoteTotals = () => {
    const counts: Record<string, number> = {};
    players.forEach((p) => (counts[p.id] = 0));
    (Object.values(votes) as string[]).forEach((suspectId: string) => {
      counts[suspectId] = (counts[suspectId] || 0) + 1;
    });
    return counts;
  };

  // Phase: Pass Phone to get Role
  if (phase === 'pass_roles' && currentRolePlayer && currentWord) {
    return (
      <div className="max-w-xl mx-auto min-h-[75vh] flex flex-col justify-center bg-white text-[#1A1A1A] p-6 sm:p-8 rounded-3xl border-4 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] space-y-6 text-center">
        {/* Pass Phone Banner */}
        <div className="space-y-2">
          <span className="text-xs uppercase font-black tracking-wider px-3 py-1 rounded-full bg-[#FFD166] text-[#1A1A1A] border-2 border-black inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Step 1: Role Distribution ({currentPassIndex + 1}/{players.length})
          </span>
          <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight text-[#1A1A1A]">
            Pass phone to <span className="bg-[#FFD166] px-2 py-0.5 rounded border-2 border-black">{currentRolePlayer.name}</span>
          </h2>
          <p className="text-xs text-[#2D2D2D] font-bold">
            Make sure no other players are looking at the screen before revealing your secret role!
          </p>
        </div>

        {/* Card for Reveal */}
        <div className="bg-[#FFF9F2] p-6 sm:p-8 rounded-2xl border-3 border-black min-h-[220px] flex flex-col items-center justify-center space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {!isRoleRevealed ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FFD166] border-3 border-black flex items-center justify-center mx-auto text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <EyeOff className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-sm font-black text-[#1A1A1A]">Are you {currentRolePlayer.name}?</p>
                <p className="text-xs text-[#2D2D2D] font-medium mt-1">Tap below when you are ready to view your secret</p>
              </div>
              <button
                id="reveal-role-btn"
                onClick={() => {
                  setIsRoleRevealed(true);
                  sounds.playCountdownTick();
                }}
                className="px-6 py-3 rounded-xl bg-[#FF5A5F] hover:bg-[#fa494e] text-white font-black text-sm transition border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none cursor-pointer"
              >
                Reveal Secret Role
              </button>
            </div>
          ) : (
            <div className="space-y-4 w-full">
              {isImposter ? (
                <div className="space-y-3 bg-[#FF5A5F] text-white p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#FF5A5F] border-2 border-black text-xs font-black uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 stroke-[2.5]" /> Secret Identity
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
                    YOU ARE THE IMPOSTER!
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-white/90">
                    You do NOT know the secret word. Blend in and listen to other players&apos; clues!
                  </p>
                  <div className="bg-white text-[#1A1A1A] px-4 py-2 rounded-xl border-2 border-black text-xs font-black inline-block">
                    Category Clue: <strong>{currentWord.category}</strong>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-[#06D6A0] text-[#1A1A1A] p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#1A1A1A] border-2 border-black text-xs font-black uppercase tracking-wider">
                    <UserCheck className="w-4 h-4 stroke-[2.5]" /> Civilian Secret Word
                  </div>
                  <p className="text-xs text-[#1A1A1A] uppercase tracking-wider font-black">The Secret Word is:</p>
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight uppercase bg-white py-2 px-4 rounded-xl border-3 border-black inline-block">
                    {currentWord.word}
                  </h3>
                  <p className="text-xs text-[#1A1A1A] font-bold">
                    Category: <strong className="underline">{currentWord.category}</strong>
                  </p>
                </div>
              )}

              <div className="pt-4 border-t-2 border-black">
                <button
                  id="hide-and-pass-btn"
                  onClick={handleNextPlayerRole}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-black text-sm border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
                >
                  <EyeOff className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {currentPassIndex + 1 < players.length
                      ? `Hide & Pass to ${players[currentPassIndex + 1].name}`
                      : 'All Roles Assigned! Start Table Discussion'}
                  </span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Phase: Table Discussion
  if (phase === 'discussion' && currentWord) {
    return (
      <div className="max-w-2xl mx-auto min-h-[75vh] flex flex-col justify-center bg-[#06D6A0] text-[#1A1A1A] p-6 sm:p-8 rounded-3xl border-4 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] space-y-6 text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#1A1A1A] border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Flame className="w-4 h-4 text-[#FF5A5F] stroke-[2.5]" /> Step 2: Communicate & Interrogate
          </div>
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight text-[#1A1A1A]">
            FIND WHO&apos;S THE IMPOSTER!
          </h2>
          <p className="text-sm font-medium text-[#1A1A1A] max-w-lg mx-auto leading-relaxed">
            Take turns around the restaurant table asking each other questions about the secret item. Give clever
            answers without giving the word away to the imposter!
          </p>
        </div>

        {/* Discussion Advice Box */}
        <div className="bg-white p-5 rounded-2xl border-3 border-black text-left space-y-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h4 className="text-xs uppercase font-black text-[#FF5A5F] tracking-wider">Rules of Engagement:</h4>
          <ul className="text-xs sm:text-sm text-[#2D2D2D] space-y-1.5 list-disc list-inside font-bold">
            <li>Ask questions like: &ldquo;Is this something you eat with hands?&rdquo; or &ldquo;Where do you usually find this?&rdquo;</li>
            <li>Civilians: Don&apos;t be too specific or the imposter will deduce the secret word!</li>
            <li>Imposter: Bluff your way through and listen closely to other players&apos; answers.</li>
          </ul>
        </div>

        {/* Action Button: Ready to Vote */}
        <div className="space-y-3 pt-4 border-t-3 border-black">
          <button
            id="proceed-to-vote-btn"
            onClick={() => {
              setPhase('pass_votes');
              setCurrentVotePassIndex(0);
              sounds.playCountdownTick();
            }}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-[#FF5A5F] hover:bg-[#fa494e] text-white font-black text-base border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
          >
            <Vote className="w-5 h-5 stroke-[2.5]" />
            <span>Ready to Vote! Pass Phone to Vote Secretly</span>
          </button>
        </div>
      </div>
    );
  }

  // Phase: Pass Phone to Vote
  if (phase === 'pass_votes' && currentVoter) {
    const suspectChoices = players.filter((p) => p.id !== currentVoter.id);

    return (
      <div className="max-w-xl mx-auto min-h-[75vh] flex flex-col justify-center bg-white text-[#1A1A1A] p-6 sm:p-8 rounded-3xl border-4 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] space-y-6 text-center">
        <div className="space-y-2">
          <span className="text-xs uppercase font-black tracking-wider px-3 py-1 rounded-full bg-[#FFD166] text-[#1A1A1A] border-2 border-black inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Step 3: Secret Voting ({currentVotePassIndex + 1}/{players.length})
          </span>
          <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight text-[#1A1A1A]">
            Pass phone to <span className="bg-[#FFD166] px-2 py-0.5 rounded border-2 border-black">{currentVoter.name}</span>
          </h2>
          <p className="text-xs text-[#2D2D2D] font-bold">
            {currentVoter.name}, secretly cast your vote for who you believe is the Imposter:
          </p>
        </div>

        {/* Suspect Selection List */}
        <div className="bg-[#FFF9F2] p-5 rounded-2xl border-3 border-black space-y-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {suspectChoices.map((suspect) => {
            const isSelected = selectedSuspect === suspect.id;
            return (
              <button
                key={suspect.id}
                type="button"
                id={`vote-suspect-${suspect.id}`}
                onClick={() => setSelectedSuspect(suspect.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-black text-sm font-black transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  isSelected
                    ? 'bg-[#FF5A5F] text-white'
                    : 'bg-white text-[#1A1A1A] hover:bg-[#FFD166]'
                }`}
              >
                <span>{suspect.name}</span>
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-white stroke-[2.5]" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-black" />
                )}
              </button>
            );
          })}
        </div>

        {/* Submit Vote Button */}
        <button
          id="confirm-vote-btn"
          disabled={!selectedSuspect}
          onClick={handleConfirmVoteAndPass}
          className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-black text-sm border-3 border-black transition ${
            selectedSuspect
              ? 'bg-[#06D6A0] text-[#1A1A1A] hover:bg-[#05b88a] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none cursor-pointer'
              : 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed shadow-none'
          }`}
        >
          <span>
            {currentVotePassIndex + 1 < players.length
              ? `Confirm Vote & Pass to ${players[currentVotePassIndex + 1].name}`
              : 'Submit Final Vote & Reveal The Imposter!'}
          </span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    );
  }

  // Phase: Grand Reveal & Winner / Loser Screen
  if (phase === 'reveal' && currentWord) {
    const voteTotals = getVoteTotals();
    const imposterPlayer = players.find((p) => p.id === imposterPlayerId);

    // Determine most voted
    let highestVotes = -1;
    let mostVotedPlayerId = '';
    let isTie = false;

    Object.entries(voteTotals).forEach(([playerId, count]) => {
      if (count > highestVotes) {
        highestVotes = count;
        mostVotedPlayerId = playerId;
        isTie = false;
      } else if (count === highestVotes) {
        isTie = true;
      }
    });

    const civiliansWon = !isTie && mostVotedPlayerId === imposterPlayerId;

    return (
      <div className="max-w-2xl mx-auto min-h-[75vh] flex flex-col justify-center bg-white text-[#1A1A1A] p-6 sm:p-8 rounded-3xl border-4 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] space-y-6 text-center">
        {/* Outcome Header */}
        <div className="space-y-3">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              civiliansWon
                ? 'bg-[#06D6A0] text-[#1A1A1A]'
                : 'bg-[#FF5A5F] text-white'
            }`}
          >
            {civiliansWon ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : <ShieldAlert className="w-4 h-4 stroke-[2.5]" />}
            {civiliansWon ? 'Civilians Victory' : 'Imposter Victory'}
          </div>

          <h2 className="text-3xl sm:text-5xl font-black italic tracking-tight text-[#1A1A1A]">
            {civiliansWon ? 'THE IMPOSTER WAS CAUGHT!' : 'THE IMPOSTER ESCAPED!'}
          </h2>

          <p className="text-sm font-bold text-[#2D2D2D]">
            The secret Imposter was <strong className="bg-[#FFD166] px-2 py-0.5 rounded border border-black font-black text-[#1A1A1A]">{imposterPlayer?.name}</strong>!
          </p>
        </div>

        {/* Word Card */}
        <div className="bg-[#FFD166] p-4 rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xs text-[#1A1A1A] uppercase tracking-widest font-black">The Secret Word Was</p>
          <p className="text-2xl font-black text-[#1A1A1A] uppercase mt-1">{currentWord.word}</p>
          <p className="text-xs text-[#1A1A1A] font-bold mt-0.5">Category: {currentWord.category}</p>
        </div>

        {/* Vote Results Breakdown */}
        <div className="bg-[#FFF9F2] p-5 rounded-2xl border-3 border-black space-y-3 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h4 className="text-xs uppercase font-black text-[#FF5A5F] tracking-wider">Voting Breakdown:</h4>
          <div className="space-y-2">
            {players.map((p) => {
              const count = voteTotals[p.id] || 0;
              const isTheImposter = p.id === imposterPlayerId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border-2 border-black text-xs sm:text-sm font-bold ${
                    isTheImposter
                      ? 'bg-[#FF5A5F] text-white'
                      : 'bg-white text-[#1A1A1A]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-black">{p.name}</span>
                    {isTheImposter && (
                      <span className="px-2 py-0.5 rounded bg-black text-white text-[10px] font-black uppercase">
                        IMPOSTER
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-black">
                    {count} {count === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Play Again Button */}
        <div className="pt-2">
          <button
            id="imposter-play-again-btn"
            onClick={() => setPhase('setup')}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#06D6A0] hover:bg-[#05b88a] text-[#1A1A1A] font-black text-base border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>Play Another Round</span>
          </button>
        </div>
      </div>
    );
  }

  // Default: Setup Screen
  const uniqueCategories = Array.from(new Set(words.map((w) => w.category)));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Intro Banner */}
      <div className="bg-[#06D6A0] border-4 border-[#1A1A1A] rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#1A1A1A] border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Users className="w-3.5 h-3.5 text-[#FF5A5F]" /> GAME 02: WHO IS THE IMPOSTER?
            </div>
            <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight text-[#1A1A1A]">
              WHO IS THE IMPOSTER?
            </h2>
            <p className="text-sm font-medium text-[#1A1A1A] max-w-xl leading-relaxed">
              Don&apos;t let them find you. Pass the phone around the table to discover secret identities. Everyone receives
              the same word except one hidden mole! Question each other, bluff, and vote.
            </p>
          </div>

          <button
            id="imposter-start-btn"
            onClick={handleStartGame}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white hover:bg-[#FFF9F2] text-[#1A1A1A] font-black text-lg border-4 border-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>BEGIN SESSION</span>
          </button>
        </div>
      </div>

      {/* Grid: Players & Topic Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Players List */}
        <div className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 space-y-4 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xs text-[#FF5A5F] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 stroke-[2.5]" />
              <span>Players at Table ({players.length})</span>
            </h3>
            <span className="bg-[#FFF9F2] px-2.5 py-0.5 rounded-full border border-black text-[11px] font-black">Min 3 players</span>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1 flex-1">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF9F2] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-black border-2 border-black">
                    P{idx + 1}
                  </div>
                  <span className="text-sm font-black text-[#1A1A1A]">{p.name}</span>
                </div>
                {players.length > 3 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(p.id)}
                    className="p-1 text-[#1A1A1A] hover:text-[#FF5A5F] transition"
                    title="Remove Player"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Player Input */}
          <form onSubmit={handleAddPlayer} className="flex gap-2 pt-3 border-t-2 border-black">
            <input
              id="imposter-add-player-input"
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

        {/* Topic Category Selection */}
        <div className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 space-y-4 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col">
          <h3 className="font-black text-xs text-[#FF5A5F] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>Secret Word Category</span>
          </h3>
          <p className="text-xs text-[#2D2D2D] font-medium">Choose a theme for this restaurant round:</p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="imposter-cat-all"
              onClick={() => setSelectedWordCategory('all')}
              className={`p-2.5 rounded-xl border-2 border-black text-xs font-black transition text-left shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${
                selectedWordCategory === 'all'
                  ? 'bg-[#FF5A5F] text-white'
                  : 'bg-[#FFF9F2] text-[#1A1A1A] hover:bg-white'
              }`}
            >
              🎲 Random (All Themes)
            </button>
            {uniqueCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedWordCategory(cat)}
                className={`p-2.5 rounded-xl border-2 border-black text-xs font-black transition text-left truncate shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${
                  selectedWordCategory === cat
                    ? 'bg-[#FF5A5F] text-white'
                    : 'bg-[#FFF9F2] text-[#1A1A1A] hover:bg-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="bg-[#FFF9F2] p-3.5 rounded-xl border-2 border-black text-[11px] text-[#2D2D2D] font-bold leading-normal mt-auto">
            💡 <strong>Restaurant tip:</strong> Perfect for 3 to 10 guests! Pass the phone around under the table so
            nobody peeks!
          </div>
        </div>
      </div>
    </div>
  );
};
