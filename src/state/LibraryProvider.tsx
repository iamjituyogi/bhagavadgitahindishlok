/**
 * Local listening library: favourites, history, per-chapter progress and
 * playback preferences. Everything is persisted with AsyncStorage. No account
 * or network is needed.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { readJSON, StorageKeys, writeJSON } from '../storage/storage';
import { TOTAL_CHAPTERS } from '../data/chapters';

export const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export type PlaybackSpeed = (typeof SPEED_OPTIONS)[number];

export type PlaybackPrefs = {
  /** Default speed applied to every chapter; also changed from the player. */
  speed: PlaybackSpeed;
  /** Start a chapter from where the listener left off. */
  resumePosition: boolean;
  /** Continue to the next chapter when one finishes. */
  autoplayNext: boolean;
};

export type ChapterProgress = {
  position: number;
  duration: number;
  completed: boolean;
  updatedAt: number;
};

export type HistoryEntry = { chapter: number; playedAt: number };

const DEFAULT_PREFS: PlaybackPrefs = {
  speed: 1,
  resumePosition: true,
  autoplayNext: true,
};

const MAX_HISTORY = 30;

type LibraryContextValue = {
  loaded: boolean;
  prefs: PlaybackPrefs;
  updatePrefs: (patch: Partial<PlaybackPrefs>) => void;

  favorites: number[];
  isFavorite: (chapter: number) => boolean;
  toggleFavorite: (chapter: number) => void;

  history: HistoryEntry[];
  addToHistory: (chapter: number) => void;
  clearHistory: () => void;

  progress: Record<number, ChapterProgress>;
  lastPlayed: number | null;
  saveProgress: (chapter: number, position: number, duration: number, completed?: boolean) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

function isValidChapter(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= TOTAL_CHAPTERS;
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [prefs, setPrefs] = useState<PlaybackPrefs>(DEFAULT_PREFS);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [progress, setProgress] = useState<Record<number, ChapterProgress>>({});
  const [lastPlayed, setLastPlayed] = useState<number | null>(null);

  // Hydrate once on launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [p, f, h, pr, lp] = await Promise.all([
        readJSON<Partial<PlaybackPrefs>>(StorageKeys.playbackPrefs, {}),
        readJSON<number[]>(StorageKeys.favorites, []),
        readJSON<HistoryEntry[]>(StorageKeys.history, []),
        readJSON<Record<number, ChapterProgress>>(StorageKeys.progress, {}),
        readJSON<number | null>(StorageKeys.lastPlayed, null),
      ]);
      if (cancelled) {
        return;
      }
      const speed = SPEED_OPTIONS.includes(p.speed as PlaybackSpeed)
        ? (p.speed as PlaybackSpeed)
        : DEFAULT_PREFS.speed;
      setPrefs({ ...DEFAULT_PREFS, ...p, speed });
      setFavorites(Array.isArray(f) ? f.filter(isValidChapter) : []);
      setHistory(Array.isArray(h) ? h.filter(e => isValidChapter(e?.chapter)) : []);
      setProgress(pr && typeof pr === 'object' ? pr : {});
      setLastPlayed(isValidChapter(lp) ? lp : null);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updatePrefs = useCallback((patch: Partial<PlaybackPrefs>) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch };
      writeJSON(StorageKeys.playbackPrefs, next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((chapter: number) => {
    setFavorites(prev => {
      const next = prev.includes(chapter)
        ? prev.filter(c => c !== chapter)
        : [...prev, chapter].sort((a, b) => a - b);
      writeJSON(StorageKeys.favorites, next);
      return next;
    });
  }, []);

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);
  const isFavorite = useCallback((chapter: number) => favoritesSet.has(chapter), [favoritesSet]);

  const addToHistory = useCallback((chapter: number) => {
    setHistory(prev => {
      const next = [{ chapter, playedAt: Date.now() }, ...prev.filter(e => e.chapter !== chapter)].slice(
        0,
        MAX_HISTORY,
      );
      writeJSON(StorageKeys.history, next);
      return next;
    });
    setLastPlayed(chapter);
    writeJSON(StorageKeys.lastPlayed, chapter);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeJSON(StorageKeys.history, []);
  }, []);

  // Progress writes are coalesced so frequent saves don't hammer storage.
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveProgress = useCallback(
    (chapter: number, position: number, duration: number, completed = false) => {
      if (!isValidChapter(chapter) || !Number.isFinite(position)) {
        return;
      }
      const entry: ChapterProgress = {
        position: completed ? 0 : Math.max(0, position),
        duration: Number.isFinite(duration) && duration > 0 ? duration : progressRef.current[chapter]?.duration ?? 0,
        completed,
        updatedAt: Date.now(),
      };
      setProgress(prev => {
        const next = { ...prev, [chapter]: entry };
        if (writeTimer.current) {
          clearTimeout(writeTimer.current);
        }
        writeTimer.current = setTimeout(() => writeJSON(StorageKeys.progress, next), 300);
        return next;
      });
    },
    [],
  );

  useEffect(
    () => () => {
      if (writeTimer.current) {
        clearTimeout(writeTimer.current);
      }
    },
    [],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      loaded,
      prefs,
      updatePrefs,
      favorites,
      isFavorite,
      toggleFavorite,
      history,
      addToHistory,
      clearHistory,
      progress,
      lastPlayed,
      saveProgress,
    }),
    [
      loaded,
      prefs,
      updatePrefs,
      favorites,
      isFavorite,
      toggleFavorite,
      history,
      addToHistory,
      clearHistory,
      progress,
      lastPlayed,
      saveProgress,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error('useLibrary must be used inside <LibraryProvider>');
  }
  return ctx;
}
