import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { sampleHotels } from '@/data/hotels';

export default function ExploreScreen() {
  const [hotels, setHotels] = useState(sampleHotels);
  const [filteredHotels, setFilteredHotels] = useState(sampleHotels);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setHotels(sampleHotels);
    setFilteredHotels(sampleHotels);
  }, []);

  useEffect(() => {
    filterAndSortHotels();
  }, [searchQuery, sortBy, hotels]);

  const filterAndSortHotels = () => {
    let filtered = [...hotels];

    if (searchQuery) {
      filtered = filtered.filter(
        (hotel) =>
          hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hotel.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    setFilteredHotels(filtered);
  };

  const renderHotelCard = ({ item }) => (
    <TouchableOpacity
      style={styles.hotelCard}
      onPress={() => router.push({ pathname: '/hotel-details', params: { hotelId: item.id } })}
    >
      <Image 
        source={item.image} 
        style={styles.hotelImage}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        priority="high"
        recyclingKey={item.id}
        allowDownscaling={false}
        blurRadius={0}
      />
      <View style={styles.hotelInfo}>
        <Text style={styles.hotelName}>{item.name}</Text>
        <View style={styles.locationRow}>
          <Image
            source={require('@/Materials/06-Explore Page/Maps _ map-pin-2-fill.png')}
            style={styles.locationIcon}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <Text style={styles.hotelLocation}>{item.location}</Text>
        </View>
        <View style={styles.ratingRow}>
          <Image
            source={require('@/Materials/06-Explore Page/star.png')}
            style={styles.starIcon}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <Text style={styles.rating}>{item.rating}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.price}>R{item.price}</Text>
          <Text style={styles.priceUnit}>/night</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore Hotels</Text>
        <View style={styles.searchContainer}>
          <Image
            source={require('@/Materials/06-Explore Page/search.png')}
            style={styles.searchIcon}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hotels..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, sortBy === 'price-low' && styles.filterButtonActive]}
            onPress={() => setSortBy(sortBy === 'price-low' ? 'default' : 'price-low')}
          >
            <Text
              style={[
                styles.filterButtonText,
                sortBy === 'price-low' && styles.filterButtonTextActive,
              ]}
            >
              Price: Low to High
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, sortBy === 'rating' && styles.filterButtonActive]}
            onPress={() => setSortBy(sortBy === 'rating' ? 'default' : 'rating')}
          >
            <Text
              style={[
                styles.filterButtonText,
                sortBy === 'rating' && styles.filterButtonTextActive,
              ]}
            >
              Highest Rated
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : filteredHotels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hotels found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHotels}
          renderItem={renderHotelCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#0a7ea4',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  hotelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  hotelImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#E0E0E0',
  },
  hotelInfo: {
    padding: 16,
  },
  hotelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  hotelLocation: {
    fontSize: 14,
    color: '#666',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  rating: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  priceUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
