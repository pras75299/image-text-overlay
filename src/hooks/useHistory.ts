import { useState, useCallback } from "react";

const MAX_HISTORY_SIZE = 50;

export interface UseHistoryReturn<T> {
  past: T[];
  present: T;
  undo: () => void;
  redo: () => void;
  push: (state: T) => void;
  setPresentWithoutPush: (state: T) => void;
  reset: (state: T) => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const useHistory = <T>(initialPresent: T): UseHistoryReturn<T> => {
  const [history, setHistory] = useState<{
    past: T[];
    present: T;
    future: T[];
  }>({
    past: [],
    present: initialPresent,
    future: [],
  });

  const push = useCallback((newPresent: T) => {
    setHistory((prev) => {
      const past = [...prev.past, prev.present];
      if (past.length > MAX_HISTORY_SIZE) {
        past.shift();
      }
      return {
        past,
        present: newPresent,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const newPast = [...prev.past];
      const newPresent = newPast.pop()!;
      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const [newPresent, ...newFuture] = prev.future;
      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((state: T) => {
    setHistory({
      past: [],
      present: state,
      future: [],
    });
  }, []);

  const setPresentWithoutPush = useCallback((state: T) => {
    setHistory((prev) => ({ ...prev, present: state }));
  }, []);

  return {
    past: history.past,
    present: history.present,
    undo,
    redo,
    push,
    setPresentWithoutPush,
    reset,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
};
