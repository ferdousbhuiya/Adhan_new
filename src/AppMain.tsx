import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import PrayerTimesList from './components/PrayerTimesList';
import { getPrayerTimesForDate, PrayerTimesMap, CalculationMethodName } from './services/prayerTimes';
import { requestPermissions, scheduleDailyPrayerNotifications, ensureNotificationChannel, cancelAllScheduledNotifications, scheduleTestNotification, presentTestNotification } from './services/notifications';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import VoicesManager from './components/VoicesManager';
import { getActiveVoice } from './services/voicesManager';

export default function AppMain() {
  const [loading, setLoading] = useState(true);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesMap | null>(null);
  const [scheduled, setScheduled] = useState(false);
  const [method, setMethod] = useState<CalculationMethodName>('MuslimWorldLeague');
  const [showVoices, setShowVoices] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Location permission is required to calculate prayer times.');
          setLoading(false);
          return;
        }

        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const times = getPrayerTimesForDate(new Date(), lat, lon, method);
        if (active) setPrayerTimes(times);
      } catch (e) {
        Alert.alert('Error', 'Unable to get location/prayer times');
      } finally {
        if (active) setLoading(false);
      }
    })();

    // Notification response listener to play adhan when user taps
    const respSub = Notifications.addNotificationResponseReceivedListener(async (resp) => {
      const voicePath = resp.notification.request.content.data?.voicePath;
      await playAdhan(voicePath);
    });

    // Foreground notification listener to play adhan immediately
    const recSub = Notifications.addNotificationReceivedListener(async (notif) => {
      const voicePath = notif.request.content.data?.voicePath;
      await playAdhan(voicePath);
    });

    return () => {
      active = false;
      respSub.remove();
      recSub.remove();
    };
  }, [method]);

  async function playAdhan(voicePath?: string) {
    try {
      // Unload previous sound if any
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (_) {}
        soundRef.current = null;
      }

      // 1) If notification provided a voicePath, try that first
      if (voicePath) {
        try {
          const { sound } = await Audio.Sound.createAsync({ uri: voicePath });
          soundRef.current = sound;
          await soundRef.current.replayAsync();
          return;
        } catch (e) {
          console.warn('Failed to play voice from provided path, falling back', e);
        }
      }

      // 2) Try bundled asset
      try {
        const { sound } = await Audio.Sound.createAsync(require('../assets/adhan.mp3'));
        soundRef.current = sound;
        await soundRef.current.replayAsync();
        return;
      } catch (localErr) {
        // 3) Try any downloaded voice files (voice-*.wav) or synthetic files in document directory
        try {
          const FileSystem = require('expo-file-system');
          const voicesDir = FileSystem.documentDirectory + 'voices/';
          const info = await FileSystem.getInfoAsync(voicesDir);
          if (info.exists) {
            const files = await FileSystem.readDirectoryAsync(voicesDir);
            const found = files.find((f: string) => f.startsWith('voice-'));
            if (found) {
              const fp = voicesDir + found;
              const { sound } = await Audio.Sound.createAsync({ uri: fp });
              soundRef.current = sound;
              await soundRef.current.replayAsync();
              return;
            }
          }

          // fallback: check for synthetic adhan files
          const entries = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
          const synthetic = entries.find((e: string) => e.startsWith('adhan-synthetic'));
          if (synthetic) {
            const fp = FileSystem.documentDirectory + synthetic;
            const { sound } = await Audio.Sound.createAsync({ uri: fp });
            soundRef.current = sound;
            await soundRef.current.replayAsync();
            return;
          }

          // final fallback: remote beep
          const fallbackUrl = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
          const { sound } = await Audio.Sound.createAsync({ uri: fallbackUrl });
          soundRef.current = sound;
          await soundRef.current.replayAsync();
          return;
        } catch (e2) {
          console.warn('Remote/synthetic fallback failed', e2);
        }
      }
    } catch (e) {
      console.warn('Adhan playback failed; add assets/adhan.mp3 or generate synthetic sample to the project to enable playback.', e);
    }
  }

  async function onSchedule() {
    if (!prayerTimes) return;
    const ok = await requestPermissions();
    if (!ok) {
      Alert.alert('Notifications disabled', 'Please enable notifications in system settings');
      return;
    }
    await ensureNotificationChannel();

    // fetch active voice (if any) and pass its path so notifications carry the voice
    try {
      const active = await getActiveVoice();
      const voicePath = active?.path;
      await scheduleDailyPrayerNotifications(prayerTimes as any, voicePath);
      setScheduled(true);
      Alert.alert('Scheduled', 'Daily notifications for prayer times scheduled.');
    } catch (e) {
      Alert.alert('Scheduled', 'Notifications scheduled (failed to attach voice).');
    }
  }

  async function onInstallSynthetic() {
    const FileSystem = require('expo-file-system');
    try {
      Alert.alert('Generating sample', 'Generating a synthetic adhan for testing.');
      const { generateSyntheticAdhan } = require('./services/voices');
      const path = await generateSyntheticAdhan();
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        Alert.alert('Installed', 'Synthetic adhan saved for offline testing. You can preview it by pressing Play adhan.');
      } else {
        Alert.alert('Failed', 'Could not write synthetic sample to disk.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to generate sample adhan.');
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large"/></View>;

  if (!prayerTimes) return <View style={styles.center}><Text>Unable to compute prayer times.</Text></View>;

  const items = [
    { label: 'Fajr', date: prayerTimes.fajr },
    { label: 'Sunrise', date: prayerTimes.sunrise },
    { label: 'Dhuhr', date: prayerTimes.dhuhr },
    { label: 'Asr', date: prayerTimes.asr },
    { label: 'Maghrib', date: prayerTimes.maghrib },
    { label: 'Isha', date: prayerTimes.isha },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Adhan Pro by Ferdous — Today's prayer times</Text>
      <PrayerTimesList items={items} />

      <View style={{ marginTop: 12, marginBottom: 12 }}>
        <Text style={{ fontSize: 14 }}>Calculation method: <Text style={{fontWeight:'700'}}>{method}</Text></Text>
        <View style={{ marginTop: 8 }}>
          <Button
            title="Change calculation method"
            onPress={() => {
              const methods: CalculationMethodName[] = ['MuslimWorldLeague','NorthAmerica','Egyptian','Karachi','UmmAlQura','Dubai','MoonsightingCommittee'];
              const idx = methods.indexOf(method);
              const next = methods[(idx + 1) % methods.length];
              setMethod(next);
            }}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button title={scheduled ? 'Reschedule daily notifications' : 'Schedule daily notifications'} onPress={onSchedule} />
        {scheduled && (
          <View style={{marginTop:8}}>
            <Button title="Cancel scheduled notifications" color="#c00" onPress={async () => { await cancelAllScheduledNotifications(); setScheduled(false); Alert.alert('Cancelled', 'All scheduled notifications cancelled.'); }} />
          </View>
        )}

        <View style={{marginTop:12}}>
          <Button title="Install synthetic adhan sample" onPress={onInstallSynthetic} />
        </View>

        <View style={{marginTop:12}}>
          <Button title="Play adhan now" onPress={playAdhan} />
        </View>

        <View style={{marginTop:12}}>
          <Button title="Test notification (1 min)" onPress={async () => {
            try {
              const active = await getActiveVoice();
              const voicePath = active?.path;
              const { id, date } = await scheduleTestNotification(1, voicePath);
              Alert.alert('Test scheduled', `Test notification scheduled at ${date.toLocaleTimeString()}`);
            } catch (e) {
              Alert.alert('Error', 'Failed to schedule test notification');
            }
          }} />
        </View>

        <View style={{marginTop:12}}>
          <Button title="Test now" onPress={async () => {
            try {
              const active = await getActiveVoice();
              const voicePath = active?.path;
              await presentTestNotification(voicePath);
              // Also play immediately as a double-check while app is foregrounded
              await playAdhan(voicePath);
              Alert.alert('Test', 'Immediate test notification presented and adhan played (if app is foregrounded).');
            } catch (e) {
              Alert.alert('Error', 'Failed to present test notification');
            }
          }} />
        </View> 

      <View style={{marginTop:12}}>
        <Button title="Manage voices" onPress={() => setShowVoices(true)} />
      </View>

      {showVoices && (
        <View style={{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'rgba(0,0,0,0.3)'}}>
          <View style={{flex:1,margin:40,backgroundColor:'white',borderRadius:8,overflow:'hidden'}}>
            <VoicesManager onClose={() => setShowVoices(false)} />
          </View>
        </View>
      )}
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 48, paddingHorizontal: 12 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  actions: { marginTop: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
