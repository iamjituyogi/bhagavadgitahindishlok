import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, ListRenderItem, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChapterGridCard } from '../components/ChapterGridCard';
import { EmptyState } from '../components/EmptyState';
import { FadeInView } from '../components/FadeInView';
import { Icon } from '../components/Icon';
import { IconButton } from '../components/IconButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { Chapter, CHAPTERS } from '../data/chapters';
import { useChapterRowHandlers } from '../hooks/useChapterRowHandlers';
import { useAppNavigation } from '../navigation/NavigationContext';
import { useTheme } from '../theme/ThemeProvider';
import { radii, spacing, typography } from '../theme/tokens';

const GAP = spacing.md;

function matches(chapter: Chapter, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    String(chapter.number) === q ||
    chapter.titleHindi.includes(q) ||
    chapter.titleEnglish.toLowerCase().includes(q) ||
    chapter.description.includes(q)
  );
}

export function ChaptersScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { contentBottomInset } = useAppNavigation();
  const { onOpen, onPlayToggle, onToggleFavorite, rowStateFor } = useChapterRowHandlers();
  const [query, setQuery] = useState('');

  const cardW = Math.floor((width - spacing.md * 2 - GAP) / 2);
  const data = useMemo(() => CHAPTERS.filter(c => matches(c, query)), [query]);

  const renderItem: ListRenderItem<Chapter> = useCallback(
    ({ item, index }) => (
      <FadeInView index={index % 6}>
        <ChapterGridCard
          chapter={item}
          width={cardW}
          {...rowStateFor(item.number)}
          onOpen={onOpen}
          onPlayToggle={onPlayToggle}
          onToggleFavorite={onToggleFavorite}
        />
      </FadeInView>
    ),
    [cardW, onOpen, onPlayToggle, onToggleFavorite, rowStateFor],
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={data}
        numColumns={2}
        keyExtractor={c => c.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.column}
        contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: contentBottomInset, paddingHorizontal: spacing.md }}
        initialNumToRender={6}
        windowSize={7}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerInset}>
              <ScreenHeader title="सभी अध्याय" subtitle="श्रीमद्भगवद्गीता · 18 अध्याय" />
            </View>
            <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
              <Icon name="search" size={18} color={colors.iconMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="अध्याय खोजें (नाम या संख्या)"
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, { color: colors.textPrimary }]}
                returnKeyType="search"
                accessibilityLabel="अध्याय खोजें"
              />
              {query ? (
                <IconButton icon="close" size={18} color={colors.iconMuted} onPress={() => setQuery('')} accessibilityLabel="खोज साफ़ करें" />
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="search" title="कोई अध्याय नहीं मिला" message="कृपया दूसरा नाम या अध्याय संख्या (1–18) आज़माएं।" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  column: { gap: GAP, marginBottom: spacing.lg },
  header: { marginBottom: spacing.md },
  headerInset: { marginHorizontal: -spacing.md },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    minHeight: 50,
    gap: spacing.xs,
  },
  input: { flex: 1, ...typography.body, paddingVertical: spacing.sm },
});
