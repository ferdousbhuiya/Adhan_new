// Real Adhan Voice Sources - Free API endpoints for authentic Adhan recitations
// These are publicly available Adhan audio files from various reciters

export interface AdhanVoice {
  id: string;
  name: string;
  reciter: string;
  type: 'regular' | 'fajr'; // Fajr has different melody
  previewUrl: string;
  downloadUrl: string;
  duration?: string;
  origin?: string;
}

// Collection of authentic Adhan voices from various sources
export const ADHAN_VOICES: AdhanVoice[] = [
  // Regular Adhan (for Dhuhr, Asr, Maghrib, Isha)
  {
    id: 'makkah-regular',
    name: 'Makkah Adhan',
    reciter: 'Sheikh Ali Ahmed Mullah',
    type: 'regular',
    previewUrl: 'https://www.islamcan.com/audio/adhan/azan1.mp3',
    downloadUrl: 'https://www.islamcan.com/audio/adhan/azan1.mp3',
    duration: '3:45',
    origin: 'Masjid al-Haram, Makkah',
  },
  {
    id: 'madinah-regular',
    name: 'Madinah Adhan',
    reciter: 'Sheikh Essam Bukhari',
    type: 'regular',
    previewUrl: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
    downloadUrl: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
    duration: '3:30',
    origin: 'Masjid an-Nabawi, Madinah',
  },
  {
    id: 'mishary-regular',
    name: 'Mishary Rashid Adhan',
    reciter: 'Mishary Rashid Alafasy',
    type: 'regular',
    previewUrl: 'https://www.islamcan.com/audio/adhan/azan3.mp3',
    downloadUrl: 'https://www.islamcan.com/audio/adhan/azan3.mp3',
    duration: '4:00',
    origin: 'Kuwait',
  },
  {
    id: 'abdul-basit-regular',
    name: 'Abdul Basit Adhan',
    reciter: 'Sheikh Abdul Basit',
    type: 'regular',
    previewUrl: 'https://www.islamcan.com/audio/adhan/azan4.mp3',
    downloadUrl: 'https://www.islamcan.com/audio/adhan/azan4.mp3',
    duration: '3:50',
    origin: 'Egypt',
  },
  {
    id: 'egypt-regular',
    name: 'Egyptian Adhan',
    reciter: 'Al-Azhar Mosque',
    type: 'regular',
    previewUrl: 'https://www.islamcan.com/audio/adhan/azan5.mp3',
    downloadUrl: 'https://www.islamcan.com/audio/adhan/azan5.mp3',
    duration: '4:10',
    origin: 'Al-Azhar, Cairo',
  },
  {
    id: 'turkish-regular',
    name: 'Turkish Adhan',
    reciter: 'Turkish Style',
    type: 'regular',
    previewUrl: 'https://www.islamcan.com/audio/adhan/azan6.mp3',
    downloadUrl: 'https://www.islamcan.com/audio/adhan/azan6.mp3',
    duration: '3:40',
    origin: 'Turkey',
  },

  // Fajr Adhan (special melody with "الصلاة خير من النوم")
  {
    id: 'makkah-fajr',
    name: 'Makkah Fajr Adhan',
    reciter: 'Sheikh Ali Ahmed Mullah',
    type: 'fajr',
    previewUrl: 'https://www.islamcan.com/audio/adhan/azan7.mp3',
    downloadUrl: 'https://www.islamcan.com/audio/adhan/azan7.mp3',
    duration: '4:00',
    origin: 'Masjid al-Haram, Makkah',
  },
  {
    id: 'madinah-fajr',
    name: 'Madinah Fajr Adhan',
    reciter: 'Sheikh Essam Bukhari',
    type: 'fajr',
    previewUrl: 'https://www.islamcan.com/audio/adhan/azan8.mp3',
    downloadUrl: 'https://www.islamcan.com/audio/adhan/azan8.mp3',
    duration: '4:15',
    origin: 'Masjid an-Nabawi, Madinah',
  },
  {
    id: 'mishary-fajr',
    name: 'Mishary Fajr Adhan',
    reciter: 'Mishary Rashid Alafasy',
    type: 'fajr',
    previewUrl: 'https://www.islamcan.com/audio/adhan/azan9.mp3',
    downloadUrl: 'https://www.islamcan.com/audio/adhan/azan9.mp3',
    duration: '4:30',
    origin: 'Kuwait',
  },
  {
    id: 'abdul-basit-fajr',
    name: 'Abdul Basit Fajr',
    reciter: 'Sheikh Abdul Basit',
    type: 'fajr',
    previewUrl: 'https://www.islamcan.com/audio/adhan/azan10.mp3',
    downloadUrl: 'https://www.islamcan.com/audio/adhan/azan10.mp3',
    duration: '4:20',
    origin: 'Egypt',
  },
];

// Alternative API sources (backup)
export const ALTERNATIVE_SOURCES = {
  // IslamicFinder API (requires API key for some features)
  islamicFinder: 'https://www.islamicfinder.org/prayer-times/',
  
  // MP3Quran has some Adhan files
  mp3Quran: 'https://server8.mp3quran.net/azan/',
  
  // Archive.org has many Islamic audio files
  archiveOrg: 'https://archive.org/download/adhan-collection/',
};

// Get all regular Adhan voices (for Dhuhr, Asr, Maghrib, Isha)
export function getRegularAdhanVoices(): AdhanVoice[] {
  return ADHAN_VOICES.filter(v => v.type === 'regular');
}

// Get all Fajr Adhan voices
export function getFajrAdhanVoices(): AdhanVoice[] {
  return ADHAN_VOICES.filter(v => v.type === 'fajr');
}

// Get all voices
export function getAllAdhanVoices(): AdhanVoice[] {
  return ADHAN_VOICES;
}

// Get voice by ID
export function getAdhanVoiceById(id: string): AdhanVoice | undefined {
  return ADHAN_VOICES.find(v => v.id === id);
}

// Get default voices
export function getDefaultVoices(): { regular: AdhanVoice; fajr: AdhanVoice } {
  return {
    regular: ADHAN_VOICES.find(v => v.id === 'makkah-regular')!,
    fajr: ADHAN_VOICES.find(v => v.id === 'makkah-fajr')!,
  };
}
