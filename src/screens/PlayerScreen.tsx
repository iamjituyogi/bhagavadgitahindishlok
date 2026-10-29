import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { usePlayerActions, usePlayerState } from '../audio/PlayerProvider';
import { AudioPlayerControls } from '../components/AudioPlayerControls';
import { AudioProgressBar } from '../components/AudioProgressBar';
import { ArtFrame } from '../components/ArtFrame';
import { Icon } from '../components/Icon';
import { IconButton } from '../components/IconButton';
import { Mandala } from '../components/Ornaments';
import { PlaybackSpeedSelector } from '../components/PlaybackSpeedSelector';
import { PlayingIndicator } from '../components/PlayingIndicator';
import { chapterLabel, getChapter, TOTAL_CHAPTERS } from '../data/chapters';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useLibrary } from '../state/LibraryProvider';
import { useTheme } from '../theme/ThemeProvider';
import { MIN_TOUCH, radii, spacing, typography } from '../theme/tokens';
import { DEFAULT_ART_RATIO, imageRatio } from '../utils/image';

export function PlayerScreen({ onClose }: { onClose: () => void }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const reduced = useReducedMotion();
  const { chapterNumber, status, speed, errorMessage } = usePlayerState();
  const { setSpeed, retry } = usePlayerActions();
  const { isFavorite, toggleFavorite, prefs, updatePrefs } = useLibrary();

  const chapter = chapterNumber != null ? getChapter(chapterNumber) : undefined;
  const isPlaying = status === 'playing' || status === 'buffering';

  // Chapter change: fade and scale the artwork in.
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) {
      enter.setValue(1);
      return;
    }
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [chapterNumber, reduced, enter]);

  // Gentle "breathing" while audio plays. Calm, no rotation.
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isPlaying || reduced) {
      Animated.timing(breathe, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isPlaying, reduced, breathe]);

  if (!chapter) {
    return null;
  }

  const fav = isFavorite(chapter.number);

  // Size the artwork to the space left over so the whole picture is visible.
  // Frame height ≈ width × (0.95 / ratio + 0.05), see ArtFrame.
  const ratio = chapter.image ? imageRatio(chapter.image) : DEFAULT_ART_RATIO;
  const artW = Math.max(0, Math.min(box.w - spacing.sm, (box.h - spacing.md) / (0.95 / ratio + 0.05)));
  const onArtLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const scale = Animated.multiply(
    enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }),
    breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }),
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Ambient blurred artwork background */}
      <Image
        source={chapter.image}
        style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.4 : 0.2 }]}
        blurRadius={30}
        resizeMode="cover"
        accessible={false}
      />
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 1 1">
        <Defs>
          <LinearGradient id="playerFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.background} stopOpacity="0.35" />
            <Stop offset="0.55" stopColor={colors.background} stopOpacity="0.85" />
            <Stop offset="1" stopColor={colors.background} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="1" height="1" fill="url(#playerFade)" />
      </Svg>

      <View style={styles.mandala} pointerEvents="none">
        <Mandala size={460} color={colors.secondary} opacity={isDark ? 0.1 : 0.16} />
      </View>

      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <IconButton icon="chevron-down" size={28} onPress={onClose} accessibilityLabel="प्लेयर बंद करें" />
          <View style={styles.topCenter}>
            <Text style={[styles.topKicker, { color: colors.textTertiary }]}>अभी सुन रहे हैं</Text>
            <Text style={[styles.topTitle, { color: colors.textPrimary }]}>
              {chapterLabel(chapter.number)} / {TOTAL_CHAPTERS}
            </Text>
          </View>
          <IconButton
            icon={fav ? 'heart-filled' : 'heart'}
            color={fav ? colors.primary : colors.icon}
            onPress={() => toggleFavorite(chapter.number)}
            accessibilityLabel={fav ? 'पसंदीदा से हटाएं' : 'पसंदीदा में जोड़ें'}
            selected={fav}
          />
        </View>

        {/* Artwork */}
        <View style={styles.artArea} onLayout={onArtLayout}>
          {artW > 0 ? (
            <Animated.View
              style={[
                styles.artShadow,
                { width: artW, shadowColor: colors.shadow, opacity: enter, transform: [{ scale }] },
              ]}>
              <ArtFrame chapterNumber={chapter.number} width={artW} radius={radii.md} />
            </Animated.View>
          ) : null}
        </View>

        {/* Track info */}
        <View style={styles.info}>
          <View style={styles.kickerRow}>
            <PlayingIndicator color={colors.secondary} active={isPlaying} size={12} />
            <Text style={[styles.kicker, { color: colors.secondary }]}>{chapterLabel(chapter.number)}</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2} accessibilityRole="header">
            {chapter.titleHindi}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            श्रीमद्भगवद्गीता · {chapter.titleEnglish}
          </Text>
        </View>

        {/* Error */}
        {status === 'error' ? (
          <View style={[styles.error, { backgroundColor: colors.dangerSurface }]} accessibilityLiveRegion="polite">
            <Icon name="alert" size={18} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{errorMessage}</Text>
            <Pressable onPress={retry} accessibilityRole="button" style={styles.retry} hitSlop={6}>
              <Icon name="refresh" size={16} color={colors.danger} />
              <Text style={[styles.retryText, { color: colors.danger }]}>पुनः प्रयास</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Progress */}
        <View style={styles.progress}>
          <AudioProgressBar />
        </View>

        {/* Primary controls */}
        <AudioPlayerControls />

        {/* Secondary controls */}
        <View style={styles.secondary}>
          <PlaybackSpeedSelector value={speed} onChange={setSpeed} />
          <Pressable
            onPress={() => updatePrefs({ autoplayNext: !prefs.autoplayNext })}
            accessibilityRole="switch"
            accessibilityState={{ checked: prefs.autoplayNext }}
            accessibilityLabel="अगला अध्याय स्वतः चलाएं"
            style={({ pressed }) => [
              styles.chip,
              {
                borderColor: prefs.autoplayNext ? colors.primary : colors.borderStrong,
                backgroundColor: prefs.autoplayNext ? colors.surfaceMuted : 'transparent',
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <Icon name="skip-forward" size={14} color={prefs.autoplayNext ? colors.primary : colors.iconMuted} />
            <Text style={[styles.chipText, { color: prefs.autoplayNext ? colors.primary : colors.textSecondary }]}>
              स्वतः अगला {prefs.autoplayNext ? 'चालू' : 'बंद'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  fill: { flex: 1 },
  topBar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: -spacing.sm },
  topCenter: { alignItems: 'center' },
  topKicker: { ...typography.label, fontSize: 10 },
  topTitle: { ...typography.bodyStrong, fontSize: 14 },
  artArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xs, paddingBottom: spacing.md },
  artShadow: { shadowOpacity: 0.3, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  mandala: { position: 'absolute', left: -100, top: 120 },
  info: { alignItems: 'center', marginBottom: spacing.sm, marginTop: spacing.xs },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  kicker: { ...typography.label },
  title: { ...typography.title, fontSize: 24, textAlign: 'center', marginTop: spacing.xxs },
  subtitle: { ...typography.caption, marginTop: 2 },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  errorText: { ...typography.caption, flex: 1 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, minHeight: MIN_TOUCH, paddingHorizontal: spacing.xs },
  retryText: { ...typography.bodyStrong, fontSize: 13 },
  progress: { marginBottom: spacing.sm },
  secondary: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { ...typography.caption, fontWeight: '500' },
});
