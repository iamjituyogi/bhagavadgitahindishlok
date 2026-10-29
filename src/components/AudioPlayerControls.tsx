import React from 'react';
import { StyleSheet, View } from 'react-native';
import { usePlayerActions, usePlayerState } from '../audio/PlayerProvider';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { IconButton } from './IconButton';
import { PlayPauseButton } from './PlayPauseButton';

/** Previous chapter · Play/Pause · Next chapter. */
export function AudioPlayerControls() {
  const { colors } = useTheme();
  const { status, hasPrevious, hasNext } = usePlayerState();
  const { togglePlayPause, previous, next, retry } = usePlayerActions();

  return (
    <View style={styles.row}>
      <IconButton
        icon="skip-back"
        size={30}
        color={colors.icon}
        onPress={previous}
        disabled={!hasPrevious}
        accessibilityLabel="पिछला अध्याय"
        style={styles.side}
      />
      <PlayPauseButton status={status} onPress={status === 'error' ? retry : togglePlayPause} size={76} />
      <IconButton
        icon="skip-forward"
        size={30}
        color={colors.icon}
        onPress={next}
        disabled={!hasNext}
        accessibilityLabel="अगला अध्याय"
        style={styles.side}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  side: { width: 56, height: 56 },
});
