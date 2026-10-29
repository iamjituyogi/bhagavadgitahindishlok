import { useCallback } from 'react';
import { usePlayerActions, usePlayerState } from '../audio/PlayerProvider';
import { useAppNavigation } from '../navigation/NavigationContext';
import { useLibrary } from '../state/LibraryProvider';
import { progressRatio } from '../utils/time';

/**
 * Shared behaviour for any chapter list (Home, Chapters, Favorites), so every
 * list follows the same playback policy:
 *   - tapping a row starts that chapter and opens the full player
 *   - the round play button toggles in place, without leaving the list
 */
export function useChapterRowHandlers() {
  const { chapterNumber, status } = usePlayerState();
  const { playChapter, togglePlayPause } = usePlayerActions();
  const { openPlayer } = useAppNavigation();
  const { isFavorite, toggleFavorite, progress } = useLibrary();

  const isPlayingStatus = status === 'playing' || status === 'buffering' || status === 'loading';

  const onOpen = useCallback(
    (n: number) => {
      if (n !== chapterNumber || status === 'error') {
        playChapter(n, { autoplay: true });
      } else if (!isPlayingStatus) {
        playChapter(n, { autoplay: true });
      }
      openPlayer();
    },
    [chapterNumber, isPlayingStatus, openPlayer, playChapter, status],
  );

  const onPlayToggle = useCallback(
    (n: number) => {
      if (n === chapterNumber && status !== 'error') {
        togglePlayPause();
      } else {
        playChapter(n, { autoplay: true });
      }
    },
    [chapterNumber, playChapter, status, togglePlayPause],
  );

  const rowStateFor = useCallback(
    (n: number) => {
      const p = progress[n];
      return {
        isCurrent: n === chapterNumber,
        isPlaying: n === chapterNumber && isPlayingStatus,
        isFavorite: isFavorite(n),
        listened: p && p.duration > 0 ? progressRatio(p.position, p.duration) : null,
        completed: !!p?.completed,
      };
    },
    [chapterNumber, isFavorite, isPlayingStatus, progress],
  );

  return { onOpen, onPlayToggle, onToggleFavorite: toggleFavorite, rowStateFor };
}
