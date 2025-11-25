"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const SIZE = 9;
const EMPTY = null;

function generateFullBoard(): (number | null)[][] {
  const board: (number | null)[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));

  function isValid(row: number, col: number, num: number): boolean {
    for (let i = 0; i < SIZE; i++) {
      if (board[row][i] === num) return false;
      if (board[i][col] === num) return false;
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        if (board[r][c] === num) return false;
      }
    }
    return true;
  }

  function solve(): boolean {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === EMPTY) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          for (const n of nums) {
            if (isValid(r, c, n)) {
              board[r][c] = n;
              if (solve()) return true;
              board[r][c] = EMPTY;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve();
  return board;
}

function removeNumbers(board: (number | null)[][], count: number): (number | null)[][] {
  const newBoard = board.map(row => [...row]);
  let removed = 0;
  while (removed < count) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    if (newBoard[r][c] !== EMPTY) {
      newBoard[r][c] = EMPTY;
      removed++;
    }
  }
  return newBoard;
}

export default function Sudoku() {
  const [board, setBoard] = useState<(number | null)[][]>([]);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [hintsRemaining, setHintsRemaining] = useState<number>(3);
  const [fullBoard, setFullBoard] = useState<(number | null)[][]>([]);
  const [history, setHistory] = useState<
    { row: number; col: number; prevValue: number | null }[]
  >([]);
  function undoLastMove() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    const newBoard = board.map(r => [...r]);
    newBoard[last.row][last.col] = last.prevValue;
    setBoard(newBoard);
    setHistory(prev => prev.slice(0, -1));
    setErrors(prev => {
      const newErr = prev.map(r => [...r]);
      newErr[last.row][last.col] = false;
      return newErr;
    });
  }
  function handleHint() {
    if (!selected || hintsRemaining === 0) return;
    const { row, col } = selected;
    const correct = fullBoard[row][col];
    if (correct === null) return;
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = correct;
    setBoard(newBoard);
    setHintsRemaining(prev => prev - 1);
  }
  const [errors, setErrors] = useState<boolean[][]>(Array.from({ length: SIZE }, () => Array(SIZE).fill(false)));

  useEffect(() => {
    startNewGame();
  }, []);

  function startNewGame() {
    const full = generateFullBoard();
    const puzzle = removeNumbers(full, 40);
    setBoard(puzzle);
    setSelected(null);
    setErrors(Array.from({ length: SIZE }, () => Array(SIZE).fill(false)));
    setFullBoard(full);
    setHintsRemaining(3);
    setHistory([]);
  }

  function handleCellClick(row: number, col: number) {
    if (board[row][col] === EMPTY) {
      setSelected({ row, col });
    } else {
      setSelected(null);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) {
    const val = e.target.value;
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1 || num > 9) {
      setErrors(prev => {
        const newErr = prev.map(r => [...r]);
        newErr[row][col] = true;
        return newErr;
      });
      return;
    }
    setHistory(prev => [...prev, { row, col, prevValue: board[row][col] }]);
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = num;
    setBoard(newBoard);
    setErrors(prev => {
      const newErr = prev.map(r => [...r]);
      newErr[row][col] = false;
      return newErr;
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-9 gap-0">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isSelected = selected?.row === r && selected?.col === c;
            const isError = errors[r][c];
            const isPrefilled = cell !== EMPTY;
            return (
              <div
                key={`${r}-${c}`}
                className={`
                  border
                  ${r % 3 === 0 ? "border-t-2" : "border-t"}
                  ${c % 3 === 0 ? "border-l-2" : "border-l"}
                  ${r === SIZE - 1 ? "border-b-2" : "border-b"}
                  ${c === SIZE - 1 ? "border-r-2" : "border-r"}
                  ${isSelected ? "bg-blue-200" : "bg-white"}
                  ${isError ? "border-red-500" : "border-gray-300"}
                  h-12 w-12 flex items-center justify-center
                `}
                onClick={() => handleCellClick(r, c)}
              >
                {isPrefilled ? (
                  <span className="text-lg font-medium">{cell}</span>
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={9}
                    className="w-10 h-10 text-center text-lg focus:outline-none"
                    value={board[r][c] ?? ""}
                    onChange={e => handleInputChange(e, r, c)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
      <Button onClick={handleHint} disabled={hintsRemaining === 0 || !selected}>Hint ({hintsRemaining})</Button>
      <Button onClick={undoLastMove}>Undo</Button>
      <Button onClick={startNewGame}>New Game</Button>
    </div>
  );
}
