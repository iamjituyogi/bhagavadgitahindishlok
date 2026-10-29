import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chapter, chapterLabel } from '../data/chapters';
import { useTheme } from '../theme/ThemeProvider';
import { elevation, MIN_TOUCH, radii, spacing, typography } from '../theme/tokens';
import { ArtFrame } from './ArtFrame';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { PlayingIndicator } from './PlayingIndicator';
import { PressableScale } from './PressableScale';

const ART_W = 52;

type Props = {
  chapter: Chapter;
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

function ChapterListItemBase({
  chapter,
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

  const statusText = completed ? 'पूर्ण' : listened != null && listened > 0 ? `${Math.round(listened * 100)}% सुना` : null;

  return (
    <PressableScale
      onPress={() => onOpen(chapter.number)}
      to={0.98}
      accessibilityRole="button"
      accessibilityLabel={`${chapterLabel(chapter.number)}, ${chapter.titleHindi}${isCurrent ? ', अभी चल रहा है' : ''}`}
      accessibilityHint="प्लेयर खोलें"
      style={[
        styles.row,
        !isCurrent && elevation(colors.shadow, 1),
        {
          backgroundColor: isCurrent ? colors.primarySoft : colors.card,
          borderColor: isCurrent ? colors.primary : colors.border,
        },
      ]}>
      <View>
        <ArtFrame chapterNumber={chapter.number} width={ART_W} framed={false} radius={radii.sm} />
        {isCurrent ? (
          <View style={[styles.artBadge, { backgroundColor: colors.scrim }]}>
            <PlayingIndicator color="#FFFFFF" active={isPlaying} size={14} />
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={[styles.label, { color: colors.secondary }]}>{chapterLabel(chapter.number).toUpperCase()}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {chapter.titleHindi}
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={1}>
          {chapter.description}
        </Text>
        {statusText ? (
          <View style={styles.statusRow}>
            {!completed && listened != null ? (
              <View style={[styles.miniTrack, { backgroundColor: colors.progressTrack }]}>
                <View style={[styles.miniFill, { width: `${listened * 100}%`, backgroundColor: colors.progressFill }]} />
              </View>
            ) : (
              <Icon name="check" size={14} color={colors.secondary} />
            )}
            <Text style={[styles.status, { color: colors.textTertiary }]}>{statusText}</Text>
          </View>
        ) : null}
      </View>

      <IconButton
        icon={isFavorite ? 'heart-filled' : 'heart'}
        color={isFavorite ? colors.primary : colors.iconMuted}
        size={22}
        onPress={() => onToggleFavorite(chapter.number)}
        accessibilityLabel={isFavorite ? 'पसंदीदा से हटाएं' : 'पसंदीदा में जोड़ें'}
        selected={isFavorite}
      />
      <Pressable
        onPress={() => onPlayToggle(chapter.number)}
        accessibilityRole="button"
        accessibilityLabel={isCurrent && isPlaying ? `${chapterLabel(chapter.number)} रोकें` : `${chapterLabel(chapter.number)} चलाएं`}
        hitSlop={4}
        style={({ pressed }) => [
          styles.play,
          {
            backgroundColor: isCurrent ? colors.primary : colors.surfaceMuted,
            borderColor: isCurrent ? colors.primary : colors.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}>
        <View style={!(isCurrent && isPlaying) && styles.playNudge}>
          <Icon
            name={isCurrent && isPlaying ? 'pause' : 'play'}
            size={18}
            color={isCurrent ? colors.onPrimary : colors.primary}
          />
        </View>
      </Pressable>
    </PressableScale>
  );
}

export const ChapterListItem = memo(ChapterListItemBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  artBadge: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  label: { ...typography.label, fontSize: 11 },
  title: { ...typography.heading, fontSize: 17, marginTop: 1 },
  desc: { ...typography.caption },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxs },
  miniTrack: { width: 48, height: 3, borderRadius: 2, overflow: 'hidden' },
  miniFill: { height: 3, borderRadius: 2 },
  status: { ...typography.caption, fontSize: 12 },
  play: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: spacing.xxs,
    minWidth: 40,
  },
  playNudge: { marginLeft: 2 },
});

export const CHAPTER_ROW_HEIGHT = Math.round(ART_W / (9 / 16)) + spacing.xs * 2 + 2;
export const MIN_ROW_TOUCH = MIN_TOUCH;
