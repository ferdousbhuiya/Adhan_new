import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import {
  AdhanVoice,
  getAllAdhanVoices,
  getRegularAdhanVoices,
  getFajrAdhanVoices,
  getAdhanVoiceById,
} from '../services/adhanVoices';

const { width } = Dimensions.get('window');

const STORAGE_KEY_REGULAR = 'SELECTED_REGULAR_ADHAN';
const STORAGE_KEY_FAJR = 'SELECTED_FAJR_ADHAN';
const DOWNLOADED_VOICES_KEY = 'DOWNLOADED_ADHAN_VOICES';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AdhanVoiceSelector({ visible, onClose }: Props) {
  const [tab, setTab] = useState<'regular' | 'fajr'>('regular');
  const [selectedRegular, setSelectedRegular] = useState<string>('makkah-regular');
  const [selectedFajr, setSelectedFajr] = useState<string>('makkah-fajr');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedVoices, setDownloadedVoices] = useState<string[]>([]);
  const soundRef = useRef<Audio.Sound | null>(null);

  const regularVoices = getRegularAdhanVoices();
  const fajrVoices = getFajrAdhanVoices();
  const currentVoices = tab === 'regular' ? regularVoices : fajrVoices;

  useEffect(() => {
    loadSelections();
    loadDownloadedVoices();
    return () => {
      stopPlaying();
    };
  }, []);

  async function loadSelections() {
    try {
      const regular = await AsyncStorage.getItem(STORAGE_KEY_REGULAR);
      const fajr = await AsyncStorage.getItem(STORAGE_KEY_FAJR);
      if (regular) setSelectedRegular(regular);
      if (fajr) setSelectedFajr(fajr);
    } catch (e) {
      console.warn('Failed to load selections', e);
    }
  }

  async function loadDownloadedVoices() {
    try {
      const raw = await AsyncStorage.getItem(DOWNLOADED_VOICES_KEY);
      if (raw) {
        setDownloadedVoices(JSON.parse(raw));
      }
    } catch (e) {
      console.warn('Failed to load downloaded voices', e);
    }
  }

  async function saveSelection(voiceId: string, type: 'regular' | 'fajr') {
    try {
      const key = type === 'regular' ? STORAGE_KEY_REGULAR : STORAGE_KEY_FAJR;
      await AsyncStorage.setItem(key, voiceId);
      if (type === 'regular') {
        setSelectedRegular(voiceId);
      } else {
        setSelectedFajr(voiceId);
      }
      Alert.alert('✅ Saved', `${type === 'fajr' ? 'Fajr' : 'Regular'} Adhan voice updated!`);
    } catch (e) {
      Alert.alert('Error', 'Failed to save selection');
    }
  }

  async function stopPlaying() {
    const currentSound = soundRef.current;
    soundRef.current = null;
    setPlayingId(null);
    
    if (currentSound) {
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      } catch (e) {
        console.warn('Stop error:', e);
      }
    }
  }

  async function playPreview(voice: AdhanVoice) {
    // If already playing this voice, just stop it
    if (playingId === voice.id) {
      await stopPlaying();
      return;
    }

    // Stop any currently playing sound first
    await stopPlaying();

    setPlayingId(voice.id);
    try {
      // Check if downloaded locally first
      const localPath = FileSystem.documentDirectory + `adhan/${voice.id}.mp3`;
      const localInfo = await FileSystem.getInfoAsync(localPath);

      const uri = localInfo.exists ? localPath : voice.previewUrl;

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingId(null);
            soundRef.current = null;
          }
        }
      );
      soundRef.current = sound;
    } catch (e) {
      console.warn('Play error:', e);
      Alert.alert('Playback Error', 'Could not play this Adhan. Check your internet connection.');
      setPlayingId(null);
    }
  }

  async function downloadVoice(voice: AdhanVoice) {
    setDownloadingId(voice.id);
    try {
      const destDir = FileSystem.documentDirectory + 'adhan/';
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });

      const localPath = destDir + `${voice.id}.mp3`;
      await FileSystem.deleteAsync(localPath, { idempotent: true });

      const result = await FileSystem.downloadAsync(voice.downloadUrl, localPath);

      if (result.status === 200) {
        const newDownloaded = [...downloadedVoices, voice.id];
        setDownloadedVoices(newDownloaded);
        await AsyncStorage.setItem(DOWNLOADED_VOICES_KEY, JSON.stringify(newDownloaded));
        Alert.alert('✅ Downloaded', `${voice.name} is now available offline!`);
      } else {
        throw new Error('Download failed');
      }
    } catch (e) {
      console.warn('Download error:', e);
      Alert.alert('Download Failed', 'Could not download this Adhan. Try again later.');
    } finally {
      setDownloadingId(null);
    }
  }

  function isSelected(voiceId: string): boolean {
    return tab === 'regular' ? selectedRegular === voiceId : selectedFajr === voiceId;
  }

  function isDownloaded(voiceId: string): boolean {
    return downloadedVoices.includes(voiceId);
  }

  function renderVoiceItem(voice: AdhanVoice) {
    const selected = isSelected(voice.id);
    const downloaded = isDownloaded(voice.id);
    const playing = playingId === voice.id;
    const downloading = downloadingId === voice.id;

    return (
      <View key={voice.id} style={[styles.voiceCard, selected && styles.voiceCardSelected]}>
        <View style={styles.voiceInfo}>
          <View style={styles.voiceHeader}>
            <Text style={styles.voiceName}>{voice.name}</Text>
            {selected && <Text style={styles.selectedBadge}>✓ Active</Text>}
            {downloaded && !selected && <Text style={styles.downloadedBadge}>📥 Saved</Text>}
          </View>
          <Text style={styles.reciter}>🎤 {voice.reciter}</Text>
          <Text style={styles.origin}>📍 {voice.origin}</Text>
          {voice.duration && <Text style={styles.duration}>⏱️ {voice.duration}</Text>}
        </View>

        <View style={styles.voiceActions}>
          {/* Play/Stop Button */}
          <TouchableOpacity
            style={[styles.actionBtn, playing && styles.actionBtnActive]}
            onPress={() => playPreview(voice)}
          >
            <Text style={styles.actionBtnText}>{playing ? '⏹️ Stop' : '▶️ Play'}</Text>
          </TouchableOpacity>

          {/* Download Button */}
          {!downloaded && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.downloadBtn]}
              onPress={() => downloadVoice(voice)}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>📥 Download</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Select Button */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.selectBtn, selected && styles.selectBtnActive]}
            onPress={() => saveSelection(voice.id, tab)}
            disabled={selected}
          >
            <Text style={[styles.actionBtnText, selected && styles.selectBtnTextActive]}>
              {selected ? '✓ Selected' : 'Select'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🕌 Adhan Voices</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Select beautiful Adhan recitations from famous mosques and reciters around the world.
          Fajr Adhan includes "الصلاة خير من النوم" (Prayer is better than sleep).
        </Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'regular' && styles.tabActive]}
            onPress={() => setTab('regular')}
          >
            <Text style={[styles.tabText, tab === 'regular' && styles.tabTextActive]}>
              ☀️ Regular Adhan
            </Text>
            <Text style={styles.tabSubtext}>Dhuhr, Asr, Maghrib, Isha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, tab === 'fajr' && styles.tabActive]}
            onPress={() => setTab('fajr')}
          >
            <Text style={[styles.tabText, tab === 'fajr' && styles.tabTextActive]}>
              🌙 Fajr Adhan
            </Text>
            <Text style={styles.tabSubtext}>Special dawn call</Text>
          </TouchableOpacity>
        </View>

        {/* Current Selection */}
        <View style={styles.currentSelection}>
          <Text style={styles.currentLabel}>
            Current {tab === 'fajr' ? 'Fajr' : 'Regular'} Adhan:
          </Text>
          <Text style={styles.currentValue}>
            {getAdhanVoiceById(tab === 'fajr' ? selectedFajr : selectedRegular)?.name || 'None'}
          </Text>
        </View>

        {/* Voice List */}
        <ScrollView style={styles.voiceList} showsVerticalScrollIndicator={false}>
          {currentVoices.map(renderVoiceItem)}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Downloaded voices work offline. Stream others with internet.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d2818',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#1a4a3a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d4af37',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 13,
    color: '#a8d5ba',
    paddingHorizontal: 20,
    paddingVertical: 12,
    lineHeight: 20,
    backgroundColor: 'rgba(26, 74, 58, 0.5)',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#d4af37',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#a8d5ba',
  },
  tabTextActive: {
    color: '#0d2818',
  },
  tabSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  currentSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 10,
  },
  currentLabel: {
    fontSize: 13,
    color: '#a8d5ba',
  },
  currentValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#d4af37',
    marginLeft: 8,
  },
  voiceList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  voiceCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 15,
    padding: 15,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  voiceCardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#d4af37',
  },
  voiceInfo: {
    marginBottom: 12,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  voiceName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedBadge: {
    fontSize: 12,
    color: '#4ade80',
    fontWeight: 'bold',
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  downloadedBadge: {
    fontSize: 11,
    color: '#60a5fa',
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  reciter: {
    fontSize: 14,
    color: '#a8d5ba',
    marginBottom: 2,
  },
  origin: {
    fontSize: 13,
    color: 'rgba(168, 213, 186, 0.8)',
    marginBottom: 2,
  },
  duration: {
    fontSize: 12,
    color: 'rgba(168, 213, 186, 0.6)',
  },
  voiceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnActive: {
    backgroundColor: '#ef4444',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  downloadBtn: {
    backgroundColor: '#3b82f6',
  },
  selectBtn: {
    backgroundColor: '#22c55e',
  },
  selectBtnActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  selectBtnTextActive: {
    color: '#4ade80',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(26, 74, 58, 0.5)',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(168, 213, 186, 0.7)',
    textAlign: 'center',
  },
});

// Helper functions to get selected voices from anywhere in the app
export async function getSelectedRegularAdhan(): Promise<string> {
  try {
    const id = await AsyncStorage.getItem(STORAGE_KEY_REGULAR);
    return id || 'makkah-regular';
  } catch {
    return 'makkah-regular';
  }
}

export async function getSelectedFajrAdhan(): Promise<string> {
  try {
    const id = await AsyncStorage.getItem(STORAGE_KEY_FAJR);
    return id || 'makkah-fajr';
  } catch {
    return 'makkah-fajr';
  }
}

export async function getAdhanUrlForPrayer(prayerName: string): Promise<string> {
  const isFajr = prayerName.toLowerCase() === 'fajr';
  const selectedId = isFajr ? await getSelectedFajrAdhan() : await getSelectedRegularAdhan();
  const voice = getAdhanVoiceById(selectedId);
  
  if (!voice) {
    // Return default Makkah adhan
    return isFajr 
      ? 'https://www.islamcan.com/audio/adhan/azan7.mp3'
      : 'https://www.islamcan.com/audio/adhan/azan1.mp3';
  }

  // Check if downloaded locally
  const localPath = FileSystem.documentDirectory + `adhan/${voice.id}.mp3`;
  try {
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) {
      return localPath;
    }
  } catch {}

  return voice.previewUrl;
}
