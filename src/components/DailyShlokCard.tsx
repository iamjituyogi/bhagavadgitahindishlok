import React, { useMemo } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { getShlokForDate } from '../data/shloks';
import { useTheme } from '../theme/ThemeProvider';
import { elevation, radii, spacing, typography } from '../theme/tokens';
import { IconButton } from './IconButton';
import { Mandala, OrnamentDivider } from './Ornaments';

/** Shows the verified shlok of the day. Renders nothing if no verified content exists. */
export function DailyShlokCard() {
  const { colors } = useTheme();
  const shlok = useMemo(() => getShlokForDate(new Date()), []);
  if (!shlok) {
    return null;
  }

  const reference = `श्रीमद्भगवद्गीता ${shlok.chapter}.${shlok.verse}`;

  const onShare = () => {
    const parts = [shlok.sanskrit, shlok.hindiMeaning, `— ${reference}`].filter(Boolean);
    Share.share({ message: parts.join('\n\n') }).catch(() => undefined);
  };

  return (
    <View style={[styles.card, elevation(colors.shadow, 2), { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.watermark} pointerEvents="none">
        <Mandala size={220} color={colors.secondary} opacity={0.14} />
      </View>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.secondary }]}>आज का श्लोक</Text>
        <IconButton icon="share" size={20} color={colors.iconMuted} onPress={onShare} accessibilityLabel="श्लोक साझा करें" />
      </View>
      <OrnamentDivider width={96} />
      <Text style={[styles.sanskrit, { color: colors.textPrimary }]} selectable>
        {shlok.sanskrit}
      </Text>
      {shlok.hindiMeaning ? (
        <Text style={[styles.meaning, { color: colors.textSecondary }]}>{shlok.hindiMeaning}</Text>
      ) : null}
      <Text style={[styles.ref, { color: colors.textTertiary }]}>
        — {reference}
        {shlok.meaningSource ? ` · ${shlok.meaningSource}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  watermark: { position: 'absolute', right: -70, top: -60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { ...typography.label },
  
  sanskrit: { ...typography.shlok, textAlign: 'center', marginTop: spacing.md },
  meaning: { ...typography.body, marginTop: spacing.md, textAlign: 'center' },
  ref: { ...typography.caption, marginTop: spacing.md, textAlign: 'center' },
});
