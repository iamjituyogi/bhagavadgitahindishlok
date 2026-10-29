import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { getChapter } from '../data/chapters';
import { useTheme } from '../theme/ThemeProvider';
import { DEFAULT_ART_RATIO, imageRatio } from '../utils/image';
import { ChapterArtwork } from './ChapterArtwork';

type Props = {
  chapterNumber: number;
  /** Outer width. Height follows the image's own ratio, so the whole picture is visible. */
  width: number;
  /** Adds a paper mat, a gold hairline and a small diamond — a framed-print look. */
  framed?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  /** Overlays (buttons, badges) positioned over the picture. */
  children?: React.ReactNode;
};

/** Chapter artwork at its native proportions. Never cropped, never stretched. */
export function ArtFrame({ chapterNumber, width, framed = true, radius = 14, style, children }: Props) {
  const { colors } = useTheme();
  const chapter = getChapter(chapterNumber);
  const ratio = chapter ? imageRatio(chapter.image) : DEFAULT_ART_RATIO;
  const pad = framed ? Math.max(3, Math.round(width * 0.025)) : 0;
  const innerW = width - pad * 2;
  const innerH = innerW / ratio;

  return (
    <View
      style={[
        styles.outer,
        {
          width,
          height: innerH + pad * 2,
          padding: pad,
          borderRadius: radius + pad,
          backgroundColor: framed ? colors.surface : 'transparent',
          borderColor: framed ? colors.borderStrong : 'transparent',
        },
        style,
      ]}>
      <ChapterArtwork chapterNumber={chapterNumber} style={{ width: innerW, height: innerH }} radius={radius} />
      {children}
      {framed ? <View style={[styles.diamond, { backgroundColor: colors.secondary, borderColor: colors.surface }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { borderWidth: StyleSheet.hairlineWidth * 2 },
  diamond: { position: 'absolute', top: -5, alignSelf: 'center', width: 10, height: 10, borderWidth: 2, transform: [{ rotate: '45deg' }] },
});
