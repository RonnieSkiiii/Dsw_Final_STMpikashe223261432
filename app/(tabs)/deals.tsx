import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { fetchRecommendedHotels } from '@/utils/api';

interface RecommendedHotel {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: string;
  image: { uri: string };
  description: string;
  isRecommended: boolean;
}

export default function DealsScreen() {
  const router = useRouter();
  const [hotels, setHotels] = useState<RecommendedHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRecommendedHotels();
      setHotels(data);
    } catch (err) {
      console.error('Error loading deals:', err);
      setError('Failed to load deals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchRecommendedHotels();
      setHotels(data);
    } catch (err) {
      console.error('Error refreshing deals:', err);
      Alert.alert('Error', 'Failed to refresh deals. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleHotelPress = (hotel: RecommendedHotel) => {
    Alert.alert(
      hotel.name,
      `Location: ${hotel.location}\nPrice: R${hotel.price}/night\nRating: ${hotel.rating}⭐\n\n${hotel.description}`,
      [
        { text: 'OK' },
      ]
    );
  };

  const renderHotelCard = ({ item }: { item: RecommendedHotel }) => (
    <TouchableOpacity
      style={styles.hotelCard}
      onPress={() => handleHotelPress(item)}
      activeOpacity={0.7}
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
        <View style={styles.hotelHeader}>
          <Text style={styles.hotelName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.isRecommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>🔥 Deal</Text>
            </View>
          )}
        </View>
        <Text style={styles.hotelLocation} numberOfLines={1}>
          {item.location}
        </Text>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>⭐ {item.rating}</Text>
        </View>
        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Special Price</Text>
            {item.originalPrice && item.originalPrice > item.price && (
              <View style={styles.discountContainer}>
                <Text style={styles.originalPrice}>R{item.originalPrice}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>-{item.discount}%</Text>
                </View>
              </View>
            )}
          </View>
          <View style={styles.priceValueContainer}>
            <Text style={styles.price}>R{item.price}</Text>
            <Text style={styles.priceUnit}>/night</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && hotels.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Loading amazing deals...</Text>
      </View>
    );
  }

  if (error && hotels.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDeals}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔥 Special Deals</Text>
        <Text style={styles.subtitle}>Recommended hotels just for you</Text>
      </View>
      <FlatList
        data={hotels}
        renderItem={renderHotelCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0a7ea4"
            colors={['#0a7ea4']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No deals available at the moment</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadDeals}>
              <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          loading && hotels.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#0a7ea4" />
            </View>
          ) : null
        }
      />
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
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
  hotelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  recommendedBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  hotelLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  priceValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
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
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF5252',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

