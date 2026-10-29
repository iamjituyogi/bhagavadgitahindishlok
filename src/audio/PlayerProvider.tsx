/**
 * Central audio engine.
 *
 * Exactly one react-native-video element exists for the whole app. It is
 * keyed by chapter and retry session, so switching chapters tears down the
 * previous player before the next one starts. Two tracks can never overlap.
 *
 * State is split across three contexts so the frequent position updates
 * only re-render components that show progress:
 *   - PlayerStateContext    chapter, status, duration, speed, error  (changes rarely)
 *   - PlayerProgressContext position, buffered                       (about 2× per second)
 *   - PlayerActionsContext  stable callbacks                         (never changes)
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
import { AppState, StyleSheet, View } from 'react-native';
import Video, {
  type OnBufferData,
  type OnLoadData,
  type OnPlaybackStateChangedData,
  type OnProgressData,
  type OnVideoErrorData,
  type VideoRef,
} from 'react-native-video';
import { chapterLabel, getChapter, TOTAL_CHAPTERS } from '../data/chapters';
import { PlaybackSpeed, useLibrary } from '../state/LibraryProvider';

export type PlaybackStatus =
  | 'idle'
  | 'loading'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error';

export type PlayerState = {
  chapterNumber: number | null;
  status: PlaybackStatus;
  duration: number;
  speed: PlaybackSpeed;
  errorMessage: string | null;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type PlayerProgress = { position: number; buffered: number };

export type PlayChapterOptions = {
  /** Seconds to start from. Defaults to the saved position when "resume" is on. */
  startAt?: number;
  /** Start playing as soon as audio is ready. Default true. */
  autoplay?: boolean;
};

export type PlayerActions = {
  playChapter: (chapterNumber: number, options?: PlayChapterOptions) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  next: () => void;
  previous: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  retry: () => void;
};

const PlayerStateContext = createContext<PlayerState | null>(null);
const PlayerProgressContext = createContext<PlayerProgress | null>(null);
const PlayerActionsContext = createContext<PlayerActions | null>(null);

/** Save the listening position at most this often (ms) while playing. */
const SAVE_INTERVAL_MS = 5000;
/** Don't resume into the last few seconds. Start the chapter fresh instead. */
const RESUME_END_GUARD_S = 10;

const ERROR_MESSAGE =
  'ऑडियो लोड नहीं हो सका। कृपया इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।';

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { prefs, updatePrefs, progress, saveProgress, addToHistory } = useLibrary();

  const videoRef = useRef<VideoRef>(null);

  const [chapterNumber, setChapterNumber] = useState<number | null>(null);
  const [session, setSession] = useState(0); // bump to force a fresh native player
  const [wantsPlay, setWantsPlay] = useState(false); // user's intent
  const [loaded, setLoaded] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [ended, setEnded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [progressState, setProgressState] = useState<PlayerProgress>({ position: 0, buffered: 0 });

  // Refs mirror state for use inside native callbacks without stale closures.
  const chapterRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const startAtRef = useRef(0);
  const wantsPlayRef = useRef(false);
  const bufferingRef = useRef(false);
  const endedRef = useRef(false);
  const lastSaveRef = useRef(0);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const progressMapRef = useRef(progress);
  progressMapRef.current = progress;

  const setIntent = useCallback((value: boolean) => {
    wantsPlayRef.current = value;
    setWantsPlay(value);
  }, []);

  const persistPosition = useCallback(
    (completed = false) => {
      const ch = chapterRef.current;
      if (ch == null) {
        return;
      }
      saveProgress(ch, positionRef.current, durationRef.current, completed);
      lastSaveRef.current = Date.now();
    },
    [saveProgress],
  );

  // ---- Actions -------------------------------------------------------------

  const playChapter = useCallback(
    (target: number, options: PlayChapterOptions = {}) => {
      if (!getChapter(target)) {
        return;
      }
      const autoplay = options.autoplay ?? true;

      // Same chapter already loaded (and healthy): just apply intent / seek.
      if (target === chapterRef.current && !errorMessage) {
        if (options.startAt != null && loaded) {
          videoRef.current?.seek(options.startAt);
          positionRef.current = options.startAt;
          setProgressState(p => ({ ...p, position: options.startAt! }));
        }
        if (endedRef.current) {
          endedRef.current = false;
          setEnded(false);
          videoRef.current?.seek(0);
        }
        if (autoplay) {
          setIntent(true);
        }
        return;
      }

      // Leaving a chapter: remember where we were.
      if (chapterRef.current != null && !endedRef.current) {
        persistPosition();
      }

      let startAt = options.startAt ?? 0;
      if (options.startAt == null && prefsRef.current.resumePosition) {
        const saved = progressMapRef.current[target];
        if (
          saved &&
          !saved.completed &&
          saved.position > 0 &&
          (saved.duration <= 0 || saved.position < saved.duration - RESUME_END_GUARD_S)
        ) {
          startAt = saved.position;
        }
      }

      chapterRef.current = target;
      startAtRef.current = startAt;
      positionRef.current = startAt;
      durationRef.current = progressMapRef.current[target]?.duration ?? 0;
      endedRef.current = false;
      bufferingRef.current = false;

      setChapterNumber(target);
      setLoaded(false);
      setBuffering(false);
      setEnded(false);
      setErrorMessage(null);
      setDuration(durationRef.current);
      setProgressState({ position: startAt, buffered: 0 });
      setIntent(autoplay);
      setSession(s => s + 1);
      addToHistory(target);
    },
    [addToHistory, errorMessage, loaded, persistPosition, setIntent],
  );

  const play = useCallback(() => {
    if (chapterRef.current == null) {
      return;
    }
    if (endedRef.current) {
      endedRef.current = false;
      setEnded(false);
      positionRef.current = 0;
      setProgressState(p => ({ ...p, position: 0 }));
      videoRef.current?.seek(0);
    }
    setIntent(true);
  }, [setIntent]);

  const pause = useCallback(() => {
    setIntent(false);
    persistPosition();
  }, [persistPosition, setIntent]);

  const togglePlayPause = useCallback(() => {
    if (wantsPlayRef.current && !endedRef.current) {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  const seekTo = useCallback(
    (seconds: number) => {
      if (chapterRef.current == null) {
        return;
      }
      const max = durationRef.current > 0 ? durationRef.current : seconds;
      const target = Math.max(0, Math.min(seconds, max));
      positionRef.current = target;
      setProgressState(p => ({ ...p, position: target }));
      if (endedRef.current) {
        endedRef.current = false;
        setEnded(false);
      }
      if (loaded) {
        videoRef.current?.seek(target);
      } else {
        startAtRef.current = target; // applied once the track loads
      }
      persistPosition();
    },
    [loaded, persistPosition],
  );

  const next = useCallback(() => {
    const ch = chapterRef.current;
    if (ch != null && ch < TOTAL_CHAPTERS) {
      playChapter(ch + 1, { autoplay: true });
    }
  }, [playChapter]);

  const previous = useCallback(() => {
    const ch = chapterRef.current;
    if (ch != null && ch > 1) {
      playChapter(ch - 1, { autoplay: true });
    }
  }, [playChapter]);

  const setSpeed = useCallback(
    (speed: PlaybackSpeed) => updatePrefs({ speed }),
    [updatePrefs],
  );

  const retry = useCallback(() => {
    if (chapterRef.current == null) {
      return;
    }
    startAtRef.current = positionRef.current;
    bufferingRef.current = false;
    setErrorMessage(null);
    setLoaded(false);
    setBuffering(false);
    setIntent(true);
    setSession(s => s + 1);
  }, [setIntent]);

  // ---- Native player callbacks ----------------------------------------------

  const onLoad = useCallback((e: OnLoadData) => {
    durationRef.current = e.duration;
    setDuration(e.duration);
    setLoaded(true);
    const startAt = startAtRef.current;
    if (startAt > 0 && startAt < e.duration) {
      videoRef.current?.seek(startAt);
    }
    startAtRef.current = 0;
  }, []);

  const onProgress = useCallback(
    (e: OnProgressData) => {
      positionRef.current = e.currentTime;
      setProgressState({ position: e.currentTime, buffered: e.playableDuration });
      if (e.seekableDuration > 0 && Math.abs(e.seekableDuration - durationRef.current) > 1) {
        durationRef.current = e.seekableDuration;
        setDuration(e.seekableDuration);
      }
      if (Date.now() - lastSaveRef.current > SAVE_INTERVAL_MS) {
        persistPosition();
      }
    },
    [persistPosition],
  );

  const onBuffer = useCallback((e: OnBufferData) => {
    bufferingRef.current = e.isBuffering;
    setBuffering(e.isBuffering);
  }, []);

  /**
   * Keeps JS in sync when playback is paused outside the app UI, e.g. from
   * the notification or lock screen. ExoPlayer also reports "not playing"
   * while buffering, so this waits briefly and ignores buffering and seeking.
   */
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPlaybackStateChanged = useCallback(
    (e: OnPlaybackStateChangedData) => {
      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
        syncTimer.current = null;
      }
      if (e.isSeeking) {
        return;
      }
      if (e.isPlaying && !wantsPlayRef.current) {
        setIntent(true);
      } else if (!e.isPlaying && wantsPlayRef.current) {
        syncTimer.current = setTimeout(() => {
          if (!bufferingRef.current && !endedRef.current && wantsPlayRef.current) {
            setIntent(false);
            persistPosition();
          }
        }, 600);
      }
    },
    [persistPosition, setIntent],
  );

  const onEnd = useCallback(() => {
    const ch = chapterRef.current;
    if (ch == null) {
      return;
    }
    positionRef.current = durationRef.current;
    persistPosition(true);
    if (prefsRef.current.autoplayNext && ch < TOTAL_CHAPTERS) {
      playChapter(ch + 1, { autoplay: true, startAt: 0 });
      return;
    }
    // Last chapter, or autoplay off: stop at the end and offer replay.
    endedRef.current = true;
    setEnded(true);
    setIntent(false);
    setProgressState(p => ({ ...p, position: durationRef.current }));
  }, [persistPosition, playChapter, setIntent]);

  const onError = useCallback(
    (e: OnVideoErrorData) => {
      console.warn('[player] playback error', e.error?.errorString ?? e.error);
      persistPosition();
      setErrorMessage(ERROR_MESSAGE);
      setIntent(false);
      setBuffering(false);
      bufferingRef.current = false;
    },
    [persistPosition, setIntent],
  );

  const onAudioFocusChanged = useCallback(
    ({ hasAudioFocus }: { hasAudioFocus: boolean }) => {
      // Another app (or a call) took audio focus: pause, and let the user resume.
      if (!hasAudioFocus && wantsPlayRef.current) {
        setIntent(false);
        persistPosition();
      }
    },
    [persistPosition, setIntent],
  );

  const onAudioBecomingNoisy = useCallback(() => {
    // Headphones unplugged: never blast audio from the speaker.
    setIntent(false);
    persistPosition();
  }, [persistPosition, setIntent]);

  // Persist position whenever the app goes to the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', appState => {
      if (appState !== 'active') {
        persistPosition();
      }
    });
    return () => sub.remove();
  }, [persistPosition]);

  useEffect(
    () => () => {
      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
      }
    },
    [],
  );

  // ---- Derived state ---------------------------------------------------------

  let status: PlaybackStatus;
  if (chapterNumber == null) {
    status = 'idle';
  } else if (errorMessage) {
    status = 'error';
  } else if (ended) {
    status = 'ended';
  } else if (!loaded) {
    status = 'loading';
  } else if (wantsPlay && buffering) {
    status = 'buffering';
  } else if (wantsPlay) {
    status = 'playing';
  } else {
    status = 'paused';
  }

  const state = useMemo<PlayerState>(
    () => ({
      chapterNumber,
      status,
      duration,
      speed: prefs.speed,
      errorMessage,
      hasPrevious: chapterNumber != null && chapterNumber > 1,
      hasNext: chapterNumber != null && chapterNumber < TOTAL_CHAPTERS,
    }),
    [chapterNumber, status, duration, prefs.speed, errorMessage],
  );

  // Callbacks change identity only when their inputs do. Expose a stable
  // object that always calls the latest version.
  const latest = useRef({ playChapter, play, pause, togglePlayPause, seekTo, next, previous, setSpeed, retry });
  latest.current = { playChapter, play, pause, togglePlayPause, seekTo, next, previous, setSpeed, retry };
  const actions = useMemo<PlayerActions>(
    () => ({
      playChapter: (n, o) => latest.current.playChapter(n, o),
      play: () => latest.current.play(),
      pause: () => latest.current.pause(),
      togglePlayPause: () => latest.current.togglePlayPause(),
      seekTo: s => latest.current.seekTo(s),
      next: () => latest.current.next(),
      previous: () => latest.current.previous(),
      setSpeed: s => latest.current.setSpeed(s),
      retry: () => latest.current.retry(),
    }),
    [],
  );

  const chapter = chapterNumber != null ? getChapter(chapterNumber) : undefined;

  const source = useMemo(
    () =>
      chapter
        ? {
            uri: chapter.audioUrl,
            metadata: {
              title: `${chapterLabel(chapter.number)} · ${chapter.titleHindi}`,
              artist: 'श्रीमद्भगवद्गीता',
              description: 'Bhagwat Geeta Hindi Audio',
            },
          }
        : undefined,
    [chapter],
  );

  return (
    <PlayerActionsContext.Provider value={actions}>
      <PlayerStateContext.Provider value={state}>
        <PlayerProgressContext.Provider value={progressState}>
          {children}
          {source && !errorMessage ? (
            <View style={styles.hidden} pointerEvents="none" importantForAccessibility="no-hide-descendants">
              <Video
                key={`${chapterNumber}-${session}`}
                ref={videoRef}
                source={source}
                paused={!wantsPlay}
                rate={prefs.speed}
                playInBackground
                playWhenInactive
                ignoreSilentSwitch="ignore"
                showNotificationControls
                progressUpdateInterval={500}
                onLoad={onLoad}
                onProgress={onProgress}
                onBuffer={onBuffer}
                onPlaybackStateChanged={onPlaybackStateChanged}
                onEnd={onEnd}
                onError={onError}
                onAudioFocusChanged={onAudioFocusChanged}
                onAudioBecomingNoisy={onAudioBecomingNoisy}
                style={styles.hidden}
              />
            </View>
          ) : null}
        </PlayerProgressContext.Provider>
      </PlayerStateContext.Provider>
    </PlayerActionsContext.Provider>
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 0, height: 0, opacity: 0 },
});

function useRequiredContext<T>(ctx: React.Context<T | null>, name: string): T {
  const value = useContext(ctx);
  if (value == null) {
    throw new Error(`${name} must be used inside <PlayerProvider>`);
  }
  return value;
}

export const usePlayerState = () => useRequiredContext(PlayerStateContext, 'usePlayerState');
export const usePlayerProgress = () => useRequiredContext(PlayerProgressContext, 'usePlayerProgress');
export const usePlayerActions = () => useRequiredContext(PlayerActionsContext, 'usePlayerActions');
