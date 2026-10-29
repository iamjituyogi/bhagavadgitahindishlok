import React, { useState } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { getChapter } from '../data/chapters';
import { useTheme } from '../theme/ThemeProvider';

type Props = {
  chapterNumber: number;
  style?: StyleProp<ViewStyle>;
  radius?: number;
};

/**
 * Local chapter artwork, fitted with `contain` so the whole picture shows and it never distorts.
 * If the image is missing or fails to decode, it falls back to a warm
 * panel showing the chapter number.
 */
export function ChapterArtwork({ chapterNumber, style, radius = 12 }: Props) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const chapter = getChapter(chapterNumber);
  const showImage = !!chapter?.image && !failed;

  return (
    <View
      style={[styles.frame, { borderRadius: radius, backgroundColor: colors.artworkFallback }, style]}
      accessibilityIgnoresInvertColors>
      {showImage ? (
        <Image
          source={chapter!.image}
          style={styles.image}
          resizeMode="contain"
          onError={() => setFailed(true)}
          accessible={false}
        />
      ) : (
        <View style={styles.fallback}>
          <Text style={[styles.om, { color: colors.secondary }]}>ॐ</Text>
          <Text style={[styles.num, { color: colors.textSecondary }]}>{chapterNumber}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  om: { fontSize: 22, fontWeight: '600' },
  num: { fontSize: 13, fontWeight: '600', marginTop: 2 },
});
