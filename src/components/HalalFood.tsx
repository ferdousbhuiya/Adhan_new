import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  TextInput,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

interface HalalFoodProps {
  visible: boolean;
  onClose: () => void;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone?: string;
  rating: number;
  distance: number;
  isOpen: boolean;
  cuisine: string;
  priceRange: string;
  image?: string;
}

const HalalFood: React.FC<HalalFoodProps> = ({ visible, onClose }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  const CUISINE_TYPES = [
    'All',
    'Middle Eastern',
    'Pakistani',
    'Indian',
    'Malaysian',
    'Turkish',
    'Lebanese',
    'Moroccan',
    'Egyptian',
    'Fast Food',
    'Other',
  ];

  // Mock data for demonstration - in a real app, this would come from an API
  const mockRestaurants: Restaurant[] = [
    {
      id: '1',
      name: 'Al-Madinah Restaurant',
      address: '123 Main St, City, State',
      phone: '+1-555-0123',
      rating: 4.5,
      distance: 0.8,
      isOpen: true,
      cuisine: 'Middle Eastern',
      priceRange: '$$',
    },
    {
      id: '2',
      name: 'Zam Zam Grill',
      address: '456 Oak Ave, City, State',
      phone: '+1-555-0456',
      rating: 4.2,
      distance: 1.2,
      isOpen: true,
      cuisine: 'Pakistani',
      priceRange: '$',
    },
    {
      id: '3',
      name: 'Halal Corner',
      address: '789 Pine St, City, State',
      phone: '+1-555-0789',
      rating: 4.7,
      distance: 2.1,
      isOpen: false,
      cuisine: 'Fast Food',
      priceRange: '$',
    },
    {
      id: '4',
      name: 'Istanbul Delight',
      address: '321 Elm St, City, State',
      phone: '+1-555-0321',
      rating: 4.3,
      distance: 1.8,
      isOpen: true,
      cuisine: 'Turkish',
      priceRange: '$$$',
    },
    {
      id: '5',
      name: 'Taj Mahal Cuisine',
      address: '654 Maple Ave, City, State',
      phone: '+1-555-0654',
      rating: 4.6,
      distance: 3.2,
      isOpen: true,
      cuisine: 'Indian',
      priceRange: '$$',
    },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location) {
      loadRestaurants();
    }
  }, [location, selectedCuisine]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to find nearby restaurants.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your location.');
    }
  };

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      let filteredRestaurants = mockRestaurants;

      // Filter by cuisine
      if (selectedCuisine !== 'All') {
        filteredRestaurants = filteredRestaurants.filter(
          restaurant => restaurant.cuisine === selectedCuisine
        );
      }

      // Filter by search query
      if (searchQuery.trim()) {
        filteredRestaurants = filteredRestaurants.filter(
          restaurant =>
            restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Sort by distance
      filteredRestaurants.sort((a, b) => a.distance - b.distance);

      setRestaurants(filteredRestaurants);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      Alert.alert('Error', 'Unable to load restaurants.');
    } finally {
      setLoading(false);
    }
  };

  const callRestaurant = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const openInMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
  };

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return '⭐'.repeat(fullStars) + (hasHalfStar ? '⭐' : '') + '☆'.repeat(emptyStars);
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = searchQuery === '' ||
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCuisine = selectedCuisine === 'All' || restaurant.cuisine === selectedCuisine;

    return matchesSearch && matchesCuisine;
  });

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Halal Food Finder</Text>
          <Text style={styles.subtitle}>Find nearby halal restaurants</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants or cuisine..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Cuisine Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cuisineFilter}
        contentContainerStyle={styles.cuisineFilterContent}
      >
        {CUISINE_TYPES.map((cuisine) => (
          <Pressable
            key={cuisine}
            style={[
              styles.cuisineChip,
              selectedCuisine === cuisine && styles.cuisineChipActive,
            ]}
            onPress={() => setSelectedCuisine(cuisine)}
          >
            <Text
              style={[
                styles.cuisineChipText,
                selectedCuisine === cuisine && styles.cuisineChipTextActive,
              ]}
            >
              {cuisine}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Results */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>🔍 Finding halal restaurants...</Text>
          </View>
        ) : filteredRestaurants.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🍽️</Text>
            <Text style={styles.emptyStateTitle}>No Restaurants Found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or cuisine filter
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
            </Text>

            {filteredRestaurants.map((restaurant) => (
              <View key={restaurant.id} style={styles.restaurantCard}>
                <View style={styles.restaurantHeader}>
                  <View style={styles.restaurantInfo}>
                    <Text style={styles.restaurantName}>{restaurant.name}</Text>
                    <Text style={styles.restaurantCuisine}>{restaurant.cuisine}</Text>
                  </View>
                  <View style={styles.restaurantMeta}>
                    <Text style={styles.rating}>
                      {getRatingStars(restaurant.rating)} ({restaurant.rating})
                    </Text>
                    <Text style={styles.priceRange}>{restaurant.priceRange}</Text>
                  </View>
                </View>

                <View style={styles.restaurantDetails}>
                  <Text style={styles.address}>📍 {restaurant.address}</Text>
                  <View style={styles.restaurantStats}>
                    <Text style={styles.distance}>📏 {restaurant.distance} miles</Text>
                    <Text style={[styles.status, restaurant.isOpen ? styles.open : styles.closed]}>
                      {restaurant.isOpen ? '🟢 Open' : '🔴 Closed'}
                    </Text>
                  </View>
                </View>

                <View style={styles.restaurantActions}>
                  {restaurant.phone && (
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => callRestaurant(restaurant.phone!)}
                    >
                      <Text style={styles.actionButtonText}>📞 Call</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => openInMaps(restaurant.address)}
                  >
                    <Text style={styles.actionButtonText}>🗺️ Directions</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🍖 Halal Food Guidelines</Text>
          <Text style={styles.tipsText}>
            • Look for restaurants certified by Islamic authorities
          </Text>
          <Text style={styles.tipsText}>
            • Avoid restaurants serving alcohol or pork
          </Text>
          <Text style={styles.tipsText}>
            • Check for halal certification symbols
          </Text>
          <Text style={styles.tipsText}>
            • When in doubt, ask about ingredients and preparation methods
          </Text>
        </View>
      </ScrollView>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: '#1a4a3a',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#2d5a47',
  },
  cuisineFilter: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#2d5a47',
  },
  cuisineFilterContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cuisineChip: {
    backgroundColor: '#1a4a3a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  cuisineChipActive: {
    backgroundColor: '#4CAF50',
  },
  cuisineChipText: {
    color: '#e9ecef',
    fontSize: 14,
    fontWeight: '500',
  },
  cuisineChipTextActive: {
    color: '#f8f9fa',
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
  restaurantCard: {
    backgroundColor: '#1a4a3a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2d5a47',
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 14,
    color: '#4CAF50',
  },
  restaurantMeta: {
    alignItems: 'flex-end',
  },
  rating: {
    fontSize: 12,
    color: '#d4af37',
    marginBottom: 4,
  },
  priceRange: {
    fontSize: 14,
    color: '#e9ecef',
    fontWeight: 'bold',
  },
  restaurantDetails: {
    marginBottom: 15,
  },
  address: {
    fontSize: 14,
    color: '#e9ecef',
    marginBottom: 8,
    lineHeight: 20,
  },
  restaurantStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distance: {
    fontSize: 14,
    color: '#e9ecef',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  open: {
    color: '#4CAF50',
  },
  closed: {
    color: '#dc3545',
  },
  restaurantActions: {
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

export default HalalFood;