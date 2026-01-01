import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Share,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface DhikrItem {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference?: string;
  category: string;
  count: number;
}

interface DhikrCollectionProps {
  visible: boolean;
  onClose: () => void;
}

const DHIKR_CATEGORIES = [
  'Morning & Evening',
  'After Prayer',
  'Protection',
  'Forgiveness',
  'Praise',
  'Other',
];

const MORNING_EVENING_ADHKAR: DhikrItem[] = [
  {
    id: 'morning-1',
    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    transliteration: 'Asbahna wa asbahal mulku lillahi walhamdu lillahi la ilaha illallah wahdahu la sharika lahu',
    translation: 'We have reached the morning and the dominion belongs to Allah. All praise is for Allah. There is no god but Allah alone, with no partner for Him.',
    reference: 'Abu Dawood',
    category: 'Morning & Evening',
    count: 1,
  },
  {
    id: 'morning-2',
    arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
    transliteration: 'Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namutu wa ilaykan nushur',
    translation: 'O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the resurrection.',
    reference: 'Tirmidhi',
    category: 'Morning & Evening',
    count: 1,
  },
  {
    id: 'protection-1',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: 'A\'udhu bikalimatillahit-tammati min sharri ma khalaq',
    translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created.',
    reference: 'Muslim',
    category: 'Protection',
    count: 1,
  },
];

const AFTER_PRAYER_ADHKAR: DhikrItem[] = [
  {
    id: 'after-prayer-1',
    arabic: 'أَسْتَغْفِرُ اللَّهَ (ثلاثاً) اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    transliteration: 'Astaghfirullah (3x) Allahumma antas-salamu wa minkas-salamu tabarakta ya dhal-jalali wal-ikram',
    translation: 'I seek forgiveness from Allah (3x). O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of majesty and honor.',
    reference: 'Muslim',
    category: 'After Prayer',
    count: 1,
  },
];

const PROTECTION_ADHKAR: DhikrItem[] = [
  {
    id: 'protection-2',
    arabic: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    transliteration: 'Hasbiyallah la ilaha illa huwa \'alayhi tawakkaltu wa huwa rabbul \'arshil \'azim',
    translation: 'Allah is sufficient for me. There is no god but Him. I have placed my trust in Him, and He is the Lord of the Mighty Throne.',
    reference: 'Abu Dawood',
    category: 'Protection',
    count: 7,
  },
];

const FORGIVENESS_ADHKAR: DhikrItem[] = [
  {
    id: 'forgiveness-1',
    arabic: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
    transliteration: 'Rabbighfir li wa tub \'alayya innaka antat-tawwabur-rahim',
    translation: 'My Lord, forgive me and accept my repentance. Indeed, You are the Accepting of repentance, the Merciful.',
    reference: 'Various',
    category: 'Forgiveness',
    count: 1,
  },
];

const PRAISE_ADHKAR: DhikrItem[] = [
  {
    id: 'praise-1',
    arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    transliteration: 'Alhamdulillahi rabbil \'alamin',
    translation: 'All praise is for Allah, Lord of the worlds.',
    reference: 'Quran 1:2',
    category: 'Praise',
    count: 1,
  },
];

const DhikrCollection: React.FC<DhikrCollectionProps> = ({ visible, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('Morning & Evening');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [completedDhikr, setCompletedDhikr] = useState<{ [key: string]: boolean }>({});

  const FAVORITES_KEY = 'DHIKR_FAVORITES';
  const COMPLETED_KEY = 'DHIKR_COMPLETED';

  useEffect(() => {
    loadDhikrData();
  }, []);

  const loadDhikrData = async () => {
    try {
      const favoritesData = await AsyncStorage.getItem(FAVORITES_KEY);
      if (favoritesData) {
        setFavorites(JSON.parse(favoritesData));
      }

      const completedData = await AsyncStorage.getItem(COMPLETED_KEY);
      if (completedData) {
        setCompletedDhikr(JSON.parse(completedData));
      }
    } catch (error) {
      console.error('Failed to load Dhikr data:', error);
    }
  };

  const saveDhikrData = async () => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      await AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify(completedDhikr));
    } catch (error) {
      console.error('Failed to save Dhikr data:', error);
    }
  };

  const toggleFavorite = (dhikrId: string) => {
    const newFavorites = favorites.includes(dhikrId)
      ? favorites.filter(id => id !== dhikrId)
      : [...favorites, dhikrId];
    setFavorites(newFavorites);
    saveDhikrData();
  };

  const toggleCompleted = (dhikrId: string) => {
    const newCompleted = { ...completedDhikr, [dhikrId]: !completedDhikr[dhikrId] };
    setCompletedDhikr(newCompleted);
    saveDhikrData();
  };

  const shareDhikr = async (dhikr: DhikrItem) => {
    try {
      await Share.share({
        message: `${dhikr.arabic}\n\n${dhikr.transliteration}\n\n${dhikr.translation}${dhikr.reference ? `\n\n${dhikr.reference}` : ''}`,
      });
    } catch (error) {
      console.error('Failed to share dhikr:', error);
    }
  };

  const getDhikrForCategory = (category: string): DhikrItem[] => {
    switch (category) {
      case 'Morning & Evening':
        return MORNING_EVENING_ADHKAR;
      case 'After Prayer':
        return AFTER_PRAYER_ADHKAR;
      case 'Protection':
        return PROTECTION_ADHKAR;
      case 'Forgiveness':
        return FORGIVENESS_ADHKAR;
      case 'Praise':
        return PRAISE_ADHKAR;
      case 'Other':
        return [];
      default:
        return [];
    }
  };

  const getAllDhikr = (): DhikrItem[] => {
    return [
      ...MORNING_EVENING_ADHKAR,
      ...AFTER_PRAYER_ADHKAR,
      ...PROTECTION_ADHKAR,
      ...FORGIVENESS_ADHKAR,
      ...PRAISE_ADHKAR,
    ];
  };

  const getFavoritesDhikr = (): DhikrItem[] => {
    const allDhikr = getAllDhikr();
    return allDhikr.filter(dhikr => favorites.includes(dhikr.id));
  };

  const currentDhikr = selectedCategory === 'Favorites'
    ? getFavoritesDhikr()
    : getDhikrForCategory(selectedCategory);

  const categories = [...DHIKR_CATEGORIES, 'Favorites'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Adhkar Collection</Text>
        <Text style={styles.subtitle}>Islamic Remembrances</Text>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {categories.map((category) => (
          <Pressable
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryTabText,
                selectedCategory === category && styles.categoryTabTextActive,
              ]}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Dhikr List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentDhikr.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📿</Text>
            <Text style={styles.emptyStateTitle}>
              {selectedCategory === 'Favorites' ? 'No Favorites Yet' : 'No Dhikr Available'}
            </Text>
            <Text style={styles.emptyStateText}>
              {selectedCategory === 'Favorites'
                ? 'Add dhikr to your favorites by tapping the heart icon'
                : 'This category is currently empty'
              }
            </Text>
          </View>
        ) : (
          currentDhikr.map((dhikr) => (
            <View key={dhikr.id} style={styles.dhikrCard}>
              <View style={styles.dhikrHeader}>
                <View style={styles.dhikrActions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => toggleFavorite(dhikr.id)}
                  >
                    <Text style={styles.actionIcon}>
                      {favorites.includes(dhikr.id) ? '❤️' : '🤍'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => shareDhikr(dhikr)}
                  >
                    <Text style={styles.actionIcon}>📤</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => toggleCompleted(dhikr.id)}
                  >
                    <Text style={styles.actionIcon}>
                      {completedDhikr[dhikr.id] ? '✅' : '⬜'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.arabicText}>{dhikr.arabic}</Text>

              <Text style={styles.transliteration}>{dhikr.transliteration}</Text>

              <Text style={styles.translation}>{dhikr.translation}</Text>

              <View style={styles.dhikrFooter}>
                {dhikr.reference && (
                  <Text style={styles.reference}>{dhikr.reference}</Text>
                )}
                <Text style={styles.count}>Repeat: {dhikr.count}x</Text>
              </View>
            </View>
          ))
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Dhikr Tips</Text>
          <Text style={styles.tipsText}>
            • Recite dhikr with presence of heart and understanding of meaning
          </Text>
          <Text style={styles.tipsText}>
            • Morning adhkar are recited from Fajr until sunrise
          </Text>
          <Text style={styles.tipsText}>
            • Evening adhkar are recited from Asr until Maghrib
          </Text>
          <Text style={styles.tipsText}>
            • Consistency in dhikr brings peace and blessings
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
  categoryTabs: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#2d5a47',
  },
  categoryTabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryTab: {
    backgroundColor: '#1a4a3a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: '#4CAF50',
  },
  categoryTabText: {
    color: '#e9ecef',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#f8f9fa',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#e9ecef',
    textAlign: 'center',
    lineHeight: 24,
  },
  dhikrCard: {
    backgroundColor: '#1a4a3a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2d5a47',
  },
  dhikrHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
  },
  dhikrActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#2d5a47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 16,
  },
  arabicText: {
    fontSize: 24,
    color: '#f8f9fa',
    textAlign: 'right',
    fontWeight: 'bold',
    marginBottom: 15,
    lineHeight: 36,
  },
  transliteration: {
    fontSize: 14,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 20,
  },
  translation: {
    fontSize: 16,
    color: '#e9ecef',
    lineHeight: 24,
    marginBottom: 15,
  },
  dhikrFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2d5a47',
  },
  reference: {
    fontSize: 12,
    color: '#d4af37',
    fontStyle: 'italic',
  },
  count: {
    fontSize: 12,
    color: '#e9ecef',
    fontWeight: 'bold',
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

export default DhikrCollection;