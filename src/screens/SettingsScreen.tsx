import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerActions } from '../audio/PlayerProvider';
import { IconButton } from '../components/IconButton';
import { formatSpeed, PlaybackSpeedSelector } from '../components/PlaybackSpeedSelector';
import { FadeInView } from '../components/FadeInView';
import { Mandala } from '../components/Ornaments';
import { ScreenHeader } from '../components/ScreenHeader';
import { SettingsRow, SettingsSection, SettingsSwitch } from '../components/SettingsSection';
import { ThemeSelector } from '../components/ThemeSelector';
import { APP_NAME, APP_VERSION } from '../config/app';
import { AUDIO_BASE_URL } from '../data/chapters';
import { useAppNavigation } from '../navigation/NavigationContext';
import { useLibrary } from '../state/LibraryProvider';
import { useTheme } from '../theme/ThemeProvider';
import { elevation, radii, spacing, typography } from '../theme/tokens';
import { Icon } from '../components/Icon';

type InfoKey = 'about' | 'privacy' | null;

export function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { contentBottomInset } = useAppNavigation();
  const { prefs, updatePrefs } = useLibrary();
  const { setSpeed } = usePlayerActions();
  const [info, setInfo] = useState<InfoKey>(null);

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: contentBottomInset }}>
        <FadeInView index={0}>
          <ScreenHeader title="सेटिंग्स" subtitle="अपनी पसंद" />
        </FadeInView>

        <View style={styles.body}>
          {/* Brand card */}
          <FadeInView index={1}>
            <View style={[styles.brand, elevation(colors.shadow, 2), { backgroundColor: colors.deep }]}>
              <View style={styles.brandMandala} pointerEvents="none">
                <Mandala size={170} color={colors.onDeep} opacity={0.22} />
              </View>
              <View style={[styles.brandOm, { borderColor: colors.onDeep }]}>
                <Text style={[styles.brandOmText, { color: colors.onDeep }]}>ॐ</Text>
              </View>
              <View style={styles.brandText}>
                <Text style={[styles.brandName, { color: colors.onDeep }]} numberOfLines={1}>
                  {APP_NAME}
                </Text>
                <Text style={[styles.brandSub, { color: colors.onDeep }]}>संस्करण {APP_VERSION} · 18 अध्याय</Text>
              </View>
            </View>
          </FadeInView>

          <FadeInView index={2}>
            <SettingsSection title="दिखावट">
              <ThemeSelector />
            </SettingsSection>
          </FadeInView>

          <FadeInView index={3}>
            <SettingsSection title="प्लेबैक">
              <SettingsRow
                icon="gauge"
                title="प्लेबैक गति"
                subtitle={`हर अध्याय ${formatSpeed(prefs.speed)} गति से चलेगा`}
                right={<PlaybackSpeedSelector value={prefs.speed} onChange={setSpeed} variant="row" />}
              />
              <SettingsRow
                icon="clock"
                title="जहां छोड़ा वहीं से सुनें"
                subtitle="अध्याय दोबारा खोलने पर पिछली जगह से शुरू करें"
                right={
                  <SettingsSwitch
                    label="जहां छोड़ा वहीं से सुनें"
                    value={prefs.resumePosition}
                    onValueChange={v => updatePrefs({ resumePosition: v })}
                  />
                }
              />
              <SettingsRow
                icon="skip-forward"
                title="अगला अध्याय स्वतः चलाएं"
                subtitle="अध्याय पूरा होने पर अगला शुरू करें (अध्याय 18 पर रुकेगा)"
                right={
                  <SettingsSwitch
                    label="अगला अध्याय स्वतः चलाएं"
                    value={prefs.autoplayNext}
                    onValueChange={v => updatePrefs({ autoplayNext: v })}
                  />
                }
              />
            </SettingsSection>
          </FadeInView>

          <FadeInView index={4}>
            <SettingsSection title="ऐप की जानकारी">
              <SettingsRow icon="info" title="ऐप के बारे में" onPress={() => setInfo('about')} right={<Chevron />} />
              <SettingsRow icon="shield" title="गोपनीयता नीति" onPress={() => setInfo('privacy')} right={<Chevron />} />
            </SettingsSection>
          </FadeInView>
        </View>
      </ScrollView>

      <InfoSheet infoKey={info} onClose={() => setInfo(null)} />
    </>
  );
}

function Chevron() {
  const { colors } = useTheme();
  return <Icon name="chevron-right" size={18} color={colors.iconMuted} />;
}

function InfoSheet({ infoKey, onClose }: { infoKey: InfoKey; onClose: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const content =
    infoKey === 'about'
      ? {
          title: 'ऐप के बारे में',
          body: [
            `${APP_NAME} में श्रीमद्भगवद्गीता के सभी 18 अध्याय हिंदी ऑडियो में सुने जा सकते हैं।`,
            'हर अध्याय का अपना चित्र है। आप पसंदीदा अध्याय सहेज सकते हैं और जहां छोड़ा था, वहीं से आगे सुन सकते हैं।',
            'ऑडियो इंटरनेट से स्ट्रीम होता है, इसलिए सुनने के लिए इंटरनेट कनेक्शन आवश्यक है।',
          ],
        }
      : {
          title: 'गोपनीयता नीति',
          body: [
            'यह ऐप कोई खाता नहीं बनाता और आपकी कोई व्यक्तिगत जानकारी एकत्र नहीं करता।',
            'आपकी थीम, प्लेबैक सेटिंग्स, पसंदीदा अध्याय, सुनने का इतिहास और सुनने की प्रगति केवल आपके फ़ोन पर सहेजी जाती है। ऐप हटाने पर यह जानकारी भी हट जाती है।',
            `ऑडियो फ़ाइलें ${AUDIO_BASE_URL} से स्ट्रीम होती हैं। स्ट्रीमिंग के दौरान वह सर्वर सामान्य नेटवर्क जानकारी, जैसे आपका IP पता, देख सकता है।`,
          ],
        };

  return (
    <Modal visible={infoKey != null} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.infoScrim, { backgroundColor: colors.scrim }]}>
        <View style={[styles.infoSheet, { backgroundColor: colors.dialog, paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.infoHeader}>
            <Text style={[styles.infoTitle, { color: colors.textPrimary }]} accessibilityRole="header">
              {content.title}
            </Text>
            <IconButton icon="close" onPress={onClose} accessibilityLabel="बंद करें" />
          </View>
          <ScrollView>
            {content.body.map((p, i) => (
              <Text key={i} style={[styles.infoBody, { color: colors.textSecondary }]}>
                {p}
              </Text>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.xl, marginBottom: spacing.lg, overflow: 'hidden' },
  brandMandala: { position: 'absolute', right: -50, top: -50 },
  brandOm: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  brandOmText: { fontSize: 28, lineHeight: 38, fontWeight: '500' },
  brandText: { flex: 1, minWidth: 0 },
  brandName: { ...typography.heading },
  brandSub: { ...typography.caption, opacity: 0.85 },
  infoScrim: { flex: 1, justifyContent: 'flex-end' },
  infoSheet: {
    maxHeight: '80%',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  infoTitle: { ...typography.heading },
  infoBody: { ...typography.body, marginBottom: spacing.md },
});
