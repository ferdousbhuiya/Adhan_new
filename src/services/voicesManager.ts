import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { AVAILABLE_SYNTHETIC_VOICES, generateSyntheticAdhan } from './voices';

const DOWNLOADED_KEY = 'DOWNLOADED_VOICES';
const ACTIVE_VOICE_KEY = 'ACTIVE_VOICE_ID';

export type VoiceMeta = {
  id: string;
  name: string;
  path?: string;
  variant?: string;
};

export type RemoteVoice = {
  id: string;
  name: string;
  previewUrl: string;
};

const DEMO_REMOTE_LIST: RemoteVoice[] = [
  { id: 'remote-a', name: 'Demo Voice A', previewUrl: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
  { id: 'remote-b', name: 'Demo Voice B', previewUrl: 'https://actions.google.com/sounds/v1/alarms/air_horn.ogg' },
  { id: 'remote-c', name: 'Demo Voice C', previewUrl: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' },
];

export function getAvailableVoices(): VoiceMeta[] {
  // For now use synthetic voices as the available list; in future this can fetch remote API
  return AVAILABLE_SYNTHETIC_VOICES.map((v) => ({ id: v.id, name: v.name, variant: v.id }));
}

export async function fetchRemoteVoices(url?: string): Promise<RemoteVoice[]> {
  if (!url) {
    // return a demo list when no URL provided
    return DEMO_REMOTE_LIST;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    // expect [{ id, name, previewUrl }]
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('fetchRemoteVoices failed', e);
    return [];
  }
}

export async function downloadRemoteVoice(remote: RemoteVoice): Promise<VoiceMeta | null> {
  try {
    const destDir = FileSystem.documentDirectory + 'voices/';
    await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
    const filename = `voice-${remote.id}.wav`;
    const newPath = destDir + filename;

    await FileSystem.deleteAsync(newPath, { idempotent: true });
    await FileSystem.downloadAsync(remote.previewUrl, newPath);

    const meta: VoiceMeta = { id: remote.id, name: remote.name, path: newPath, variant: remote.id };

    const raw = await AsyncStorage.getItem(DOWNLOADED_KEY);
    const arr: VoiceMeta[] = raw ? JSON.parse(raw) : [];
    const filtered = arr.filter((a) => a.id !== remote.id);
    filtered.push(meta);
    await AsyncStorage.setItem(DOWNLOADED_KEY, JSON.stringify(filtered));

    return meta;
  } catch (e) {
    console.warn('downloadRemoteVoice failed', e);
    return null;
  }
}

export async function downloadVoice(voiceId: string): Promise<VoiceMeta | null> {
  try {
    const destDir = FileSystem.documentDirectory + 'voices/';
    await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
    const path = await generateSyntheticAdhan(voiceId);
    // move file into voices folder
    const filename = `voice-${voiceId}.wav`;
    const newPath = destDir + filename;
    await FileSystem.copyAsync({ from: path, to: newPath });

    const meta: VoiceMeta = { id: voiceId, name: voiceId, path: newPath, variant: voiceId };

    const raw = await AsyncStorage.getItem(DOWNLOADED_KEY);
    const arr: VoiceMeta[] = raw ? JSON.parse(raw) : [];
    const filtered = arr.filter((a) => a.id !== voiceId);
    filtered.push(meta);
    await AsyncStorage.setItem(DOWNLOADED_KEY, JSON.stringify(filtered));

    return meta;
  } catch (e) {
    console.warn('downloadVoice failed', e);
    return null;
  }
}

export async function removeDownloadedVoice(voiceId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(DOWNLOADED_KEY);
  const arr: VoiceMeta[] = raw ? JSON.parse(raw) : [];
  const keep = arr.filter((a) => a.id !== voiceId);
  await AsyncStorage.setItem(DOWNLOADED_KEY, JSON.stringify(keep));

  const path = FileSystem.documentDirectory + `voices/voice-${voiceId}.wav`;
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) await FileSystem.deleteAsync(path, { idempotent: true });

  const active = await AsyncStorage.getItem(ACTIVE_VOICE_KEY);
  if (active === voiceId) {
    await AsyncStorage.removeItem(ACTIVE_VOICE_KEY);
  }
}

export async function listDownloadedVoices(): Promise<VoiceMeta[]> {
  const raw = await AsyncStorage.getItem(DOWNLOADED_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function setActiveVoice(voiceId: string | null): Promise<void> {
  if (!voiceId) {
    await AsyncStorage.removeItem(ACTIVE_VOICE_KEY);
    return;
  }
  await AsyncStorage.setItem(ACTIVE_VOICE_KEY, voiceId);
}

export async function getActiveVoice(): Promise<VoiceMeta | null> {
  const id = await AsyncStorage.getItem(ACTIVE_VOICE_KEY);
  if (!id) return null;
  const arr = await listDownloadedVoices();
  return arr.find((a) => a.id === id) || null;
}
