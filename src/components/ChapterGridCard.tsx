import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chapter, chapterLabel } from '../data/chapters';
import { useTheme } from '../theme/ThemeProvider';
import { radii, spacing, typography } from '../theme/tokens';
import { ArtFrame } from './ArtFrame';
import { Icon } from './Icon';
import { PlayingIndicator } from './PlayingIndicator';
import { PressableScale } from './PressableScale';

type Props = {
  chapter: Chapter;
  width: number;
  isCurrent: boolean;
  isPlaying: boolean;
  isFavorite: boolean;
  /** 0–1 listened ratio, or null if never started. */
  listened: number | null;
  completed: boolean;
  onOpen: (chapterNumber: number) => void;
  onPlayToggle: (chapterNumber: number) => void;
  onToggleFavorite: (chapterNumber: number) => void;
};

/** Gallery card: the complete artwork, with favourite and play controls over it. */
function ChapterGridCardBase({
  chapter,
  width,
  isCurrent,
  isPlaying,
  isFavorite,
  listened,
  completed,
  onOpen,
  onPlayToggle,
  onToggleFavorite,
}: Props) {
  const { colors } = useTheme();
  const status = completed ? 'पूर्ण' : listened != null && listened > 0 ? `${Math.round(listened * 100)}% सुना` : null;
  const playing = isCurrent && isPlaying;

  return (
    <PressableScale
      onPress={() => onOpen(chapter.number)}
      to={0.97}
      accessibilityRole="button"
      accessibilityLabel={`${chapterLabel(chapter.number)}, ${chapter.titleHindi}${isCurrent ? ', अभी चल रहा है' : ''}`}
      accessibilityHint="प्लेयर खोलें"
      style={{ width }}>
      <ArtFrame chapterNumber={chapter.number} width={width}>
        <Pressable
          onPress={() => onToggleFavorite(chapter.number)}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'पसंदीदा से हटाएं' : 'पसंदीदा में जोड़ें'}
          accessibilityState={{ selected: isFavorite }}
          hitSlop={6}
          style={[styles.fab, styles.fav, { backgroundColor: 'rgba(255,250,238,0.92)' }]}>
          <Icon name={isFavorite ? 'heart-filled' : 'heart'} size={18} color={isFavorite ? colors.primary : colors.icon} />
        </Pressable>
        <Pressable
          onPress={() => onPlayToggle(chapter.number)}
          accessibilityRole="button"
          accessibilityLabel={playing ? `${chapterLabel(chapter.number)} रोकें` : `${chapterLabel(chapter.number)} चलाएं`}
          hitSlop={6}
          style={[styles.fab, styles.play, { backgroundColor: colors.primary }]}>
          <View style={playing ? undefined : styles.nudge}>
            <Icon name={playing ? 'pause' : 'play'} size={18} color={colors.onPrimary} />
          </View>
        </Pressable>
        {isCurrent ? (
          <View style={[styles.badge, { backgroundColor: colors.deep }]}>
            <PlayingIndicator color={colors.onDeep} active={isPlaying} size={12} />
          </View>
        ) : null}
      </ArtFrame>

      <View style={styles.caption}>
        <Text style={[styles.label, { color: colors.secondary }]}>{chapterLabel(chapter.number)}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {chapter.titleHindi}
        </Text>
        {status ? (
          <View style={styles.statusRow}>
            {completed ? (
              <Icon name="check" size={13} color={colors.secondary} />
            ) : (
              <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
                <View style={[styles.fill, { width: `${(listened ?? 0) * 100}%`, backgroundColor: colors.progressFill }]} />
              </View>
            )}
            <Text style={[styles.status, { color: colors.textTertiary }]}>{status}</Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

export const ChapterGridCard = memo(ChapterGridCardBase);

const styles = StyleSheet.create({
  fab: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  fav: { top: 10, right: 10, width: 34, height: 34 },
  play: { bottom: 10, right: 10, width: 42, height: 42 },
  nudge: { marginLeft: 2 },
  badge: { position: 'absolute', top: 10, left: 10, height: 26, paddingHorizontal: 9, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  caption: { paddingTop: spacing.xs, paddingHorizontal: 2 },
  label: { ...typography.label, fontSize: 11 },
  title: { ...typography.heading, fontSize: 16, lineHeight: 24 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  track: { width: 44, height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 3, borderRadius: 2 },
  status: { ...typography.caption, fontSize: 11 },
});
