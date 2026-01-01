import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface QuranReaderProps {
  visible: boolean;
  onClose: () => void;
}

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
}

const QuranReader: React.FC<QuranReaderProps> = ({ visible, onClose }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSurahList, setShowSurahList] = useState(true);

  // Sample Quran data (in a real app, this would come from an API)
  const sampleSurahs: Surah[] = [
    {
      number: 1,
      name: 'الفاتحة',
      englishName: 'Al-Fatiha',
      englishNameTranslation: 'The Opening',
      numberOfAyahs: 7,
      revelationType: 'Meccan',
    },
    {
      number: 2,
      name: 'البقرة',
      englishName: 'Al-Baqarah',
      englishNameTranslation: 'The Cow',
      numberOfAyahs: 286,
      revelationType: 'Medinan',
    },
    {
      number: 36,
      name: 'يس',
      englishName: 'Ya-Sin',
      englishNameTranslation: 'Ya Sin',
      numberOfAyahs: 83,
      revelationType: 'Meccan',
    },
    {
      number: 67,
      name: 'الملك',
      englishName: 'Al-Mulk',
      englishNameTranslation: 'The Sovereignty',
      numberOfAyahs: 30,
      revelationType: 'Meccan',
    },
    {
      number: 112,
      name: 'الإخلاص',
      englishName: 'Al-Ikhlas',
      englishNameTranslation: 'The Purity',
      numberOfAyahs: 4,
      revelationType: 'Meccan',
    },
    {
      number: 114,
      name: 'الناس',
      englishName: 'An-Nas',
      englishNameTranslation: 'Mankind',
      numberOfAyahs: 6,
      revelationType: 'Meccan',
    },
  ];

  const sampleAyahs: { [key: number]: Ayah[] } = {
    1: [
      { number: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', numberInSurah: 1 },
      { number: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', numberInSurah: 2 },
      { number: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ', numberInSurah: 3 },
      { number: 4, text: 'مَالِكِ يَوْمِ الدِّينِ', numberInSurah: 4 },
      { number: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', numberInSurah: 5 },
      { number: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', numberInSurah: 6 },
      { number: 7, text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', numberInSurah: 7 },
    ],
    112: [
      { number: 6204, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', numberInSurah: 1 },
      { number: 6205, text: 'اللَّهُ الصَّمَدُ', numberInSurah: 2 },
      { number: 6206, text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', numberInSurah: 3 },
      { number: 6207, text: 'وَلَمْ يَكُنْ لَّهُ كُفُوًا أَحَدٌ', numberInSurah: 4 },
    ],
  };

  useEffect(() => {
    // In a real app, fetch from API
    setSurahs(sampleSurahs);
  }, []);

  const loadSurah = async (surah: Surah) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const surahAyahs = sampleAyahs[surah.number] || [];
      if (surahAyahs.length === 0) {
        // Generate sample ayahs for demonstration
        const generatedAyahs: Ayah[] = [];
        for (let i = 1; i <= Math.min(surah.numberOfAyahs, 10); i++) {
          generatedAyahs.push({
            number: i,
            text: `آية رقم ${i} من سورة ${surah.name}`,
            numberInSurah: i,
          });
        }
        setAyahs(generatedAyahs);
      } else {
        setAyahs(surahAyahs);
      }

      setSelectedSurah(surah);
      setShowSurahList(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load surah');
    } finally {
      setLoading(false);
    }
  };

  const goBackToList = () => {
    setSelectedSurah(null);
    setAyahs([]);
    setShowSurahList(true);
  };

  if (loading) {
    return (
      <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quran Reader</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

      {showSurahList ? (
        <ScrollView style={styles.surahList}>
          <Text style={styles.sectionTitle}>Surahs</Text>
          {surahs.map((surah) => (
            <Pressable
              key={surah.number}
              style={styles.surahItem}
              onPress={() => loadSurah(surah)}
            >
              <View style={styles.surahInfo}>
                <View style={styles.surahNumber}>
                  <Text style={styles.surahNumberText}>{surah.number}</Text>
                </View>
                <View style={styles.surahDetails}>
                  <Text style={styles.surahName}>{surah.name}</Text>
                  <Text style={styles.surahEnglish}>{surah.englishName}</Text>
                  <Text style={styles.surahMeta}>
                    {surah.numberOfAyahs} verses • {surah.revelationType}
                  </Text>
                </View>
              </View>
              <View style={styles.arrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.surahView}>
          <View style={styles.surahHeader}>
            <Pressable onPress={goBackToList} style={styles.backButton}>
              <Text style={styles.backText}>‹ Back</Text>
            </Pressable>
            <View style={styles.surahTitle}>
              <Text style={styles.surahTitleArabic}>{selectedSurah?.name}</Text>
              <Text style={styles.surahTitleEnglish}>{selectedSurah?.englishName}</Text>
            </View>
          </View>

          <ScrollView style={styles.ayahsContainer}>
            <View style={styles.bismillah}>
              <Text style={styles.bismillahText}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
            </View>

            {ayahs.map((ayah) => (
              <View key={ayah.number} style={styles.ayahContainer}>
                <View style={styles.ayahNumber}>
                  <Text style={styles.ayahNumberText}>{ayah.numberInSurah}</Text>
                </View>
                <Text style={styles.ayahText}>{ayah.text}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      </View>
    </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d1f17',
  },
  loadingText: {
    color: '#f8f9fa',
    fontSize: 16,
    marginTop: 10,
  },
  surahList: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 20,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a4a3a',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  surahInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  surahNumberText: {
    color: '#f8f9fa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  surahDetails: {
    flex: 1,
  },
  surahName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 2,
  },
  surahEnglish: {
    fontSize: 14,
    color: '#e9ecef',
    marginBottom: 2,
  },
  surahMeta: {
    fontSize: 12,
    color: '#adb5bd',
  },
  arrow: {
    marginLeft: 10,
  },
  arrowText: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
  },
  surahView: {
    flex: 1,
  },
  surahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d5a47',
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  surahTitle: {
    flex: 1,
    alignItems: 'center',
  },
  surahTitleArabic: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 2,
  },
  surahTitleEnglish: {
    fontSize: 14,
    color: '#e9ecef',
  },
  ayahsContainer: {
    flex: 1,
    padding: 20,
  },
  bismillah: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
    backgroundColor: '#1a4a3a',
    borderRadius: 10,
  },
  bismillahText: {
    fontSize: 18,
    color: '#f8f9fa',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  ayahContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#1a4a3a',
    borderRadius: 10,
  },
  ayahNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 5,
  },
  ayahNumberText: {
    color: '#f8f9fa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ayahText: {
    flex: 1,
    fontSize: 16,
    color: '#f8f9fa',
    lineHeight: 24,
    textAlign: 'right',
  },
});

export default QuranReader;