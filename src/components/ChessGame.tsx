import React, { useState } from 'react';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Undo2,
  Trophy,
  ArrowUpDown,
  Swords,
  Crown,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
type PieceColor = 'w' | 'b';

interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

type BoardState = (ChessPiece | null)[][];

interface MoveHistory {
  from: [number, number];
  to: [number, number];
  piece: ChessPiece;
  captured: ChessPiece | null;
  notation: string;
}

// Initial Standard Chess Board
const createInitialBoard = (): BoardState => {
  const board: BoardState = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Black pieces (row 0 & 1)
  board[0][0] = { type: 'r', color: 'b' };
  board[0][1] = { type: 'n', color: 'b' };
  board[0][2] = { type: 'b', color: 'b' };
  board[0][3] = { type: 'q', color: 'b' };
  board[0][4] = { type: 'k', color: 'b' };
  board[0][5] = { type: 'b', color: 'b' };
  board[0][6] = { type: 'n', color: 'b' };
  board[0][7] = { type: 'r', color: 'b' };
  for (let c = 0; c < 8; c++) {
    board[1][c] = { type: 'p', color: 'b' };
  }

  // White pieces (row 6 & 7)
  for (let c = 0; c < 8; c++) {
    board[6][c] = { type: 'p', color: 'w' };
  }
  board[7][0] = { type: 'r', color: 'w' };
  board[7][1] = { type: 'n', color: 'w' };
  board[7][2] = { type: 'b', color: 'w' };
  board[7][3] = { type: 'q', color: 'w' };
  board[7][4] = { type: 'k', color: 'w' };
  board[7][5] = { type: 'b', color: 'w' };
  board[7][6] = { type: 'n', color: 'w' };
  board[7][7] = { type: 'r', color: 'w' };

  return board;
};

// Unicode / Graphical piece mapping
const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  w: {
    k: '♔',
    q: '♕',
    r: '♖',
    b: '♗',
    n: '♘',
    p: '♙',
  },
  b: {
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟',
  },
};

const PIECE_NAMES: Record<PieceType, string> = {
  p: 'Pawn',
  n: 'Knight',
  b: 'Bishop',
  r: 'Rook',
  q: 'Queen',
  k: 'King',
};

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const ChessGame: React.FC = () => {
  const [board, setBoard] = useState<BoardState>(createInitialBoard);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [history, setHistory] = useState<MoveHistory[]>([]);
  const [capturedByWhite, setCapturedByWhite] = useState<ChessPiece[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<ChessPiece[]>([]);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [checkStatus, setCheckStatus] = useState<PieceColor | null>(null);
  const [winner, setWinner] = useState<PieceColor | null>(null);
  const [promotionPending, setPromotionPending] = useState<{
    from: [number, number];
    to: [number, number];
    captured: ChessPiece | null;
  } | null>(null);

  // Convert coords to algebraic notation (e.g. [6,4] -> 'e2')
  const toAlgebraic = (r: number, c: number): string => {
    const file = String.fromCharCode(97 + c);
    const rank = 8 - r;
    return `${file}${rank}`;
  };

  // Find King Position
  const findKing = (b: BoardState, color: PieceColor): [number, number] | null => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = b[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          return [r, c];
        }
      }
    }
    return null;
  };

  // Check if square is attacked by opponent
  const isSquareAttacked = (
    targetR: number,
    targetC: number,
    attackerColor: PieceColor,
    currentBoard: BoardState
  ): boolean => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currentBoard[r][c];
        if (piece && piece.color === attackerColor) {
          const rawMoves = getRawMoves(r, c, currentBoard);
          if (rawMoves.some(([mr, mc]) => mr === targetR && mc === targetC)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Raw moves generator (without self-check filtering to prevent circular recursion)
  const getRawMoves = (r: number, c: number, b: BoardState): [number, number][] => {
    const piece = b[r][c];
    if (!piece) return [];
    const moves: [number, number][] = [];
    const { type, color } = piece;
    const opponent = color === 'w' ? 'b' : 'w';

    if (type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;

      // 1 step forward
      const nextR = r + dir;
      if (nextR >= 0 && nextR < 8 && !b[nextR][c]) {
        moves.push([nextR, c]);
        // 2 steps forward
        const twoR = r + dir * 2;
        if (r === startRow && !b[twoR][c]) {
          moves.push([twoR, c]);
        }
      }

      // Diagonal captures
      for (const dc of [-1, 1]) {
        const capC = c + dc;
        if (nextR >= 0 && nextR < 8 && capC >= 0 && capC < 8) {
          const target = b[nextR][capC];
          if (target && target.color === opponent) {
            moves.push([nextR, capC]);
          }
        }
      }
    } else if (type === 'n') {
      const knightOffsets = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ];
      for (const [dr, dc] of knightOffsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = b[nr][nc];
          if (!target || target.color === opponent) {
            moves.push([nr, nc]);
          }
        }
      }
    } else if (type === 'b' || type === 'r' || type === 'q') {
      const directions: [number, number][] = [];
      if (type === 'b' || type === 'q') {
        directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (type === 'r' || type === 'q') {
        directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }

      for (const [dr, dc] of directions) {
        let step = 1;
        while (true) {
          const nr = r + dr * step;
          const nc = c + dc * step;
          if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
          const target = b[nr][nc];
          if (!target) {
            moves.push([nr, nc]);
          } else {
            if (target.color === opponent) {
              moves.push([nr, nc]);
            }
            break;
          }
          step++;
        }
      }
    } else if (type === 'k') {
      const kingOffsets = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];
      for (const [dr, dc] of kingOffsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = b[nr][nc];
          if (!target || target.color === opponent) {
            moves.push([nr, nc]);
          }
        }
      }
    }

    return moves;
  };

  // Get strictly legal moves that do not leave own King in check
  const getLegalMoves = (r: number, c: number, currentBoard: BoardState): [number, number][] => {
    const piece = currentBoard[r][c];
    if (!piece) return [];
    const raw = getRawMoves(r, c, currentBoard);

    return raw.filter(([toR, toC]) => {
      // Simulate move
      const simBoard = currentBoard.map((row) => [...row]);
      simBoard[toR][toC] = simBoard[r][c];
      simBoard[r][c] = null;

      const kingPos = findKing(simBoard, piece.color);
      if (!kingPos) return false;
      const opponentColor = piece.color === 'w' ? 'b' : 'w';
      return !isSquareAttacked(kingPos[0], kingPos[1], opponentColor, simBoard);
    });
  };

  // Square Click Handler
  const handleSquareClick = (r: number, c: number) => {
    if (winner || promotionPending) return;

    const clickedPiece = board[r][c];

    // If already selected and clicked another square
    if (selectedSquare) {
      const [fromR, fromC] = selectedSquare;

      // Clicking same square -> deselect
      if (fromR === r && fromC === c) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      // If clicked one of valid destination moves -> execute move!
      const isLegal = validMoves.some(([vr, vc]) => vr === r && vc === c);
      if (isLegal) {
        const movingPiece = board[fromR][fromC]!;
        const destPiece = board[r][c];

        // Check for Pawn Promotion (White reaches row 0, Black reaches row 7)
        if (movingPiece.type === 'p' && (r === 0 || r === 7)) {
          setPromotionPending({
            from: [fromR, fromC],
            to: [r, c],
            captured: destPiece,
          });
          setSelectedSquare(null);
          setValidMoves([]);
          return;
        }

        executeMove(fromR, fromC, r, c, movingPiece, destPiece);
        return;
      }

      // If clicked another piece of the same turn color -> switch selection
      if (clickedPiece && clickedPiece.color === turn) {
        setSelectedSquare([r, c]);
        setValidMoves(getLegalMoves(r, c, board));
        return;
      }

      // Clicked invalid empty square or opponent piece
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // No selection yet: select piece if belongs to current turn
    if (clickedPiece && clickedPiece.color === turn) {
      const moves = getLegalMoves(r, c, board);
      setSelectedSquare([r, c]);
      setValidMoves(moves);
    }
  };

  // Execute standard move
  const executeMove = (
    fromR: number,
    fromC: number,
    toR: number,
    toC: number,
    piece: ChessPiece,
    captured: ChessPiece | null
  ) => {
    const newBoard = board.map((row) => [...row]);
    newBoard[toR][toC] = piece;
    newBoard[fromR][fromC] = null;

    if (captured) {
      sounds.playChessCapture();
      if (turn === 'w') {
        setCapturedByWhite((prev) => [...prev, captured]);
      } else {
        setCapturedByBlack((prev) => [...prev, captured]);
      }
    } else {
      sounds.playChessMove();
    }

    // Notation
    const piecePrefix = piece.type === 'p' ? '' : piece.type.toUpperCase();
    const notation = `${piecePrefix}${captured ? 'x' : ''}${toAlgebraic(toR, toC)}`;

    setHistory((prev) => [
      ...prev,
      {
        from: [fromR, fromC],
        to: [toR, toC],
        piece,
        captured,
        notation,
      },
    ]);

    setBoard(newBoard);
    setSelectedSquare(null);
    setValidMoves([]);

    // Check next player's status
    const nextTurn = turn === 'w' ? 'b' : 'w';
    const opponentKing = findKing(newBoard, nextTurn);
    let isInCheck = false;
    if (opponentKing) {
      isInCheck = isSquareAttacked(opponentKing[0], opponentKing[1], turn, newBoard);
    }

    setCheckStatus(isInCheck ? nextTurn : null);

    // Check for checkmate / stalemate: Does next player have any legal moves?
    let hasAnyMove = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (newBoard[r][c]?.color === nextTurn) {
          if (getLegalMoves(r, c, newBoard).length > 0) {
            hasAnyMove = true;
            break;
          }
        }
      }
      if (hasAnyMove) break;
    }

    if (!hasAnyMove) {
      if (isInCheck) {
        // Checkmate!
        setWinner(turn);
        sounds.playFanfare();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        // Stalemate
        alert('Stalemate! Game ends in a draw.');
      }
    } else {
      setTurn(nextTurn);
    }
  };

  // Complete Pawn Promotion
  const handlePromote = (promoType: PieceType) => {
    if (!promotionPending) return;
    const { from, to, captured } = promotionPending;
    const [fromR, fromC] = from;
    const [toR, toC] = to;
    const promotedPiece: ChessPiece = { type: promoType, color: turn };

    executeMove(fromR, fromC, toR, toC, promotedPiece, captured);
    setPromotionPending(null);
  };

  // Undo Last Move
  const handleUndo = () => {
    if (history.length === 0 || winner || promotionPending) return;
    const last = history[history.length - 1];
    const newBoard = board.map((row) => [...row]);

    // Restore piece
    newBoard[last.from[0]][last.from[1]] = last.piece;
    newBoard[last.to[0]][last.to[1]] = last.captured;

    // Restore captured lists
    if (last.captured) {
      if (last.piece.color === 'w') {
        setCapturedByWhite((prev) => prev.slice(0, prev.length - 1));
      } else {
        setCapturedByBlack((prev) => prev.slice(0, prev.length - 1));
      }
    }

    setBoard(newBoard);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setTurn(last.piece.color);
    setSelectedSquare(null);
    setValidMoves([]);
    setCheckStatus(null);
    sounds.playChessMove();
  };

  // Reset Game
  const handleReset = () => {
    setBoard(createInitialBoard());
    setTurn('w');
    setSelectedSquare(null);
    setValidMoves([]);
    setHistory([]);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setCheckStatus(null);
    setWinner(null);
    setPromotionPending(null);
  };

  // Calculate material advantages
  const whiteScore = capturedByWhite.reduce((sum, p) => sum + PIECE_VALUES[p.type], 0);
  const blackScore = capturedByBlack.reduce((sum, p) => sum + PIECE_VALUES[p.type], 0);

  // Active King check coords
  const checkedKingPos = checkStatus ? findKing(board, checkStatus) : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-[#1A1A1A] text-white border-4 border-black rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD166] text-[#1A1A1A] border-2 border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Swords className="w-3.5 h-3.5" /> 2-PLAYER TABLE CHESS
          </div>
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tight text-white">
            CHESS MASTERS LOUNGE
          </h2>
          <p className="text-sm font-medium text-white/80 max-w-xl">
            Classic 8x8 table chess. Move pieces, capture opponent forces, protect your King, and deliver checkmate across the table!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFlipped(!flipped)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#1A1A1A] font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Flip Board</span>
          </button>
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs border-2 border-black transition cursor-pointer ${
              history.length === 0
                ? 'bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed'
                : 'bg-[#FFD166] text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
            }`}
          >
            <Undo2 className="w-4 h-4" />
            <span>Undo</span>
          </button>
          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border-2 border-neutral-600 transition cursor-pointer"
            title="Reset Chess Board"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Chess Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Board & Captures */}
        <div className="lg:col-span-8 flex flex-col items-center space-y-4">
          {/* Black Captures / Top Tray */}
          <div className="w-full max-w-[500px] flex items-center justify-between px-4 py-2 bg-white rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-black border border-neutral-400 inline-block" />
              <span className="font-black text-xs text-[#1A1A1A]">BLACK</span>
              {blackScore > whiteScore && (
                <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                  +{blackScore - whiteScore}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-base text-neutral-800">
              {capturedByBlack.map((p, idx) => (
                <span key={idx} title={PIECE_NAMES[p.type]}>
                  {PIECE_SYMBOLS['w'][p.type]}
                </span>
              ))}
            </div>
          </div>

          {/* 8x8 Chessboard */}
          <div className="relative w-full max-w-[500px] aspect-square border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] bg-[#D69F7E]">
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
              {(flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]).map((r) =>
                (flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]).map((c) => {
                  const piece = board[r][c];
                  const isLight = (r + c) % 2 === 0;
                  const isSelected = selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
                  const isValidDest = validMoves.some(([vr, vc]) => vr === r && vc === c);
                  const isKingChecked = checkedKingPos && checkedKingPos[0] === r && checkedKingPos[1] === c;

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleSquareClick(r, c)}
                      className={`relative flex items-center justify-center select-none transition-all cursor-pointer ${
                        isKingChecked
                          ? 'bg-rose-500 animate-pulse'
                          : isSelected
                          ? 'bg-[#FFD166]'
                          : isLight
                          ? 'bg-[#FFF9F2]'
                          : 'bg-[#C87941]'
                      }`}
                    >
                      {/* Destination Highlight Marker */}
                      {isValidDest && (
                        <div
                          className={`absolute z-10 rounded-full ${
                            piece
                              ? 'w-full h-full border-4 border-[#06D6A0] bg-emerald-400/20'
                              : 'w-4 h-4 bg-[#06D6A0] border-2 border-black'
                          }`}
                        />
                      )}

                      {/* Chess Piece Visual */}
                      {piece && (
                        <span
                          className={`text-3xl sm:text-4xl filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] transition-transform ${
                            isSelected ? 'scale-110 -translate-y-1' : ''
                          } ${piece.color === 'w' ? 'text-white' : 'text-[#1A1A1A]'}`}
                          style={{
                            WebkitTextStroke: piece.color === 'w' ? '1.5px #1A1A1A' : '1px rgba(255,255,255,0.4)',
                          }}
                        >
                          {PIECE_SYMBOLS[piece.color][piece.type]}
                        </span>
                      )}

                      {/* Rank & File Labels on borders */}
                      {c === (flipped ? 7 : 0) && (
                        <span className="absolute top-0.5 left-1 text-[9px] font-black text-black/40">
                          {8 - r}
                        </span>
                      )}
                      {r === (flipped ? 0 : 7) && (
                        <span className="absolute bottom-0.5 right-1 text-[9px] font-black text-black/40">
                          {String.fromCharCode(97 + c)}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* White Captures / Bottom Tray */}
          <div className="w-full max-w-[500px] flex items-center justify-between px-4 py-2 bg-white rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-white border-2 border-black inline-block" />
              <span className="font-black text-xs text-[#1A1A1A]">WHITE</span>
              {whiteScore > blackScore && (
                <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                  +{whiteScore - blackScore}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-base text-neutral-800">
              {capturedByWhite.map((p, idx) => (
                <span key={idx} title={PIECE_NAMES[p.type]}>
                  {PIECE_SYMBOLS['b'][p.type]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Game Status & Move History */}
        <div className="lg:col-span-4 space-y-4">
          {/* Turn Indicator Box */}
          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] space-y-4">
            <span className="text-xs uppercase font-black tracking-wider text-[#FF5A5F]">
              CURRENT TURN
            </span>

            <div
              className={`p-4 rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between transition-colors ${
                turn === 'w' ? 'bg-[#FFF9F2] text-[#1A1A1A]' : 'bg-[#1A1A1A] text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl border-2 border-black flex items-center justify-center text-2xl font-black ${
                    turn === 'w' ? 'bg-white text-black' : 'bg-black text-white'
                  }`}
                >
                  {turn === 'w' ? '♔' : '♚'}
                </div>
                <div>
                  <h3 className="text-xl font-black">{turn === 'w' ? 'White' : 'Black'} to Move</h3>
                  <p className="text-xs font-bold opacity-80">
                    {turn === 'w' ? 'Player 1' : 'Player 2'}
                  </p>
                </div>
              </div>
            </div>

            {/* Check Warning Banner */}
            {checkStatus && (
              <div className="bg-rose-500 text-white p-3 rounded-2xl border-2 border-black font-black text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                <ShieldAlert className="w-4 h-4" />
                <span>CHECK! {checkStatus === 'w' ? 'White' : 'Black'} King is under attack!</span>
              </div>
            )}
          </div>

          {/* Move History Log */}
          <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#1A1A1A] flex items-center justify-between">
              <span>MOVE LOG</span>
              <span className="text-[10px] text-neutral-500">{history.length} moves</span>
            </h4>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-4 text-center">
                  No moves played yet. Pick a piece to begin!
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold">
                  {history.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#FFF9F2] border border-black/30"
                    >
                      <span className="text-neutral-500 text-[10px]">#{idx + 1}</span>
                      <span className="font-black text-[#1A1A1A]">{m.notation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pawn Promotion Modal */}
      {promotionPending && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black italic">Promote Your Pawn</h3>
            <p className="text-xs font-bold text-[#2D2D2D]">
              Choose the piece you want to promote your pawn into:
            </p>
            <div className="grid grid-cols-4 gap-2 pt-2">
              {(['q', 'r', 'b', 'n'] as PieceType[]).map((ptype) => (
                <button
                  key={ptype}
                  onClick={() => handlePromote(ptype)}
                  className="py-3 bg-[#FFD166] hover:bg-[#ffc83b] border-2 border-black rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
                >
                  <span className="text-3xl">{PIECE_SYMBOLS[turn][ptype]}</span>
                  <span className="text-[10px] font-black uppercase">{PIECE_NAMES[ptype]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Checkmate Victory Modal */}
      {winner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-[#FFD166] border-4 border-black flex items-center justify-center mx-auto text-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Crown className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#FF5A5F]">
                CHECKMATE!
              </span>
              <h3 className="text-3xl font-black text-[#1A1A1A] italic">
                {winner === 'w' ? 'WHITE' : 'BLACK'} WINS!
              </h3>
              <p className="text-xs font-bold text-[#2D2D2D]">
                Masterful tactical victory on the board! The enemy king has no escape.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-4 rounded-2xl bg-[#06D6A0] hover:bg-[#05b88a] text-[#1A1A1A] font-black text-sm border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
            >
              PLAY REMATCH!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
