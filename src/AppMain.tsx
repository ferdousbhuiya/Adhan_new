import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  Platform,
  ScrollView,
  Pressable,
  StatusBar,
  Dimensions,
  Switch,
  Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrayerTimesForDate, PrayerTimesMap, CalculationMethodName } from './services/prayerTimes';
import { 
  requestPermissions, 
  scheduleDailyPrayerNotifications, 
  ensureNotificationChannel, 
  cancelAllScheduledNotifications, 
  scheduleTestNotification 
} from './services/notifications';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import AdhanVoiceSelector, { getAdhanUrlForPrayer } from './components/AdhanVoiceSelector';
import IslamicCalendar from './components/IslamicCalendar';
import IslamicLogo from './components/IslamicLogo';
import QiblaCompass from './components/QiblaCompass';
import QuranReader from './components/QuranReader';
import RamadanTracker from './components/RamadanTracker';
import TasbihCounter from './components/TasbihCounter';
import DhikrCollection from './components/DhikrCollection';
import HalalFood from './components/HalalFood';
import MosqueFinder from './components/MosqueFinder';
import LocationServices from './components/LocationServices';

const SILENT_MODE_KEY = 'ADHAN_SILENT_MODE';
const PRAYED_KEY = 'PRAYERS_PRAYED_TODAY';
const REMINDER_KEY = 'PRE_ADHAN_REMINDER';
const VOLUME_KEY = 'ADHAN_VOLUME';

const { width, height } = Dimensions.get('window');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PRAYER_ICONS: { [key: string]: string } = {
  Fajr: '🌙',
  Sunrise: '🌅',
  Dhuhr: '☀️',
  Asr: '🌤️',
  Maghrib: '🌇',
  Isha: '🌃',
};

const PRAYER_ARABIC: { [key: string]: string } = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

const DUA_AFTER_ADHAN = {
  arabic: 'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ',
  transliteration: "Allahumma Rabba hadhihi'd-da'wati't-tammah, was-salatil qa'imah, ati Muhammadanil-wasilata wal-fadilah, wab'athhu maqamam mahmudanil-ladhi wa'adtah",
  translation: 'O Allah, Lord of this perfect call and established prayer, grant Muhammad the intercession and favor, and raise him to the honored station You have promised him.',
};

const METHODS: { name: CalculationMethodName; label: string }[] = [
  { name: 'MuslimWorldLeague', label: 'Muslim World League' },
  { name: 'NorthAmerica', label: 'ISNA (North America)' },
  { name: 'Egyptian', label: 'Egyptian' },
  { name: 'Karachi', label: 'Karachi' },
  { name: 'UmmAlQura', label: 'Umm Al-Qura' },
  { name: 'Dubai', label: 'Dubai' },
  { name: 'MoonsightingCommittee', label: 'Moonsighting Committee' },
];

function toHijri(date: Date): { day: number; month: string; year: number } {
  const hijriMonths = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'];
  
  // Use the same algorithm as IslamicCalendar
  const jd = Math.floor((date.getTime() - new Date(1970, 0, 1).getTime()) / 86400000) + 2440588;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  
  return { day, month: hijriMonths[month - 1] || 'Unknown', year };
}

export default function AppMain() {
  const [loading, setLoading] = useState(true);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesMap | null>(null);
  const [scheduled, setScheduled] = useState(false);
  const [method, setMethod] = useState<CalculationMethodName>('MuslimWorldLeague');
  const [showVoices, setShowVoices] = useState(false);
  const [showMethods, setShowMethods] = useState(false);
  const [showDua, setShowDua] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showQibla, setShowQibla] = useState(false);
  const [showQuran, setShowQuran] = useState(false);
  const [showRamadan, setShowRamadan] = useState(false);
  const [showTasbih, setShowTasbih] = useState(false);
  const [showDhikr, setShowDhikr] = useState(false);
  const [showHalalFood, setShowHalalFood] = useState(false);
  const [showMosqueFinder, setShowMosqueFinder] = useState(false);
  const [showLocationServices, setShowLocationServices] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState<{ name: string; time: Date; endTime: Date } | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);
  const [currentCountdown, setCurrentCountdown] = useState('');
  const [nextCountdown, setNextCountdown] = useState('');
  const [locationName, setLocationName] = useState('');
  const [silentMode, setSilentMode] = useState(false);
  const [preAdhanReminder, setPreAdhanReminder] = useState(15);
  const [volume, setVolume] = useState(1.0);
  const [prayedToday, setPrayedToday] = useState<string[]>([]);
  const [hijriDate, setHijriDate] = useState<{ day: number; month: string; year: number } | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const silent = await AsyncStorage.getItem(SILENT_MODE_KEY);
        if (silent === 'true') setSilentMode(true);
        const reminder = await AsyncStorage.getItem(REMINDER_KEY);
        if (reminder) setPreAdhanReminder(parseInt(reminder));
        const vol = await AsyncStorage.getItem(VOLUME_KEY);
        if (vol) setVolume(parseFloat(vol));
        const today = new Date().toDateString();
        const prayed = await AsyncStorage.getItem(PRAYED_KEY + today);
        if (prayed) setPrayedToday(JSON.parse(prayed));
      } catch {}
    })();
    setHijriDate(toHijri(new Date()));
  }, []);

  async function toggleSilentMode(value: boolean) {
    setSilentMode(value);
    await AsyncStorage.setItem(SILENT_MODE_KEY, value ? 'true' : 'false');
    if (value && soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
  }

  async function saveVolume(value: number) {
    setVolume(value);
    await AsyncStorage.setItem(VOLUME_KEY, value.toString());
    if (soundRef.current) { try { await soundRef.current.setVolumeAsync(value); } catch {} }
  }

  async function saveReminder(minutes: number) {
    setPreAdhanReminder(minutes);
    await AsyncStorage.setItem(REMINDER_KEY, minutes.toString());
  }

  async function togglePrayed(prayerName: string) {
    const today = new Date().toDateString();
    let updated = prayedToday.includes(prayerName) ? prayedToday.filter(p => p !== prayerName) : [...prayedToday, prayerName];
    setPrayedToday(updated);
    await AsyncStorage.setItem(PRAYED_KEY + today, JSON.stringify(updated));
  }

  useEffect(() => {
    Audio.setAudioModeAsync({ allowsRecordingIOS: false, staysActiveInBackground: true, playsInSilentModeIOS: true, shouldDuckAndroid: false, playThroughEarpieceAndroid: false });
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Required', 'Location permission needed.'); setLoading(false); return; }
        let pos;
        try { pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }); } catch { pos = await Location.getLastKnownPositionAsync(); }
        if (!pos) { Alert.alert('Location Error', 'Could not get location.'); setLoading(false); return; }
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        try { const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon }); if (place) setLocationName(place.city || place.region || place.country || ''); } catch {}
        const times = getPrayerTimesForDate(new Date(), lat, lon, method);
        if (active) setPrayerTimes(times);
      } catch { Alert.alert('Error', 'Unable to get prayer times.'); } finally { if (active) setLoading(false); }
    })();
    const respSub = Notifications.addNotificationResponseReceivedListener(async (resp) => { await playAdhan(resp.notification.request.content.data?.voicePath as string); setShowDua(true); });
    const recSub = Notifications.addNotificationReceivedListener(async (notif) => { await playAdhan(notif.request.content.data?.voicePath as string); setShowDua(true); });
    return () => { active = false; respSub.remove(); recSub.remove(); };
  }, [method]);

  useEffect(() => {
    if (!prayerTimes) return;
    
    // Calculate current and next prayer ONCE (not every second)
    const calculatePrayers = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      
      const prayers = [
        { name: 'Fajr', time: prayerTimes.fajr }, 
        { name: 'Sunrise', time: prayerTimes.sunrise },
        { name: 'Dhuhr', time: prayerTimes.dhuhr }, 
        { name: 'Asr', time: prayerTimes.asr },
        { name: 'Maghrib', time: prayerTimes.maghrib }, 
        { name: 'Isha', time: prayerTimes.isha },
      ];
      
      let current: { name: string; time: Date; endTime: Date } | null = null;
      let next: { name: string; time: Date } | null = null;
      
      for (let i = 0; i < prayers.length; i++) {
        const nextPrayerTime = i < prayers.length - 1 ? prayers[i + 1].time : new Date(tomorrow.getTime() + prayerTimes.fajr.getHours() * 3600000 + prayerTimes.fajr.getMinutes() * 60000);
        
        if (now >= prayers[i].time && (i === prayers.length - 1 || now < prayers[i + 1].time)) {
          current = { ...prayers[i], endTime: nextPrayerTime };
          if (i < prayers.length - 1) {
            next = prayers[i + 1];
          } else {
            const tomorrowFajr = new Date(tomorrow);
            tomorrowFajr.setHours(prayerTimes.fajr.getHours(), prayerTimes.fajr.getMinutes(), 0, 0);
            next = { name: 'Fajr', time: tomorrowFajr };
          }
          break;
        }
      }
      
      if (!current && now < prayers[0].time) {
        next = prayers[0];
      }
      
      return { current, next };
    };

    const { current, next } = calculatePrayers();
    setCurrentPrayer(current);
    setNextPrayer(next);

    // Only update countdown strings (not recalculate prayers)
    const updateCountdowns = () => {
      const now = new Date();
      
      if (current && current.endTime) {
        const remaining = current.endTime.getTime() - now.getTime();
        if (remaining > 0) {
          const h = Math.floor(remaining / 3600000);
          const m = Math.floor((remaining % 3600000) / 60000);
          const s = Math.floor((remaining % 60000) / 1000);
          setCurrentCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
      } else {
        setCurrentCountdown('');
      }
      
      if (next) {
        const diff = next.time.getTime() - now.getTime();
        if (diff > 0) {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setNextCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        } else {
          setNextCountdown('Now');
        }
      }
    };
    
    updateCountdowns();
    // Update every 10 seconds instead of every 1 second to reduce re-renders
    const interval = setInterval(updateCountdowns, 10000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  async function playAdhan(voicePath?: string, prayerName?: string) {
    if (silentMode) { Alert.alert('🔇 Silent Mode', 'Adhan sound is muted.'); return; }
    try {
      if (soundRef.current) { try { await soundRef.current.unloadAsync(); } catch {} soundRef.current = null; }
      const adhanUrl = voicePath || await getAdhanUrlForPrayer(prayerName || 'dhuhr');
      try { const { sound } = await Audio.Sound.createAsync({ uri: adhanUrl }); soundRef.current = sound; await sound.setVolumeAsync(volume); await sound.playAsync(); } catch (e) { console.warn('Failed to play:', e); }
    } catch (e) { console.warn('playAdhan failed', e); }
  }

  async function stopAdhan() { if (soundRef.current) { try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {} soundRef.current = null; } }

  async function onSchedule() {
    const granted = await requestPermissions();
    if (!granted) { Alert.alert('Permission Required', 'Please enable notifications.'); return; }
    await ensureNotificationChannel();
    try { const adhanUrl = await getAdhanUrlForPrayer('dhuhr'); await scheduleDailyPrayerNotifications(prayerTimes as any, adhanUrl); setScheduled(true); Alert.alert('✅ Scheduled', 'Prayer notifications enabled!'); }
    catch { Alert.alert('Scheduled', 'Notifications scheduled.'); setScheduled(true); }
  }

  async function onTestNotification() {
    try {
      const granted = await requestPermissions(); if (!granted) { Alert.alert('Permission Required'); return; }
      await ensureNotificationChannel();
      const adhanUrl = await getAdhanUrlForPrayer('dhuhr');
      const { date } = await scheduleTestNotification(1, adhanUrl);
      Alert.alert('🔔 Test Scheduled', `Notification at ${date.toLocaleTimeString()}`);
    } catch { Alert.alert('Error', 'Could not schedule test.'); }
  }

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'; };
  const getPrayerStats = () => { const total = 5, prayed = prayedToday.filter(p => p !== 'Sunrise').length; return { prayed, total, percentage: Math.round((prayed / total) * 100) }; };

  if (loading) return <View style={styles.loadingContainer}><StatusBar barStyle="light-content" backgroundColor="#1a4a3a" /><Text style={styles.loadingIcon}>🕌</Text><ActivityIndicator size="large" color="#d4af37" /><Text style={styles.loadingText}>Calculating prayer times...</Text></View>;
  if (!prayerTimes) return <View style={styles.loadingContainer}><StatusBar barStyle="light-content" backgroundColor="#1a4a3a" /><Text style={styles.errorIcon}>📍</Text><Text style={styles.errorText}>Unable to get prayer times</Text><Text style={styles.errorSubtext}>Please enable location</Text></View>;

  const prayers = [{ name: 'Fajr', time: prayerTimes.fajr }, { name: 'Sunrise', time: prayerTimes.sunrise }, { name: 'Dhuhr', time: prayerTimes.dhuhr }, { name: 'Asr', time: prayerTimes.asr }, { name: 'Maghrib', time: prayerTimes.maghrib }, { name: 'Isha', time: prayerTimes.isha }];
  const stats = getPrayerStats();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a4a3a" />
      <View style={styles.header}>
        <Text style={styles.bismillah}>﷽</Text>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        {locationName && <Text style={styles.location}>📍 {locationName}</Text>}
        {hijriDate && <Text style={styles.hijriDate}>{hijriDate.day} {hijriDate.month} {hijriDate.year} AH</Text>}
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text>
      </View>

      {currentPrayer && currentPrayer.name !== 'Sunrise' && (
        <View style={styles.currentPrayerCard}>
          <View style={styles.currentPrayerHeader}>
            <Text style={styles.currentPrayerLabel}>🟢 CURRENT PRAYER</Text>
            <Pressable style={({ pressed }) => [styles.prayedButton, prayedToday.includes(currentPrayer.name) && styles.prayedButtonActive, pressed && { opacity: 0.7 }]} onPress={() => togglePrayed(currentPrayer.name)}>
              <Text style={styles.prayedButtonText}>{prayedToday.includes(currentPrayer.name) ? '✓ Prayed' : 'Mark Prayed'}</Text>
            </Pressable>
          </View>
          <View style={styles.currentPrayerRow}>
            <Text style={styles.currentPrayerIcon}>{PRAYER_ICONS[currentPrayer.name]}</Text>
            <View style={styles.currentPrayerInfo}>
              <Text style={styles.currentPrayerName}>{currentPrayer.name}</Text>
              <Text style={styles.currentPrayerArabic}>{PRAYER_ARABIC[currentPrayer.name]}</Text>
            </View>
            <View style={styles.currentCountdownContainer}>
              <Text style={styles.currentCountdownLabel}>ENDS IN</Text>
              <Text style={styles.currentCountdown}>{currentCountdown}</Text>
            </View>
          </View>
        </View>
      )}

      {nextPrayer && (
        <View style={styles.nextPrayerCard}>
          <Text style={styles.nextPrayerLabel}>🟡 NEXT PRAYER</Text>
          <View style={styles.nextPrayerRow}>
            <Text style={styles.nextPrayerIcon}>{PRAYER_ICONS[nextPrayer.name]}</Text>
            <View style={styles.nextPrayerInfo}>
              <Text style={styles.nextPrayerName}>{nextPrayer.name}</Text>
              <Text style={styles.nextPrayerArabicSmall}>{PRAYER_ARABIC[nextPrayer.name]}</Text>
              <Text style={styles.nextPrayerTime}>at {formatTime(nextPrayer.time)}</Text>
            </View>
            <View style={styles.nextCountdownContainer}>
              <Text style={styles.nextCountdownLabel}>STARTS IN</Text>
              <Text style={styles.nextCountdown}>{nextCountdown}</Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Today's Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statsBar}><View style={[styles.statsBarFill, { width: `${stats.percentage}%` }]} /></View>
            <Text style={styles.statsText}>{stats.prayed}/{stats.total}</Text>
          </View>
        </View>

        <View style={styles.prayerList}>
          <Text style={styles.sectionTitle}>TODAY'S PRAYER TIMES</Text>
          {prayers.map((prayer) => {
            const isPast = prayer.time < new Date(), isCurrent = currentPrayer?.name === prayer.name, isNext = nextPrayer?.name === prayer.name, isPrayed = prayedToday.includes(prayer.name);
            return (
              <Pressable key={prayer.name} style={({ pressed }) => [styles.prayerItem, isCurrent && styles.prayerItemCurrent, isNext && styles.prayerItemNext, isPast && !isCurrent && !isNext && styles.prayerItemPast, pressed && { opacity: 0.7 }]} onPress={() => prayer.name !== 'Sunrise' && togglePrayed(prayer.name)}>
                <View style={styles.prayerLeft}>
                  <Text style={[styles.prayerIcon, isPast && !isCurrent && !isNext && styles.prayerIconPast]}>{PRAYER_ICONS[prayer.name]}</Text>
                  <View><Text style={[styles.prayerName, isPast && !isCurrent && !isNext && styles.prayerNamePast]}>{prayer.name}</Text><Text style={styles.prayerArabicSmall}>{PRAYER_ARABIC[prayer.name]}</Text></View>
                </View>
                <View style={styles.prayerRight}>
                  <Text style={[styles.prayerTime, isPast && !isCurrent && !isNext && styles.prayerTimePast]}>{formatTime(prayer.time)}</Text>
                  {prayer.name !== 'Sunrise' && <Text style={[styles.prayerStatus, isPrayed && styles.prayerStatusPrayed]}>{isPrayed ? '✓' : '○'}</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={({ pressed }) => [styles.methodSelector, pressed && { opacity: 0.7 }]} onPress={() => setShowMethods(!showMethods)}>
          <Text style={styles.methodLabel}>Calculation Method</Text>
          <Text style={styles.methodValue}>{METHODS.find(m => m.name === method)?.label || method} ▼</Text>
        </Pressable>
        {showMethods && <View style={styles.methodList}>{METHODS.map(m => <Pressable key={m.name} style={({ pressed }) => [styles.methodOption, method === m.name && styles.methodOptionActive, pressed && { opacity: 0.7 }]} onPress={() => { setMethod(m.name); setShowMethods(false); }}><Text style={[styles.methodOptionText, method === m.name && styles.methodOptionTextActive]}>{m.label}</Text></Pressable>)}</View>}

        <View style={styles.actions}>
          <View style={styles.silentModeContainer}>
            <View style={styles.silentModeInfo}><Text style={styles.silentModeIcon}>{silentMode ? '🔇' : '🔊'}</Text><View><Text style={styles.silentModeTitle}>Silent Mode</Text><Text style={styles.silentModeSubtext}>{silentMode ? 'Adhan muted (meeting mode)' : 'Adhan sound enabled'}</Text></View></View>
            <Switch value={silentMode} onValueChange={toggleSilentMode} trackColor={{ false: '#4a7c59', true: '#ef4444' }} thumbColor={silentMode ? '#fca5a5' : '#d4af37'} />
          </View>

          <View style={styles.volumeContainer}>
            <Text style={styles.volumeLabel}>🔊 Volume: {Math.round(volume * 100)}%</Text>
            <Slider style={styles.volumeSlider} minimumValue={0} maximumValue={1} value={volume} onSlidingComplete={saveVolume} minimumTrackTintColor="#d4af37" maximumTrackTintColor="#ccc" thumbTintColor="#d4af37" />
          </View>

          <View style={styles.reminderContainer}>
            <Text style={styles.reminderLabel}>⏰ Pre-Adhan Reminder</Text>
            <View style={styles.reminderOptions}>{[0, 5, 10, 15, 30].map(mins => <Pressable key={mins} style={({ pressed }) => [styles.reminderOption, preAdhanReminder === mins && styles.reminderOptionActive, pressed && { opacity: 0.7 }]} onPress={() => saveReminder(mins)}><Text style={[styles.reminderOptionText, preAdhanReminder === mins && styles.reminderOptionTextActive]}>{mins === 0 ? 'Off' : `${mins}m`}</Text></Pressable>)}</View>
          </View>

          <Pressable style={({ pressed }) => [styles.actionButton, scheduled && styles.actionButtonActive, pressed && { opacity: 0.7 }]} onPress={onSchedule}><Text style={styles.actionIcon}>🔔</Text><Text style={styles.actionText}>{scheduled ? 'Notifications Active' : 'Enable Notifications'}</Text></Pressable>
          {scheduled && <Pressable style={({ pressed }) => [styles.actionButton, styles.actionButtonDanger, pressed && { opacity: 0.7 }]} onPress={async () => { await cancelAllScheduledNotifications(); setScheduled(false); Alert.alert('Cancelled', 'All notifications cancelled.'); }}><Text style={styles.actionIcon}>🔕</Text><Text style={styles.actionText}>Cancel Notifications</Text></Pressable>}
          <Pressable style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]} onPress={onTestNotification}><Text style={styles.actionIcon}>⏰</Text><Text style={styles.actionText}>Test Notification (1 min)</Text></Pressable>
          
          <View style={styles.playStopRow}>
            <Pressable style={({ pressed }) => [styles.actionButton, styles.playButton, pressed && { opacity: 0.7 }]} onPress={() => playAdhan(undefined, nextPrayer?.name)}><Text style={styles.actionIcon}>▶️</Text><Text style={styles.actionText}>Play Adhan</Text></Pressable>
            <Pressable style={({ pressed }) => [styles.actionButton, styles.stopButton, pressed && { opacity: 0.7 }]} onPress={stopAdhan}><Text style={styles.actionIcon}>⏹️</Text><Text style={styles.actionText}>Stop</Text></Pressable>
          </View>

          <Pressable style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]} onPress={() => setShowVoices(true)}><Text style={styles.actionIcon}>🎵</Text><Text style={styles.actionText}>Select Adhan Voice</Text></Pressable>
          <Pressable style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]} onPress={() => setShowDua(true)}><Text style={styles.actionIcon}>🤲</Text><Text style={styles.actionText}>Dua After Adhan</Text></Pressable>
          <Pressable style={({ pressed }) => [styles.actionButton, styles.calendarButton, pressed && { opacity: 0.7 }]} onPress={() => setShowCalendar(true)}><Text style={styles.actionIcon}>📅</Text><Text style={styles.actionText}>Islamic Calendar & Events</Text></Pressable>
          <Pressable style={({ pressed }) => [styles.actionButton, styles.logoButton, pressed && { opacity: 0.7 }]} onPress={() => setShowLogo(true)}><Text style={styles.actionIcon}>🕌</Text><Text style={styles.actionText}>Islamic Logo</Text></Pressable>
          <Pressable style={({ pressed }) => [styles.actionButton, styles.qiblaButton, pressed && { opacity: 0.7 }]} onPress={() => setShowQibla(true)}><Text style={styles.actionIcon}>🧭</Text><Text style={styles.actionText}>Qibla Compass</Text></Pressable>
          <Pressable style={({ pressed }) => [styles.actionButton, styles.quranButton, pressed && { opacity: 0.7 }]} onPress={() => setShowQuran(true)}><Text style={styles.actionIcon}>📖</Text><Text style={styles.actionText}>Quran Reader</Text></Pressable>
          <Pressable style={({ pressed }) => [styles.actionButton, styles.ramadanButton, pressed && { opacity: 0.7 }]} onPress={() => setShowRamadan(true)}><Text style={styles.actionIcon}>🌙</Text><Text style={styles.actionText}>Ramadan Tracker</Text></Pressable>
          <Pressable style={({ pressed }) => [styles.actionButton, styles.tasbihButton, pressed && { opacity: 0.7 }]} onPress={() => setShowTasbih(true)}><Text style={styles.actionIcon}>📿</Text><Text style={styles.actionText}>Tasbih Counter</Text></Pressable>
          <Pressable style={({ pressed }) => [styles.actionButton, styles.dhikrButton, pressed && { opacity: 0.7 }]} onPress={() => setShowDhikr(true)}><Text style={styles.actionIcon}>📖</Text><Text style={styles.actionText}>Adhkar Collection</Text></Pressable>
          <Pressable style={({ pressed }) => [styles.actionButton, styles.halalButton, pressed && { opacity: 0.7 }]} onPress={() => setShowHalalFood(true)}><Text style={styles.actionIcon}>🍽️</Text><Text style={styles.actionText}>Halal Food Finder</Text></Pressable>
          <Pressable style={({ pressed }) => [styles.actionButton, styles.mosqueButton, pressed && { opacity: 0.7 }]} onPress={() => setShowMosqueFinder(true)}><Text style={styles.actionIcon}>🕌</Text><Text style={styles.actionText}>Mosque Finder</Text></Pressable>
          <Pressable style={({ pressed }) => [styles.actionButton, styles.locationButton, pressed && { opacity: 0.7 }]} onPress={() => setShowLocationServices(true)}><Text style={styles.actionIcon}>📍</Text><Text style={styles.actionText}>Location Services</Text></Pressable>
        </View>

        <View style={styles.footer}><Text style={styles.footerText}>🕌 Adhan Pro</Text><Text style={styles.footerSubtext}>by Ferdous</Text></View>
      </ScrollView>

      <AdhanVoiceSelector visible={showVoices} onClose={() => setShowVoices(false)} />

      <Modal visible={showDua} animationType="slide" transparent>
        <View style={styles.duaOverlay}>
          <View style={styles.duaModal}>
            <Text style={styles.duaTitle}>🤲 Dua After Adhan</Text>
            <ScrollView style={styles.duaScroll}>
              <Text style={styles.duaArabic}>{DUA_AFTER_ADHAN.arabic}</Text>
              <Text style={styles.duaTranslit}>{DUA_AFTER_ADHAN.transliteration}</Text>
              <Text style={styles.duaTranslation}>{DUA_AFTER_ADHAN.translation}</Text>
            </ScrollView>
            <Pressable style={({ pressed }) => [styles.duaCloseBtn, pressed && { opacity: 0.7 }]} onPress={() => setShowDua(false)}><Text style={styles.duaCloseBtnText}>Close</Text></Pressable>
          </View>
        </View>
      </Modal>

      <IslamicCalendar visible={showCalendar} onClose={() => setShowCalendar(false)} />
      <IslamicLogo visible={showLogo} onClose={() => setShowLogo(false)} />
      <QiblaCompass visible={showQibla} onClose={() => setShowQibla(false)} />
      <QuranReader visible={showQuran} onClose={() => setShowQuran(false)} />
      <RamadanTracker visible={showRamadan} onClose={() => setShowRamadan(false)} />
      <TasbihCounter visible={showTasbih} onClose={() => setShowTasbih(false)} />
      <DhikrCollection visible={showDhikr} onClose={() => setShowDhikr(false)} />
      <HalalFood visible={showHalalFood} onClose={() => setShowHalalFood(false)} />
      <MosqueFinder visible={showMosqueFinder} onClose={() => setShowMosqueFinder(false)} />
      <LocationServices visible={showLocationServices} onClose={() => setShowLocationServices(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f3' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a4a3a' },
  loadingIcon: { fontSize: 64, marginBottom: 20 },
  loadingText: { marginTop: 16, color: '#fff', fontSize: 16 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  errorSubtext: { color: '#ccc', fontSize: 14, marginTop: 8 },
  header: { backgroundColor: '#1a4a3a', paddingTop: Platform.OS === 'ios' ? 55 : 40, paddingBottom: 20, paddingHorizontal: 20 },
  bismillah: { fontSize: 32, color: '#d4af37', textAlign: 'center', marginBottom: 8 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center' },
  location: { fontSize: 14, color: '#d4af37', textAlign: 'center', marginTop: 4 },
  hijriDate: { fontSize: 14, color: '#a8d5ba', textAlign: 'center', marginTop: 6, fontStyle: 'italic' },
  date: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4 },
  currentPrayerCard: { backgroundColor: '#2d6a4f', margin: 15, marginBottom: 8, borderRadius: 20, padding: 18, elevation: 6 },
  currentPrayerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  currentPrayerLabel: { fontSize: 12, fontWeight: '700', color: '#a8d5ba', letterSpacing: 1 },
  prayedButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  prayedButtonActive: { backgroundColor: '#4ade80' },
  prayedButtonText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  currentPrayerRow: { flexDirection: 'row', alignItems: 'center' },
  currentPrayerIcon: { fontSize: 42, marginRight: 15 },
  currentPrayerInfo: { flex: 1 },
  currentPrayerName: { fontSize: 28, fontWeight: '700', color: '#fff' },
  currentPrayerArabic: { fontSize: 18, color: '#a8d5ba', marginTop: 2 },
  currentCountdownContainer: { alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  currentCountdownLabel: { fontSize: 9, color: '#a8d5ba', fontWeight: '600', letterSpacing: 1 },
  currentCountdown: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 2 },
  nextPrayerCard: { backgroundColor: '#b8860b', marginHorizontal: 15, marginBottom: 10, borderRadius: 18, padding: 16, elevation: 4 },
  nextPrayerLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 1, marginBottom: 10 },
  nextPrayerRow: { flexDirection: 'row', alignItems: 'center' },
  nextPrayerIcon: { fontSize: 32, marginRight: 12 },
  nextPrayerInfo: { flex: 1 },
  nextPrayerName: { fontSize: 22, fontWeight: '700', color: '#fff' },
  nextPrayerArabicSmall: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  nextPrayerTime: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  nextCountdownContainer: { alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  nextCountdownLabel: { fontSize: 8, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 1 },
  nextCountdown: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 2 },
  statsCard: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: 5, marginBottom: 10, borderRadius: 15, padding: 16, elevation: 2 },
  statsTitle: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 10 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statsBar: { flex: 1, height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, marginRight: 12, overflow: 'hidden' },
  statsBarFill: { height: '100%', backgroundColor: '#4ade80', borderRadius: 5 },
  statsText: { fontSize: 14, fontWeight: '700', color: '#1a4a3a' },
  scrollView: { flex: 1 },
  prayerList: { backgroundColor: '#fff', marginHorizontal: 15, marginVertical: 5, borderRadius: 20, padding: 18, elevation: 3 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 12, letterSpacing: 1.5 },
  prayerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14, marginBottom: 6 },
  prayerItemCurrent: { backgroundColor: '#dcfce7', borderWidth: 2, borderColor: '#22c55e' },
  prayerItemNext: { backgroundColor: '#fef3c7', borderWidth: 2, borderColor: '#d4af37' },
  prayerItemPast: { opacity: 0.5 },
  prayerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  prayerIcon: { fontSize: 28, marginRight: 14 },
  prayerIconPast: { opacity: 0.6 },
  prayerName: { fontSize: 17, fontWeight: '600', color: '#1a4a3a' },
  prayerNamePast: { color: '#888' },
  prayerArabicSmall: { fontSize: 12, color: '#888' },
  prayerRight: { flexDirection: 'row', alignItems: 'center' },
  prayerTime: { fontSize: 16, fontWeight: '600', color: '#333', marginRight: 10 },
  prayerTimePast: { color: '#aaa' },
  prayerStatus: { fontSize: 20, color: '#ccc' },
  prayerStatusPrayed: { color: '#22c55e' },
  methodSelector: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: 10, padding: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  methodLabel: { fontSize: 13, color: '#666' },
  methodValue: { fontSize: 14, fontWeight: '600', color: '#1a4a3a' },
  methodList: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  methodOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  methodOptionActive: { backgroundColor: '#e8f5e9' },
  methodOptionText: { fontSize: 14, color: '#333' },
  methodOptionTextActive: { color: '#1a4a3a', fontWeight: '600' },
  actions: { padding: 15, paddingTop: 10 },
  silentModeContainer: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 14, marginBottom: 10 },
  silentModeInfo: { flexDirection: 'row', alignItems: 'center' },
  silentModeIcon: { fontSize: 28, marginRight: 12 },
  silentModeTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  silentModeSubtext: { fontSize: 12, color: '#888', marginTop: 2 },
  volumeContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 10 },
  volumeLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  volumeSlider: { width: '100%', height: 40 },
  reminderContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 10 },
  reminderLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
  reminderOptions: { flexDirection: 'row', justifyContent: 'space-between' },
  reminderOption: { flex: 1, paddingVertical: 10, marginHorizontal: 3, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },
  reminderOptionActive: { backgroundColor: '#d4af37' },
  reminderOptionText: { fontSize: 13, fontWeight: '600', color: '#666' },
  reminderOptionTextActive: { color: '#fff' },
  playStopRow: { flexDirection: 'row', gap: 10 },
  playButton: { flex: 2, backgroundColor: '#e8f5e9' },
  stopButton: { flex: 1, backgroundColor: '#ffebee' },
  actionButton: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 14, marginBottom: 10, elevation: 1 },
  actionButtonActive: { backgroundColor: '#e8f5e9', borderWidth: 2, borderColor: '#4caf50' },
  actionButtonDanger: { backgroundColor: '#ffebee' },
  calendarButton: { backgroundColor: '#e8f0fe', borderWidth: 2, borderColor: '#1a4a3a' },
  logoButton: { backgroundColor: '#f3e8ff', borderWidth: 2, borderColor: '#6b21a8' },
  qiblaButton: { backgroundColor: '#fef3c7', borderWidth: 2, borderColor: '#d97706' },
  quranButton: { backgroundColor: '#ecfdf5', borderWidth: 2, borderColor: '#059669' },
  ramadanButton: { backgroundColor: '#fdf2f8', borderWidth: 2, borderColor: '#be185d' },
  tasbihButton: { backgroundColor: '#fefce8', borderWidth: 2, borderColor: '#ca8a04' },
  dhikrButton: { backgroundColor: '#f0f9ff', borderWidth: 2, borderColor: '#0369a1' },
  halalButton: { backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#16a34a' },
  mosqueButton: { backgroundColor: '#fef7ff', borderWidth: 2, borderColor: '#7c3aed' },
  locationButton: { backgroundColor: '#fff7ed', borderWidth: 2, borderColor: '#c2410c' },
  actionIcon: { fontSize: 26, marginRight: 14 },
  actionText: { fontSize: 16, fontWeight: '500', color: '#333' },
  footer: { alignItems: 'center', paddingVertical: 30 },
  footerText: { fontSize: 18, fontWeight: '700', color: '#1a4a3a' },
  footerSubtext: { fontSize: 13, color: '#888', marginTop: 4 },
  duaOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  duaModal: { backgroundColor: '#1a4a3a', borderRadius: 25, margin: 20, padding: 25, maxHeight: height * 0.75, width: width - 40 },
  duaTitle: { fontSize: 22, fontWeight: '700', color: '#d4af37', textAlign: 'center', marginBottom: 20 },
  duaScroll: { maxHeight: height * 0.5 },
  duaArabic: { fontSize: 24, color: '#fff', textAlign: 'right', lineHeight: 42, marginBottom: 20 },
  duaTranslit: { fontSize: 15, color: '#a8d5ba', fontStyle: 'italic', lineHeight: 24, marginBottom: 16 },
  duaTranslation: { fontSize: 15, color: '#e0e0e0', lineHeight: 24 },
  duaCloseBtn: { backgroundColor: '#d4af37', paddingVertical: 14, borderRadius: 12, marginTop: 20 },
  duaCloseBtnText: { fontSize: 16, fontWeight: '700', color: '#1a4a3a', textAlign: 'center' },
});
