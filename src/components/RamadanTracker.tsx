import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface RamadanTrackerProps {
  onClose?: () => void;
}

interface RamadanDay {
  day: number;
  date: Date;
  fasting: boolean;
  prayersCompleted: string[];
  taraweehCompleted: boolean;
  quranReading: number; // pages read
  charity: boolean;
  notes: string;
}

const RamadanTracker: React.FC<RamadanTrackerProps> = ({ onClose }) => {
  const [ramadanDays, setRamadanDays] = useState<RamadanDay[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [selectedDay, setSelectedDay] = useState<RamadanDay | null>(null);
  const [isRamadan, setIsRamadan] = useState(true);

  const RAMADAN_DATA_KEY = 'RAMADAN_TRACKER_DATA';

  useEffect(() => {
    initializeRamadan();
    loadRamadanData();
  }, []);

  const initializeRamadan = () => {
    // For demonstration, create 30 days of Ramadan
    const days: RamadanDay[] = [];
    const today = new Date();

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (i - currentDay));

      days.push({
        day: i,
        date,
        fasting: false,
        prayersCompleted: [],
        taraweehCompleted: false,
        quranReading: 0,
        charity: false,
        notes: '',
      });
    }

    setRamadanDays(days);
  };

  const loadRamadanData = async () => {
    try {
      const data = await AsyncStorage.getItem(RAMADAN_DATA_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        setRamadanDays(parsedData.days || []);
        setCurrentDay(parsedData.currentDay || 1);
      }
    } catch (error) {
      console.error('Failed to load Ramadan data:', error);
    }
  };

  const saveRamadanData = async () => {
    try {
      const data = {
        days: ramadanDays,
        currentDay,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(RAMADAN_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save Ramadan data:', error);
    }
  };

  const updateDay = (dayNumber: number, updates: Partial<RamadanDay>) => {
    setRamadanDays(prev =>
      prev.map(day =>
        day.day === dayNumber ? { ...day, ...updates } : day
      )
    );
    saveRamadanData();
  };

  const togglePrayer = (dayNumber: number, prayer: string) => {
    const day = ramadanDays.find(d => d.day === dayNumber);
    if (!day) return;

    const prayers = day.prayersCompleted.includes(prayer)
      ? day.prayersCompleted.filter(p => p !== prayer)
      : [...day.prayersCompleted, prayer];

    updateDay(dayNumber, { prayersCompleted: prayers });
  };

  const getPrayerEmoji = (prayer: string) => {
    const emojis: { [key: string]: string } = {
      Fajr: '🌙',
      Dhuhr: '☀️',
      Asr: '🌅',
      Maghrib: '🌆',
      Isha: '⭐',
    };
    return emojis[prayer] || '🕌';
  };

  const getTotalStats = () => {
    const totalFasting = ramadanDays.filter(day => day.fasting).length;
    const totalPrayers = ramadanDays.reduce((sum, day) => sum + day.prayersCompleted.length, 0);
    const totalQuran = ramadanDays.reduce((sum, day) => sum + day.quranReading, 0);
    const totalCharity = ramadanDays.filter(day => day.charity).length;
    const totalTaraweeh = ramadanDays.filter(day => day.taraweehCompleted).length;

    return { totalFasting, totalPrayers, totalQuran, totalCharity, totalTaraweeh };
  };

  const stats = getTotalStats();

  if (!isRamadan) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ramadan Tracker</Text>
          {onClose && (
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.notRamadan}>
          <Text style={styles.notRamadanEmoji}>🌙</Text>
          <Text style={styles.notRamadanTitle}>Ramadan Mubarak!</Text>
          <Text style={styles.notRamadanText}>
            Ramadan is a month of fasting, prayer, and spiritual reflection.
            Use this tracker to monitor your worship activities throughout the blessed month.
          </Text>
          <Pressable
            style={styles.startButton}
            onPress={() => setIsRamadan(true)}
          >
            <Text style={styles.startButtonText}>Start Tracking</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ramadan Tracker</Text>
        <Text style={styles.subtitle}>Day {currentDay} of 30</Text>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your Ramadan Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalFasting}</Text>
              <Text style={styles.statLabel}>Days Fasted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalPrayers}</Text>
              <Text style={styles.statLabel}>Prayers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalQuran}</Text>
              <Text style={styles.statLabel}>Quran Pages</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalCharity}</Text>
              <Text style={styles.statLabel}>Charity Acts</Text>
            </View>
          </View>
        </View>

        {/* Ramadan Days */}
        <View style={styles.daysContainer}>
          <Text style={styles.sectionTitle}>Daily Tracking</Text>
          {ramadanDays.slice(0, 10).map((day) => (
            <Pressable
              key={day.day}
              style={[
                styles.dayItem,
                day.day === currentDay && styles.currentDay,
                day.fasting && styles.completedDay,
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <View style={styles.dayHeader}>
                <Text style={styles.dayNumber}>Day {day.day}</Text>
                <Text style={styles.dayDate}>
                  {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>

              <View style={styles.dayStats}>
                <View style={styles.dayStat}>
                  <Text style={[styles.dayStatText, day.fasting && styles.completedText]}>
                    {day.fasting ? '✅' : '❌'} Fast
                  </Text>
                </View>
                <View style={styles.dayStat}>
                  <Text style={styles.dayStatText}>
                    🕌 {day.prayersCompleted.length}/5
                  </Text>
                </View>
                <View style={styles.dayStat}>
                  <Text style={styles.dayStatText}>
                    📖 {day.quranReading}p
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Day Detail Modal would go here */}
      {selectedDay && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Day {selectedDay.day} Details</Text>
              <Pressable onPress={() => setSelectedDay(null)} style={styles.closeModal}>
                <Text style={styles.closeModalText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Fasting */}
              <View style={styles.trackerItem}>
                <Text style={styles.trackerLabel}>Fasting</Text>
                <Pressable
                  style={[styles.checkbox, selectedDay.fasting && styles.checked]}
                  onPress={() => updateDay(selectedDay.day, { fasting: !selectedDay.fasting })}
                >
                  <Text style={styles.checkboxText}>{selectedDay.fasting ? '✓' : ''}</Text>
                </Pressable>
              </View>

              {/* Prayers */}
              <View style={styles.trackerItem}>
                <Text style={styles.trackerLabel}>Prayers Completed</Text>
                <View style={styles.prayersGrid}>
                  {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                    <Pressable
                      key={prayer}
                      style={[
                        styles.prayerButton,
                        selectedDay.prayersCompleted.includes(prayer) && styles.prayerCompleted,
                      ]}
                      onPress={() => togglePrayer(selectedDay.day, prayer)}
                    >
                      <Text style={styles.prayerEmoji}>{getPrayerEmoji(prayer)}</Text>
                      <Text style={styles.prayerName}>{prayer}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Taraweeh */}
              <View style={styles.trackerItem}>
                <Text style={styles.trackerLabel}>Taraweeh Prayer</Text>
                <Pressable
                  style={[styles.checkbox, selectedDay.taraweehCompleted && styles.checked]}
                  onPress={() => updateDay(selectedDay.day, { taraweehCompleted: !selectedDay.taraweehCompleted })}
                >
                  <Text style={styles.checkboxText}>{selectedDay.taraweehCompleted ? '✓' : ''}</Text>
                </Pressable>
              </View>

              {/* Quran Reading */}
              <View style={styles.trackerItem}>
                <Text style={styles.trackerLabel}>Quran Pages Read</Text>
                <View style={styles.counter}>
                  <Pressable
                    style={styles.counterButton}
                    onPress={() => updateDay(selectedDay.day, { quranReading: Math.max(0, selectedDay.quranReading - 1) })}
                  >
                    <Text style={styles.counterText}>-</Text>
                  </Pressable>
                  <Text style={styles.counterValue}>{selectedDay.quranReading}</Text>
                  <Pressable
                    style={styles.counterButton}
                    onPress={() => updateDay(selectedDay.day, { quranReading: selectedDay.quranReading + 1 })}
                  >
                    <Text style={styles.counterText}>+</Text>
                  </Pressable>
                </View>
              </View>

              {/* Charity */}
              <View style={styles.trackerItem}>
                <Text style={styles.trackerLabel}>Charity/Sadaqah</Text>
                <Pressable
                  style={[styles.checkbox, selectedDay.charity && styles.checked]}
                  onPress={() => updateDay(selectedDay.day, { charity: !selectedDay.charity })}
                >
                  <Text style={styles.checkboxText}>{selectedDay.charity ? '✓' : ''}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1f17',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d5a47',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8f9fa',
  },
  subtitle: {
    fontSize: 14,
    color: '#e9ecef',
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2d5a47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#f8f9fa',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notRamadan: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notRamadanEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  notRamadanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 10,
  },
  notRamadanText: {
    fontSize: 16,
    color: '#e9ecef',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#f8f9fa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    backgroundColor: '#1a4a3a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#e9ecef',
    textAlign: 'center',
  },
  daysContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 15,
  },
  dayItem: {
    backgroundColor: '#1a4a3a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  currentDay: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  completedDay: {
    backgroundColor: '#2d5a47',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8f9fa',
  },
  dayDate: {
    fontSize: 12,
    color: '#e9ecef',
  },
  dayStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayStat: {
    alignItems: 'center',
  },
  dayStatText: {
    fontSize: 12,
    color: '#e9ecef',
  },
  completedText: {
    color: '#4CAF50',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0d1f17',
    borderRadius: 15,
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderWidth: 1,
    borderColor: '#2d5a47',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d5a47',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8f9fa',
  },
  closeModal: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2d5a47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalText: {
    color: '#f8f9fa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  trackerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2d5a47',
  },
  trackerLabel: {
    fontSize: 16,
    color: '#f8f9fa',
    flex: 1,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#4CAF50',
  },
  checkboxText: {
    color: '#f8f9fa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  prayersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  prayerButton: {
    width: '18%',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1a4a3a',
    marginBottom: 8,
  },
  prayerCompleted: {
    backgroundColor: '#4CAF50',
  },
  prayerEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  prayerName: {
    fontSize: 10,
    color: '#f8f9fa',
    textAlign: 'center',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2d5a47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    color: '#f8f9fa',
    fontSize: 18,
    fontWeight: 'bold',
  },
  counterValue: {
    fontSize: 16,
    color: '#f8f9fa',
    marginHorizontal: 15,
    minWidth: 30,
    textAlign: 'center',
  },
});

export default RamadanTracker;