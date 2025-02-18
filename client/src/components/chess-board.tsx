import React, { useEffect, useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Move, Square } from 'chess.js';

interface ChessBoardProps {
  fen: string;
  onMove: (move: string) => void;
  disabled?: boolean;
  solution?: string[];
  currentMoveIndex?: number;
  showHint?: boolean;
  isPlayingAnimation?: boolean;
  customOptions?: {
    boardOrientation?: 'white' | 'black';
    showCoordinates?: boolean;
    boardTheme?: 'green' | 'brown' | 'blue';
  };
}

const boardThemes = {
  green: {
    lightSquare: '#EEEED2',
    darkSquare: '#769656',
  },
  brown: {
    lightSquare: '#F0D9B5',
    darkSquare: '#B58863',
  },
  blue: {
    lightSquare: '#DEE3E6',
    darkSquare: '#788A9E',
  },
} as const;

export function ChessBoard({
  fen,
  onMove,
  disabled = false,
  solution = [],
  currentMoveIndex = 0,
  showHint = false,
  isPlayingAnimation = false,
  customOptions = {},
}: ChessBoardProps) {
  const [game, setGame] = useState(new Chess(fen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [hintSquares, setHintSquares] = useState<{ from: Square; to: Square } | null>(null);
  const [animationPosition, setAnimationPosition] = useState(fen);
  const [lastMoveSquares, setLastMoveSquares] = useState<{ from: Square; to: Square } | null>(null);

  useEffect(() => {
    if (!isPlayingAnimation) {
      const newGame = new Chess(fen);
      setGame(newGame);
      setAnimationPosition(fen);
      setLastMoveSquares(null);

      if (showHint && solution[currentMoveIndex]) {
        const tempGame = new Chess(fen);
        try {
          const move = tempGame.move(solution[currentMoveIndex]);
          if (move) {
            setHintSquares({ from: move.from as Square, to: move.to as Square });
          }
        } catch (error) {
          console.error('Invalid move in solution:', error);
        }
      } else {
        setHintSquares(null);
      }
    }
  }, [fen, showHint, solution, currentMoveIndex, isPlayingAnimation]);

  useEffect(() => {
    if (isPlayingAnimation && solution && currentMoveIndex > 0) {
      const tempGame = new Chess(fen);
      for (let i = 0; i < currentMoveIndex; i++) {
        try {
          const move = tempGame.move(solution[i]);
          if (move && i === currentMoveIndex - 1) {
            setLastMoveSquares({ from: move.from as Square, to: move.to as Square });
          }
        } catch (error) {
          console.error('Invalid move during animation:', error);
        }
      }
      setAnimationPosition(tempGame.fen());
    }
  }, [isPlayingAnimation, currentMoveIndex, solution, fen]);

  const makeMove = useCallback(
    (sourceSquare: Square, targetSquare: Square): boolean => {
      try {
        const moveAttempt = {
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        };

        const move = game.move(moveAttempt);
        if (move) {
          setGame(new Chess(game.fen()));
          onMove(move.san);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Move error:", error);
        return false;
      }
    },
    [game, onMove]
  );

  const onSquareClick = useCallback(
    (square: Square) => {
      if (disabled || isPlayingAnimation) return;

      const piece = game.get(square);

      if (selectedSquare) {
        if (square === selectedSquare) {
          setSelectedSquare(null);
          return;
        }

        const moveSuccess = makeMove(selectedSquare, square);
        if (!moveSuccess && piece?.color === game.turn()) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      } else {
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
        }
      }
    },
    [disabled, game, selectedSquare, makeMove, isPlayingAnimation]
  );

  const customSquareStyles = {
    ...(selectedSquare && {
      [selectedSquare]: {
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
        borderRadius: '8px',
      },
    }),
    ...(showHint && hintSquares && {
      [hintSquares.from]: {
        backgroundColor: 'rgba(0, 255, 0, 0.3)',
        boxShadow: 'inset 0 0 1px 4px rgba(0, 255, 0, 0.75)',
        borderRadius: '8px',
      },
      [hintSquares.to]: {
        backgroundColor: 'rgba(0, 255, 0, 0.2)',
        boxShadow: 'inset 0 0 1px 4px rgba(0, 255, 0, 0.75)',
        borderRadius: '8px',
      },
    }),
    ...(lastMoveSquares && {
      [lastMoveSquares.from]: {
        backgroundColor: 'rgba(155, 199, 0, 0.41)',
      },
      [lastMoveSquares.to]: {
        backgroundColor: 'rgba(155, 199, 0, 0.41)',
      },
    }),
  };

  const selectedTheme = boardThemes[customOptions.boardTheme || 'green'];

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-2xl aspect-square relative">
        <Chessboard
          position={isPlayingAnimation ? animationPosition : game.fen()}
          onPieceDrop={makeMove}
          onSquareClick={onSquareClick}
          boardOrientation={customOptions.boardOrientation || 'white'}
          customSquareStyles={customSquareStyles}
          showBoardNotation={customOptions.showCoordinates !== false}
          customLightSquareStyle={{ backgroundColor: selectedTheme.lightSquare }}
          customDarkSquareStyle={{ backgroundColor: selectedTheme.darkSquare }}
          animationDuration={200}
        />
      </div>
    </div>
  );
}

export default ChessBoard;