import React from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerActions, usePlayerState } from '../audio/PlayerProvider';
import { ArtFrame } from '../components/ArtFrame';
import { DailyShlokCard } from '../components/DailyShlokCard';
import { FadeInView } from '../components/FadeInView';
import { Icon } from '../components/Icon';
import { Mandala } from '../components/Ornaments';
import { PressableScale } from '../components/PressableScale';
import { SectionHeader } from '../components/SectionHeader';
import { CHAPTERS, chapterLabel, getChapter, TOTAL_CHAPTERS } from '../data/chapters';
import { useAppNavigation } from '../navigation/NavigationContext';
import { useLibrary } from '../state/LibraryProvider';
import { useTheme } from '../theme/ThemeProvider';
import { elevation, MIN_TOUCH, radii, spacing, typography } from '../theme/tokens';
import { formatTime, progressRatio } from '../utils/time';

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) {
    return 'सुप्रभात';
  }
  if (h < 17) {
    return 'नमस्कार';
  }
  return 'शुभ संध्या';
}

export function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { setTab, openPlayer, contentBottomInset } = useAppNavigation();
  const { playChapter } = usePlayerActions();
  const { chapterNumber, status } = usePlayerState();
  const { history, lastPlayed, favorites, progress } = useLibrary();

  const featuredNumber = lastPlayed ?? 1;
  const featured = getChapter(featuredNumber);
  const saved = progress[featuredNumber];
  const ratio = saved ? (saved.completed ? 1 : progressRatio(saved.position, saved.duration)) : 0;
  const isActive = chapterNumber === featuredNumber && status !== 'error';
  const completed = Object.values(progress).filter(p => p.completed).length;
  const recent = history.filter(h => h.chapter !== featuredNumber).slice(0, 8);

  const onFeaturedPress = () => {
    if (!isActive) {
      const startAt = saved && !saved.completed ? saved.position : 0;
      playChapter(featuredNumber, { startAt, autoplay: true });
    } else if (status === 'paused' || status === 'ended') {
      playChapter(featuredNumber, { autoplay: true });
    }
    openPlayer();
  };

  const openChapter = (n: number) => {
    playChapter(n, { autoplay: true });
    openPlayer();
  };

  const featArtW = Math.floor((width - spacing.md * 2) * 0.42);
  const meta = saved?.completed
    ? 'पूर्ण · फिर से सुनें'
    : saved && saved.duration > 0
    ? `${Math.round(ratio * 100)}% · ${formatTime(saved.position)} / ${formatTime(saved.duration)}`
    : null;

  const stats = [
    { value: `${completed}/${TOTAL_CHAPTERS}`, label: 'पूर्ण अध्याय' },
    { value: String(favorites.length), label: 'पसंदीदा' },
    { value: String(history.length), label: 'सुने गए' },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: contentBottomInset }}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <FadeInView index={0}>
        <View style={styles.headerWrap}>
          <View style={styles.mandala} pointerEvents="none">
            <Mandala size={240} color={colors.secondary} opacity={0.17} />
          </View>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.greeting, { color: colors.secondary }]}>{greeting(new Date())}</Text>
              <Text style={[styles.appName, { color: colors.textPrimary }]} accessibilityRole="header">
                भगवद गीता
              </Text>
              <Text style={[styles.tagline, { color: colors.textSecondary }]}>हिंदी ऑडियो में सुनिए, समझिए</Text>
            </View>
            <View style={[styles.om, { backgroundColor: colors.deep }]}>
              <Text style={[styles.omText, { color: colors.onDeep }]} accessibilityLabel="ॐ">
                ॐ
              </Text>
            </View>
          </View>
        </View>
      </FadeInView>

      {/* Featured chapter */}
      {featured ? (
        <FadeInView index={1} style={styles.pad}>
          <View style={[styles.featured, elevation(colors.shadow, 2), { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
            <ArtFrame chapterNumber={featured.number} width={featArtW} />
            <View style={styles.featBody}>
              <Text style={[styles.kicker, { color: colors.secondary }]}>
                {lastPlayed != null ? 'जहां छोड़ा था' : 'यहां से शुरू करें'}
              </Text>
              <Text style={[styles.featLabel, { color: colors.primary }]}>{chapterLabel(featured.number)}</Text>
              <Text style={[styles.featTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {featured.titleHindi}
              </Text>
              <Text style={[styles.featDesc, { color: colors.textSecondary }]} numberOfLines={3}>
                {featured.description}
              </Text>
              {meta ? (
                <View style={styles.progressBlock}>
                  <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
                    <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: colors.progressFill }]} />
                  </View>
                  <Text style={[styles.meta, { color: colors.textTertiary }]}>{meta}</Text>
                </View>
              ) : null}
              <PressableScale onPress={onFeaturedPress} accessibilityRole="button" style={[styles.cta, { backgroundColor: colors.primary }]}>
                <Icon name={isActive ? 'headphones' : 'play'} size={16} color={colors.onPrimary} />
                <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
                  {isActive ? 'प्लेयर खोलें' : lastPlayed != null ? 'जारी रखें' : 'सुनना शुरू करें'}
                </Text>
              </PressableScale>
            </View>
          </View>
        </FadeInView>
      ) : null}

      {/* Journey */}
      <FadeInView index={2} style={[styles.pad, styles.section]}>
        <View style={[styles.journey, { backgroundColor: colors.deep }]}>
          {stats.map((s, i) => (
            <View key={s.label} style={[styles.stat, i > 0 && { borderLeftColor: colors.onDeep + '40', borderLeftWidth: StyleSheet.hairlineWidth * 2 }]}>
              <Text style={[styles.statValue, { color: colors.onDeep }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.onDeep }]} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </FadeInView>

      {/* Daily Shlok */}
      <FadeInView index={3} style={[styles.pad, styles.section]}>
        <DailyShlokCard />
      </FadeInView>

      {/* Recently played */}
      {recent.length > 0 ? (
        <FadeInView index={4} style={styles.section}>
          <View style={styles.pad}>
            <SectionHeader title="हाल ही में सुने गए" />
          </View>
          <Carousel numbers={recent.map(r => r.chapter)} onOpen={openChapter} />
        </FadeInView>
      ) : null}

      {/* Gallery */}
      <FadeInView index={5} style={styles.section}>
        <View style={styles.pad}>
          <SectionHeader title="अध्याय गैलरी" actionLabel="सभी देखें" onAction={() => setTab('chapters')} />
        </View>
        <Carousel numbers={CHAPTERS.map(c => c.number)} onOpen={openChapter} />
      </FadeInView>
    </ScrollView>
  );
}

function Carousel({ numbers, onOpen }: { numbers: number[]; onOpen: (n: number) => void }) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
      {numbers.map(n => {
        const ch = getChapter(n);
        if (!ch) {
          return null;
        }
        return (
          <PressableScale
            key={n}
            onPress={() => onOpen(n)}
            accessibilityRole="button"
            accessibilityLabel={`${chapterLabel(n)}, ${ch.titleHindi}`}
            style={styles.card}>
            <ArtFrame chapterNumber={n} width={CARD_W} />
            <Text style={[styles.cardLabel, { color: colors.secondary }]}>{chapterLabel(n)}</Text>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {ch.titleHindi}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const CARD_W = 128;

const styles = StyleSheet.create({
  pad: { paddingHorizontal: spacing.md },
  section: { marginTop: spacing.xl },
  headerWrap: { marginBottom: spacing.md },
  mandala: { position: 'absolute', right: -80, top: -70 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.md },
  headerText: { flex: 1, minWidth: 0 },
  greeting: { ...typography.label, textTransform: 'uppercase' },
  appName: { ...typography.display, fontSize: 36, lineHeight: 50 },
  tagline: { ...typography.caption },
  om: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  omText: { fontSize: 28, lineHeight: 38, fontWeight: '500' },
  featured: { flexDirection: 'row', gap: spacing.md, padding: spacing.sm, borderRadius: radii.xl, borderWidth: StyleSheet.hairlineWidth * 2 },
  featBody: { flex: 1, minWidth: 0, paddingVertical: spacing.xs, paddingRight: spacing.xs },
  kicker: { ...typography.label },
  featLabel: { ...typography.bodyStrong, fontSize: 13, marginTop: spacing.xs },
  featTitle: { ...typography.title, fontSize: 22, lineHeight: 32 },
  featDesc: { ...typography.caption, marginTop: spacing.xxs },
  progressBlock: { marginTop: spacing.sm },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
  meta: { ...typography.caption, fontSize: 11, marginTop: 4, fontVariant: ['tabular-nums'] },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: MIN_TOUCH - 4,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    marginTop: spacing.md,
  },
  ctaText: { ...typography.bodyStrong, fontSize: 14 },
  journey: { flexDirection: 'row', borderRadius: radii.xl, paddingVertical: spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.title, fontSize: 24, lineHeight: 32 },
  statLabel: { ...typography.caption, fontSize: 11, opacity: 0.8 },
  carousel: { paddingHorizontal: spacing.md, paddingTop: 6, gap: spacing.md },
  card: { width: CARD_W },
  cardLabel: { ...typography.label, fontSize: 11, marginTop: spacing.xs },
  cardTitle: { ...typography.bodyStrong, fontSize: 14 },
});
