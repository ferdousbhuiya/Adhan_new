import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
  Switch,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface LocationServicesProps {
  onClose?: () => void;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

const LocationServices: React.FC<LocationServicesProps> = ({ onClose }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [highAccuracy, setHighAccuracy] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(false);

  const LOCATION_HISTORY_KEY = 'LOCATION_HISTORY';
  const HIGH_ACCURACY_KEY = 'HIGH_ACCURACY_MODE';
  const AUTO_UPDATE_KEY = 'AUTO_LOCATION_UPDATE';

  useEffect(() => {
    checkPermissions();
    loadSettings();
    loadLocationHistory();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoUpdate && locationPermission) {
      interval = setInterval(() => {
        getCurrentLocation();
      }, 30000); // Update every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoUpdate, locationPermission]);

  const checkPermissions = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const highAcc = await AsyncStorage.getItem(HIGH_ACCURACY_KEY);
      if (highAcc) setHighAccuracy(highAcc === 'true');

      const autoUpd = await AsyncStorage.getItem(AUTO_UPDATE_KEY);
      if (autoUpd) setAutoUpdate(autoUpd === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadLocationHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(LOCATION_HISTORY_KEY);
      if (history) {
        setLocationHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading location history:', error);
    }
  };

  const saveLocationHistory = async (newLocation: LocationData) => {
    try {
      const updatedHistory = [newLocation, ...locationHistory.slice(0, 9)]; // Keep last 10
      setLocationHistory(updatedHistory);
      await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving location history:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert(
          'Permission Denied',
          'Location permission is required for prayer times and Qibla direction. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request location permission.');
    }
  };

  const getCurrentLocation = async () => {
    if (!locationPermission) {
      Alert.alert('Permission Required', 'Please grant location permission first.');
      return;
    }

    setLoading(true);
    try {
      const options: Location.LocationOptions = {
        accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      };

      const currentLocation = await Location.getCurrentPositionAsync(options);

      const locationData: LocationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy || 0,
        timestamp: currentLocation.timestamp,
      };

      // Get address
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });
        if (address) {
          locationData.address = `${address.city}, ${address.region}, ${address.country}`;
        }
      } catch (error) {
        console.error('Error getting address:', error);
      }

      setLocation(locationData);
      saveLocationHistory(locationData);

      Alert.alert('Success', 'Location updated successfully!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleHighAccuracy = async (value: boolean) => {
    setHighAccuracy(value);
    try {
      await AsyncStorage.setItem(HIGH_ACCURACY_KEY, value.toString());
    } catch (error) {
      console.error('Error saving high accuracy setting:', error);
    }
  };

  const toggleAutoUpdate = async (value: boolean) => {
    setAutoUpdate(value);
    try {
      await AsyncStorage.setItem(AUTO_UPDATE_KEY, value.toString());
    } catch (error) {
      console.error('Error saving auto update setting:', error);
    }
  };

  const clearHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear your location history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLocationHistory([]);
            try {
              await AsyncStorage.removeItem(LOCATION_HISTORY_KEY);
            } catch (error) {
              console.error('Error clearing history:', error);
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatCoordinate = (coord: number, type: 'lat' | 'lon') => {
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(6)}° ${direction}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Location Services</Text>
        <Text style={styles.subtitle}>Manage location for prayer times and Qibla</Text>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Permission Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Location Permission</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[
              styles.statusValue,
              locationPermission ? styles.statusGranted : styles.statusDenied
            ]}>
              {locationPermission === null ? 'Checking...' : locationPermission ? 'Granted' : 'Denied'}
            </Text>
          </View>

          {!locationPermission && (
            <Pressable style={styles.permissionButton} onPress={requestPermissions}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </Pressable>
          )}
        </View>

        {/* Current Location */}
        <View style={styles.locationCard}>
          <Text style={styles.cardTitle}>Current Location</Text>

          {location ? (
            <View style={styles.locationInfo}>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Latitude:</Text>
                <Text style={styles.coordValue}>
                  {formatCoordinate(location.latitude, 'lat')}
                </Text>
              </View>

              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Longitude:</Text>
                <Text style={styles.coordValue}>
                  {formatCoordinate(location.longitude, 'lon')}
                </Text>
              </View>

              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Accuracy:</Text>
                <Text style={styles.coordValue}>
                  ±{location.accuracy.toFixed(1)} meters
                </Text>
              </View>

              {location.address && (
                <View style={styles.addressRow}>
                  <Text style={styles.addressLabel}>Address:</Text>
                  <Text style={styles.addressValue}>{location.address}</Text>
                </View>
              )}

              <Text style={styles.timestamp}>
                Last updated: {formatTimestamp(location.timestamp)}
              </Text>
            </View>
          ) : (
            <Text style={styles.noLocation}>No location data available</Text>
          )}

          <Pressable
            style={[styles.updateButton, loading && styles.updateButtonDisabled]}
            onPress={getCurrentLocation}
            disabled={loading || !locationPermission}
          >
            <Text style={styles.updateButtonText}>
              {loading ? 'Getting Location...' : 'Update Location'}
            </Text>
          </Pressable>
        </View>

        {/* Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Location Settings</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>High Accuracy Mode</Text>
              <Text style={styles.settingDescription}>
                Use GPS for more precise location (uses more battery)
              </Text>
            </View>
            <Switch
              value={highAccuracy}
              onValueChange={toggleHighAccuracy}
              trackColor={{ false: '#4a7c59', true: '#4CAF50' }}
              thumbColor={highAccuracy ? '#f8f9fa' : '#d4af37'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Update</Text>
              <Text style={styles.settingDescription}>
                Automatically update location every 30 seconds
              </Text>
            </View>
            <Switch
              value={autoUpdate}
              onValueChange={toggleAutoUpdate}
              trackColor={{ false: '#4a7c59', true: '#4CAF50' }}
              thumbColor={autoUpdate ? '#f8f9fa' : '#d4af37'}
            />
          </View>
        </View>

        {/* Location History */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.cardTitle}>Location History</Text>
            <Pressable style={styles.clearButton} onPress={clearHistory}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </Pressable>
          </View>

          {locationHistory.length === 0 ? (
            <Text style={styles.noHistory}>No location history available</Text>
          ) : (
            locationHistory.map((loc, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyCoords}>
                  <Text style={styles.historyCoord}>
                    {formatCoordinate(loc.latitude, 'lat')}, {formatCoordinate(loc.longitude, 'lon')}
                  </Text>
                  <Text style={styles.historyAccuracy}>±{loc.accuracy.toFixed(1)}m</Text>
                </View>
                <Text style={styles.historyTime}>
                  {formatTimestamp(loc.timestamp)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>📍 Location Tips</Text>
          <Text style={styles.tipsText}>
            • Enable location for accurate prayer times and Qibla direction
          </Text>
          <Text style={styles.tipsText}>
            • High accuracy mode provides better precision but uses more battery
          </Text>
          <Text style={styles.tipsText}>
            • Location data is stored locally and never shared
          </Text>
          <Text style={styles.tipsText}>
            • You can clear location history anytime
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
  statusCard: {
    backgroundColor: '#1a4a3a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusLabel: {
    fontSize: 16,
    color: '#e9ecef',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusGranted: {
    color: '#4CAF50',
  },
  statusDenied: {
    color: '#dc3545',
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#f8f9fa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationCard: {
    backgroundColor: '#1a4a3a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 15,
  },
  locationInfo: {
    marginBottom: 20,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  coordLabel: {
    fontSize: 14,
    color: '#e9ecef',
  },
  coordValue: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  addressRow: {
    marginTop: 10,
    marginBottom: 10,
  },
  addressLabel: {
    fontSize: 14,
    color: '#e9ecef',
    marginBottom: 5,
  },
  addressValue: {
    fontSize: 14,
    color: '#d4af37',
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 10,
  },
  noLocation: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: '#666',
  },
  updateButtonText: {
    color: '#f8f9fa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsCard: {
    backgroundColor: '#1a4a3a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    color: '#f8f9fa',
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#e9ecef',
    lineHeight: 16,
  },
  historyCard: {
    backgroundColor: '#1a4a3a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  clearButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#f8f9fa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noHistory: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  historyItem: {
    backgroundColor: '#2d5a47',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyCoords: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyCoord: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  historyAccuracy: {
    fontSize: 10,
    color: '#d4af37',
  },
  historyTime: {
    fontSize: 10,
    color: '#888',
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

export default LocationServices;