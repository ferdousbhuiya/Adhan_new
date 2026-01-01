import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface TasbihCounterProps {
  onClose?: () => void;
}

interface DhikrPhrase {
  arabic: string;
  transliteration: string;
  translation: string;
  count: number;
}

const DHIKR_PHRASES: DhikrPhrase[] = [
  {
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'Subhanallah',
    translation: 'Glory be to Allah',
    count: 33,
  },
  {
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    translation: 'Praise be to Allah',
    count: 33,
  },
  {
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translation: 'Allah is the Greatest',
    count: 33,
  },
  {
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّٰهُ',
    transliteration: 'La ilaha illallah',
    translation: 'There is no god but Allah',
    count: 100,
  },
  {
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    translation: 'I seek forgiveness from Allah',
    count: 100,
  },
  {
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
    transliteration: 'Allahumma salli ala Muhammad',
    translation: 'O Allah, send blessings upon Muhammad',
    count: 100,
  },
];

const TasbihCounter: React.FC<TasbihCounterProps> = ({ onClose }) => {
  const [currentCount, setCurrentCount] = useState(0);
  const [selectedDhikr, setSelectedDhikr] = useState<DhikrPhrase>(DHIKR_PHRASES[0]);
  const [totalCounts, setTotalCounts] = useState<{ [key: string]: number }>({});
  const [showDhikrSelector, setShowDhikrSelector] = useState(false);

  const TASBIH_DATA_KEY = 'TASBIH_COUNTER_DATA';

  useEffect(() => {
    loadTasbihData();
  }, []);

  const loadTasbihData = async () => {
    try {
      const data = await AsyncStorage.getItem(TASBIH_DATA_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        setTotalCounts(parsedData.totalCounts || {});
      }
    } catch (error) {
      console.error('Failed to load Tasbih data:', error);
    }
  };

  const saveTasbihData = async () => {
    try {
      const data = {
        totalCounts,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(TASBIH_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save Tasbih data:', error);
    }
  };

  const incrementCount = () => {
    const newCount = currentCount + 1;
    setCurrentCount(newCount);

    // Update total counts
    const key = selectedDhikr.arabic;
    const updatedTotals = {
      ...totalCounts,
      [key]: (totalCounts[key] || 0) + 1,
    };
    setTotalCounts(updatedTotals);
    saveTasbihData();
  };

  const resetCount = () => {
    Alert.alert(
      'Reset Counter',
      'Are you sure you want to reset the current count?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => setCurrentCount(0),
        },
      ]
    );
  };

  const selectDhikr = (dhikr: DhikrPhrase) => {
    setSelectedDhikr(dhikr);
    setCurrentCount(0);
    setShowDhikrSelector(false);
  };

  const getProgressPercentage = () => {
    return Math.min((currentCount / selectedDhikr.count) * 100, 100);
  };

  const getTotalForDhikr = (dhikr: DhikrPhrase) => {
    return totalCounts[dhikr.arabic] || 0;
  };

  const getTotalAllDhikr = () => {
    return Object.values(totalCounts).reduce((sum, count) => sum + count, 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasbih Counter</Text>
        <Text style={styles.subtitle}>Digital Dhikr Beads</Text>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Current Dhikr Display */}
        <View style={styles.dhikrCard}>
          <Pressable
            style={styles.dhikrSelector}
            onPress={() => setShowDhikrSelector(!showDhikrSelector)}
          >
            <Text style={styles.dhikrArabic}>{selectedDhikr.arabic}</Text>
            <Text style={styles.dhikrTransliteration}>{selectedDhikr.transliteration}</Text>
            <Text style={styles.dhikrTranslation}>{selectedDhikr.translation}</Text>
            <Text style={styles.dhikrTarget}>Target: {selectedDhikr.count}</Text>
            <Text style={styles.selectorIcon}>{showDhikrSelector ? '▲' : '▼'}</Text>
          </Pressable>

          {showDhikrSelector && (
            <View style={styles.dhikrList}>
              {DHIKR_PHRASES.map((dhikr, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.dhikrOption,
                    selectedDhikr.arabic === dhikr.arabic && styles.dhikrOptionSelected,
                  ]}
                  onPress={() => selectDhikr(dhikr)}
                >
                  <Text style={styles.dhikrOptionArabic}>{dhikr.arabic}</Text>
                  <Text style={styles.dhikrOptionTranslation}>{dhikr.translation}</Text>
                  <Text style={styles.dhikrOptionCount}>×{dhikr.count}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Counter Display */}
        <View style={styles.counterCard}>
          <View style={styles.progressRing}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${getProgressPercentage()}%`,
                },
              ]}
            />
            <Pressable style={styles.counterButton} onPress={incrementCount}>
              <Text style={styles.counterNumber}>{currentCount}</Text>
              <Text style={styles.counterLabel}>Current</Text>
            </Pressable>
          </View>

          <View style={styles.counterActions}>
            <Pressable style={styles.resetButton} onPress={resetCount}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </Pressable>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Dhikr Statistics</Text>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Current Session:</Text>
            <Text style={styles.statValue}>{currentCount}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Selected Dhikr Total:</Text>
            <Text style={styles.statValue}>{getTotalForDhikr(selectedDhikr)}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>All Dhikr Total:</Text>
            <Text style={styles.statValue}>{getTotalAllDhikr()}</Text>
          </View>

          <Text style={styles.statsSubtitle}>Dhikr Breakdown:</Text>
          {DHIKR_PHRASES.map((dhikr, index) => (
            <View key={index} style={styles.dhikrStat}>
              <Text style={styles.dhikrStatName}>{dhikr.transliteration}</Text>
              <Text style={styles.dhikrStatCount}>{getTotalForDhikr(dhikr)}</Text>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Dhikr Tips</Text>
          <Text style={styles.tipsText}>
            • Focus on the meaning of the words while reciting
          </Text>
          <Text style={styles.tipsText}>
            • Try to complete the recommended count for each dhikr
          </Text>
          <Text style={styles.tipsText}>
            • Make dhikr a daily habit for spiritual growth
          </Text>
          <Text style={styles.tipsText}>
            • Recite with sincerity and presence of heart
          </Text>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  dhikrCard: {
    backgroundColor: '#1a4a3a',
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
  },
  dhikrSelector: {
    padding: 20,
    alignItems: 'center',
  },
  dhikrArabic: {
    fontSize: 28,
    color: '#f8f9fa',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  dhikrTransliteration: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  dhikrTranslation: {
    fontSize: 14,
    color: '#e9ecef',
    textAlign: 'center',
    marginBottom: 8,
  },
  dhikrTarget: {
    fontSize: 12,
    color: '#d4af37',
    textAlign: 'center',
  },
  selectorIcon: {
    fontSize: 16,
    color: '#e9ecef',
    marginTop: 8,
  },
  dhikrList: {
    borderTopWidth: 1,
    borderTopColor: '#2d5a47',
  },
  dhikrOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2d5a47',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dhikrOptionSelected: {
    backgroundColor: '#2d5a47',
  },
  dhikrOptionArabic: {
    fontSize: 16,
    color: '#f8f9fa',
    flex: 2,
  },
  dhikrOptionTranslation: {
    fontSize: 12,
    color: '#e9ecef',
    flex: 2,
    textAlign: 'center',
  },
  dhikrOptionCount: {
    fontSize: 14,
    color: '#d4af37',
    fontWeight: 'bold',
  },
  counterCard: {
    backgroundColor: '#1a4a3a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  progressRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: '#2d5a47',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 100,
  },
  counterButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#0d1f17',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  counterNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 4,
  },
  counterLabel: {
    fontSize: 14,
    color: '#e9ecef',
  },
  counterActions: {
    width: '100%',
  },
  resetButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
  },
  resetButtonText: {
    color: '#f8f9fa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: '#1a4a3a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2d5a47',
  },
  statLabel: {
    fontSize: 14,
    color: '#e9ecef',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statsSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginTop: 15,
    marginBottom: 10,
  },
  dhikrStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#2d5a47',
    borderRadius: 8,
    marginBottom: 5,
  },
  dhikrStatName: {
    fontSize: 12,
    color: '#e9ecef',
  },
  dhikrStatCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d4af37',
  },
  tipsCard: {
    backgroundColor: '#1a4a3a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 15,
  },
  tipsText: {
    fontSize: 14,
    color: '#e9ecef',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default TasbihCounter;