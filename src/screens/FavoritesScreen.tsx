import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChapterGridCard } from '../components/ChapterGridCard';
import { ChapterListItem } from '../components/ChapterListItem';
import { EmptyState } from '../components/EmptyState';
import { FadeInView } from '../components/FadeInView';
import { ScreenHeader } from '../components/ScreenHeader';
import { CHAPTERS, getChapter } from '../data/chapters';
import { useChapterRowHandlers } from '../hooks/useChapterRowHandlers';
import { useAppNavigation } from '../navigation/NavigationContext';
import { useLibrary } from '../state/LibraryProvider';
import { useTheme } from '../theme/ThemeProvider';
import { MIN_TOUCH, radii, spacing, typography } from '../theme/tokens';

type Segment = 'favorites' | 'history';

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) {
    return 'अभी';
  }
  if (min < 60) {
    return `${min} मिनट पहले`;
  }
  const hr = Math.floor(min / 60);
  if (hr < 24) {
    return `${hr} घंटे पहले`;
  }
  const d = Math.floor(hr / 24);
  return d === 1 ? 'कल' : `${d} दिन पहले`;
}

/** "My library": saved favourites plus recent listening history. */
export function FavoritesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardW = Math.floor((width - spacing.md * 2 - spacing.md) / 2);
  const { contentBottomInset, setTab } = useAppNavigation();
  const { favorites, history, clearHistory } = useLibrary();
  const { onOpen, onPlayToggle, onToggleFavorite, rowStateFor } = useChapterRowHandlers();
  const [segment, setSegment] = useState<Segment>('favorites');

  const favChapters = useMemo(() => CHAPTERS.filter(c => favorites.includes(c.number)), [favorites]);

  const segments: { key: Segment; label: string; count: number }[] = [
    { key: 'favorites', label: 'पसंदीदा', count: favorites.length },
    { key: 'history', label: 'इतिहास', count: history.length },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: contentBottomInset }}>
      <FadeInView index={0}>
        <ScreenHeader title="मेरी सूची" subtitle="आपका संग्रह" />
      </FadeInView>
      <FadeInView index={1} style={styles.pad}>
        <View style={[styles.segmented, { backgroundColor: colors.surfaceMuted }]} accessibilityRole="tablist">
          {segments.map(s => {
            const selected = s.key === segment;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSegment(s.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={[styles.segment, selected && { backgroundColor: colors.primary }]}>
                <Text style={[styles.segmentText, { color: selected ? colors.onPrimary : colors.textSecondary }]}>
                  {s.label}
                  {s.count > 0 ? ` (${s.count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FadeInView>

      {segment === 'favorites' ? (
        favChapters.length === 0 ? (
          <EmptyState
            icon="heart"
            title="अभी कोई पसंदीदा अध्याय नहीं"
            message="किसी भी अध्याय के पास ♡ दबाकर उसे यहां सहेजें।"
            actionLabel="अध्याय देखें"
            onAction={() => setTab('chapters')}
          />
        ) : (
          <View style={styles.grid}>
            {favChapters.map((ch, i) => (
              <FadeInView key={ch.id} index={i}>
                <ChapterGridCard
                  chapter={ch}
                  width={cardW}
                  {...rowStateFor(ch.number)}
                  onOpen={onOpen}
                  onPlayToggle={onPlayToggle}
                  onToggleFavorite={onToggleFavorite}
                />
              </FadeInView>
            ))}
          </View>
        )
      ) : history.length === 0 ? (
        <EmptyState
          icon="clock"
          title="अभी कोई इतिहास नहीं"
          message="जो अध्याय आप सुनेंगे, वे यहां दिखाई देंगे।"
          actionLabel="सुनना शुरू करें"
          onAction={() => setTab('chapters')}
        />
      ) : (
        <View style={styles.list}>
          {history.map(entry => {
            const ch = getChapter(entry.chapter);
            if (!ch) {
              return null;
            }
            return (
              <View key={entry.chapter}>
                <ChapterListItem
                  chapter={ch}
                  {...rowStateFor(ch.number)}
                  onOpen={onOpen}
                  onPlayToggle={onPlayToggle}
                  onToggleFavorite={onToggleFavorite}
                />
                <Text style={[styles.when, { color: colors.textTertiary }]}>{relativeTime(entry.playedAt)}</Text>
              </View>
            );
          })}
          <Pressable onPress={clearHistory} accessibilityRole="button" style={styles.clear}>
            <Text style={[styles.clearText, { color: colors.primary }]}>इतिहास साफ़ करें</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: spacing.md },
  title: { ...typography.title },
  segmented: { flexDirection: 'row', borderRadius: radii.pill, padding: spacing.xxs, marginBottom: spacing.md },
  segment: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  segmentText: { ...typography.bodyStrong, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.md },
  list: { paddingHorizontal: spacing.md, gap: spacing.sm },
  when: { ...typography.caption, fontSize: 11, marginLeft: 60 + spacing.sm + spacing.xs + 1, marginTop: -2, marginBottom: spacing.xxs },
  clear: { alignSelf: 'center', minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: spacing.md, marginTop: spacing.sm },
  clearText: { ...typography.bodyStrong, fontSize: 14 },
});
