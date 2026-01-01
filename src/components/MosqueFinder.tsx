import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

interface MosqueFinderProps {
  visible: boolean;
  onClose: () => void;
}

interface Mosque {
  id: string;
  name: string;
  address: string;
  phone?: string;
  distance: number;
  nextPrayer?: {
    name: string;
    time: Date;
  };
  facilities: string[];
  imam?: string;
  website?: string;
}

const MosqueFinder: React.FC<MosqueFinderProps> = ({ visible, onClose }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);

  // Mock data for demonstration - in a real app, this would come from an API
  const mockMosques: Mosque[] = [
    {
      id: '1',
      name: 'Islamic Center of City',
      address: '123 Faith St, City, State 12345',
      phone: '+1-555-0123',
      distance: 0.8,
      nextPrayer: {
        name: 'Maghrib',
        time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      },
      facilities: ['Prayer Hall', 'Wudu Area', 'Parking', 'Library', 'Community Center'],
      imam: 'Sheikh Ahmed',
      website: 'https://islamiccenter.example.com',
    },
    {
      id: '2',
      name: 'Al-Noor Mosque',
      address: '456 Peace Ave, City, State 12345',
      phone: '+1-555-0456',
      distance: 1.5,
      nextPrayer: {
        name: 'Isha',
        time: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      },
      facilities: ['Prayer Hall', 'Wudu Area', 'Parking', 'Islamic School'],
      imam: 'Imam Yusuf',
    },
    {
      id: '3',
      name: 'Masjid Al-Huda',
      address: '789 Unity Blvd, City, State 12345',
      phone: '+1-555-0789',
      distance: 2.2,
      nextPrayer: {
        name: 'Fajr',
        time: new Date(Date.now() + 12 * 60 * 60 * 1000), // Tomorrow Fajr
      },
      facilities: ['Prayer Hall', 'Wudu Area', 'Parking', 'Women\'s Area'],
      imam: 'Sheikh Omar',
      website: 'https://alhuda.example.com',
    },
    {
      id: '4',
      name: 'City Islamic Society',
      address: '321 Harmony St, City, State 12345',
      distance: 3.1,
      nextPrayer: {
        name: 'Dhuhr',
        time: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      },
      facilities: ['Prayer Hall', 'Wudu Area', 'Parking', 'Funeral Services'],
      imam: 'Imam Hassan',
    },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location) {
      loadMosques();
    }
  }, [location]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to find nearby mosques.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your location.');
    }
  };

  const loadMosques = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Sort by distance
      const sortedMosques = mockMosques.sort((a, b) => a.distance - b.distance);

      setMosques(sortedMosques);
    } catch (error) {
      console.error('Error loading mosques:', error);
      Alert.alert('Error', 'Unable to load mosques.');
    } finally {
      setLoading(false);
    }
  };

  const callMosque = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const openInMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
  };

  const openWebsite = (website: string) => {
    Linking.openURL(website);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeUntilPrayer = (prayerTime: Date) => {
    const now = new Date();
    const diff = prayerTime.getTime() - now.getTime();

    if (diff <= 0) return 'Now';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mosque Finder</Text>
        <Text style={styles.subtitle}>Find nearby mosques and prayer times</Text>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>🕌 Finding nearby mosques...</Text>
          </View>
        ) : mosques.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🕌</Text>
            <Text style={styles.emptyStateTitle}>No Mosques Found</Text>
            <Text style={styles.emptyStateText}>
              Unable to find mosques in your area
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {mosques.length} mosque{mosques.length !== 1 ? 's' : ''} found nearby
            </Text>

            {mosques.map((mosque) => (
              <View key={mosque.id} style={styles.mosqueCard}>
                <View style={styles.mosqueHeader}>
                  <View style={styles.mosqueInfo}>
                    <Text style={styles.mosqueName}>{mosque.name}</Text>
                    {mosque.imam && (
                      <Text style={styles.imamName}>Imam: {mosque.imam}</Text>
                    )}
                  </View>
                  <Text style={styles.distance}>📏 {mosque.distance} miles</Text>
                </View>

                <Text style={styles.address}>📍 {mosque.address}</Text>

                {mosque.nextPrayer && (
                  <View style={styles.nextPrayer}>
                    <Text style={styles.nextPrayerLabel}>Next Prayer:</Text>
                    <Text style={styles.nextPrayerTime}>
                      {mosque.nextPrayer.name} at {formatTime(mosque.nextPrayer.time)}
                    </Text>
                    <Text style={styles.timeUntil}>
                      (in {getTimeUntilPrayer(mosque.nextPrayer.time)})
                    </Text>
                  </View>
                )}

                <View style={styles.facilities}>
                  <Text style={styles.facilitiesLabel}>Facilities:</Text>
                  <Text style={styles.facilitiesList}>
                    {mosque.facilities.join(' • ')}
                  </Text>
                </View>

                <View style={styles.mosqueActions}>
                  {mosque.phone && (
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => callMosque(mosque.phone!)}
                    >
                      <Text style={styles.actionButtonText}>📞 Call</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => openInMaps(mosque.address)}
                  >
                    <Text style={styles.actionButtonText}>🗺️ Directions</Text>
                  </Pressable>
                  {mosque.website && (
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => openWebsite(mosque.website!)}
                    >
                      <Text style={styles.actionButtonText}>🌐 Website</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>

          <View style={styles.quickActionsGrid}>
            <Pressable style={styles.quickActionButton}>
              <Text style={styles.quickActionEmoji}>🕌</Text>
              <Text style={styles.quickActionText}>Find Nearest</Text>
            </Pressable>

            <Pressable style={styles.quickActionButton}>
              <Text style={styles.quickActionEmoji}>⏰</Text>
              <Text style={styles.quickActionText}>Prayer Times</Text>
            </Pressable>

            <Pressable style={styles.quickActionButton}>
              <Text style={styles.quickActionEmoji}>📅</Text>
              <Text style={styles.quickActionText}>Jumu'ah Times</Text>
            </Pressable>

            <Pressable style={styles.quickActionButton}>
              <Text style={styles.quickActionEmoji}>📍</Text>
              <Text style={styles.quickActionText}>Save Location</Text>
            </Pressable>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🕌 Mosque Etiquette</Text>
          <Text style={styles.tipsText}>
            • Perform wudu before entering the prayer area
          </Text>
          <Text style={styles.tipsText}>
            • Dress modestly and remove shoes if required
          </Text>
          <Text style={styles.tipsText}>
            • Be quiet and respectful during prayers
          </Text>
          <Text style={styles.tipsText}>
            • Greet others with "Assalamu Alaikum"
          </Text>
          <Text style={styles.tipsText}>
            • Help keep the mosque clean and well-maintained
          </Text>
        </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#0d1f17',
  },
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#e9ecef',
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
  resultsCount: {
    fontSize: 16,
    color: '#e9ecef',
    marginBottom: 15,
    fontWeight: '500',
  },
  mosqueCard: {
    backgroundColor: '#1a4a3a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2d5a47',
  },
  mosqueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  mosqueInfo: {
    flex: 1,
  },
  mosqueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 4,
  },
  imamName: {
    fontSize: 14,
    color: '#4CAF50',
  },
  distance: {
    fontSize: 14,
    color: '#e9ecef',
    fontWeight: '500',
  },
  address: {
    fontSize: 14,
    color: '#e9ecef',
    marginBottom: 10,
    lineHeight: 20,
  },
  nextPrayer: {
    backgroundColor: '#2d5a47',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  nextPrayerLabel: {
    fontSize: 12,
    color: '#e9ecef',
    marginBottom: 4,
  },
  nextPrayerTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  timeUntil: {
    fontSize: 12,
    color: '#d4af37',
    marginTop: 2,
  },
  facilities: {
    marginBottom: 15,
  },
  facilitiesLabel: {
    fontSize: 14,
    color: '#e9ecef',
    fontWeight: '500',
    marginBottom: 5,
  },
  facilitiesList: {
    fontSize: 12,
    color: '#e9ecef',
    lineHeight: 18,
  },
  mosqueActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2d5a47',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#f8f9fa',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickActions: {
    backgroundColor: '#1a4a3a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#2d5a47',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  quickActionText: {
    fontSize: 12,
    color: '#f8f9fa',
    fontWeight: '500',
    textAlign: 'center',
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

export default MosqueFinder;