import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { sampleHotels } from '@/data/hotels';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestore, collection, query, where, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { fetchWeather as fetchWeatherAPI } from '@/utils/api';
import app from '@/config/firebase';

const db = getFirestore(app);

const getSampleReviews = (hotelId) => {
  const reviewsByHotel = {
    '4': [
      {
        id: 'sample-tropical-1',
        userName: 'Maria Rodriguez',
        rating: 5,
        text: 'Absolutely stunning beachfront location! Waking up to ocean views every morning was incredible. The pool area is perfect for relaxation.',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'sample-tropical-2',
        userName: 'James Wilson',
        rating: 4,
        text: 'Great tropical vibes and friendly staff. The beach access was a huge plus. Breakfast could be better though.',
        createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      },
    ],
    '10': [
      {
        id: 'sample-resort-1',
        userName: 'Emily Thompson',
        rating: 5,
        text: 'The spa facilities are world-class! Had the most relaxing massage of my life. The desert views from the room are breathtaking.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'sample-resort-2',
        userName: 'David Martinez',
        rating: 4,
        text: 'Excellent resort with top-notch amenities. Golf course is well-maintained. Room service was a bit slow during peak hours.',
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
    ],
    '11': [
      {
        id: 'sample-coastal-1',
        userName: 'Jennifer Lee',
        rating: 5,
        text: 'Perfect location with stunning views of the Golden Gate Bridge! The hotel decor is elegant and modern. Highly recommend!',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        id: 'sample-coastal-2',
        userName: 'Robert Brown',
        rating: 4,
        text: 'Great stay in San Francisco. The hotel is centrally located and the staff are very helpful. Parking is expensive but convenient.',
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      },
    ],
    '12': [
      {
        id: 'sample-urban-1',
        userName: 'Lisa Anderson',
        rating: 5,
        text: 'Modern and stylish hotel right in downtown Seattle! The views from the upper floors are amazing. Perfect for business travelers.',
        createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      },
      {
        id: 'sample-urban-2',
        userName: 'Chris Taylor',
        rating: 4,
        text: 'Comfortable rooms with great amenities. The gym is well-equipped. Only downside was the street noise at night.',
        createdAt: new Date(Date.now() - 86400000 * 11).toISOString(),
      },
    ],
    '13': [
      {
        id: 'sample-desert-1',
        userName: 'Amanda White',
        rating: 5,
        text: 'Las Vegas luxury at its finest! The casino and entertainment facilities are incredible. Pool parties are a must-try experience!',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: 'sample-desert-2',
        userName: 'Kevin Johnson',
        rating: 4,
        text: 'Great resort with fantastic shows and dining options. The rooms are spacious and comfortable. Service can be slow during busy weekends.',
        createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
      },
    ],
    '15': [
      {
        id: 'sample-lakeside-1',
        userName: 'Nicole Garcia',
        rating: 5,
        text: 'Beautiful lakeside setting with stunning mountain views! Perfect for a romantic getaway. The spa services are exceptional.',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
      {
        id: 'sample-lakeside-2',
        userName: 'Mark Davis',
        rating: 4,
        text: 'Lovely resort with great outdoor activities. The lake access is perfect for water sports. Restaurant menu could have more variety.',
        createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      },
    ],
  };
  
  return reviewsByHotel[hotelId] || [
    {
      id: 'sample-default-1',
      userName: 'Sarah Johnson',
      rating: 5,
      text: 'Amazing stay! The hotel exceeded all expectations. Beautiful rooms and excellent service.',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'sample-default-2',
      userName: 'Michael Chen',
      rating: 4,
      text: 'Great location and comfortable rooms. Would definitely stay here again.',
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
  ];
};

export default function HotelDetailsScreen() {
  const { hotelId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [hotel, setHotel] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [firestoreReviews, setFirestoreReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    loadHotel();
  }, [hotelId]);

  useEffect(() => {
    if (user && firestoreReviews.length > 0) {
      const userReview = firestoreReviews.find((r) => r.userId === user.uid);
      setReviewSubmitted(!!userReview);
    } else {
      setReviewSubmitted(false);
    }
  }, [user, firestoreReviews]);

  const loadHotel = async () => {
    setLoading(true);
    try {
      const foundHotel = sampleHotels.find((h) => h.id === hotelId);
      
      if (foundHotel) {
        setHotel(foundHotel);
        const hotelSampleReviews = getSampleReviews(hotelId);
        setReviews(hotelSampleReviews);
        fetchReviews();
        if (foundHotel.location) {
          try {
            const weatherData = await fetchWeatherAPI(foundHotel.location);
            setWeather(weatherData);
          } catch (weatherError) {
            console.error('Weather fetch error:', weatherError);
          }
        }
      }
    } catch (error) {
      console.error('Error loading hotel:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = () => {
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('hotelId', '==', hotelId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFirestoreReviews(reviewsData);
      
      if (user) {
        const userReview = reviewsData.find((r) => r.userId === user.uid);
        setReviewSubmitted(!!userReview);
      }
      const sortedFirestoreReviews = reviewsData.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const hotelSampleReviews = getSampleReviews(hotelId);
      const allReviews = [...hotelSampleReviews, ...sortedFirestoreReviews];
      setReviews(allReviews);
    });

    return unsubscribe;
  };
  


  const handleAddReview = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to add a review');
      router.push('/(auth)/signin');
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please enter a review');
      return;
    }

    try {
      const newReview = {
        hotelId: hotelId,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        rating: reviewRating,
        text: reviewText,
        createdAt: new Date().toISOString(),
      };
      
      await addDoc(collection(db, 'reviews'), newReview);
      
      setReviews([newReview, ...reviews]);
      setReviewSubmitted(true);
      setReviewText('');
      setReviewRating(5);
      setShowReviewModal(false);
      
      setTimeout(() => {
        Alert.alert('Success', 'Thank you for your review!');
      }, 300);
    } catch (error) {
      console.error('Error adding review:', error);
      Alert.alert('Error', 'Failed to add review');
    }
  };

  const handleBookNow = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to book a hotel', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/signin') },
      ]);
      return;
    }
    router.push({ pathname: '/booking', params: { hotelId: hotelId } });
  };

  if (loading || !hotel) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image 
        source={hotel.image} 
        style={styles.headerImage}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        priority="high"
        allowDownscaling={false}
        blurRadius={0}
      />
      
      <View style={styles.content}>
        <Text style={styles.hotelName}>{hotel.name}</Text>
        
        <View style={styles.locationRow}>
          <Image
            source={require('@/Materials/06-Explore Page/Maps _ map-pin-2-fill.png')}
            style={styles.locationIcon}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <Text style={styles.location}>{hotel.location}</Text>
        </View>

        <View style={styles.ratingRow}>
          <Image
            source={require('@/Materials/06-Explore Page/star.png')}
            style={styles.starIcon}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <Text style={styles.rating}>{hotel.rating}</Text>
          <Text style={styles.ratingCount}>({reviews.length} reviews)</Text>
        </View>

        {weather && (
          <View style={styles.weatherContainer}>
            <Text style={styles.weatherText}>
              {weather.temperature}°C - {weather.description} in {weather.city}
            </Text>
          </View>
        )}

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.price}>R{hotel.price}</Text>
          <Text style={styles.priceUnit}>/night</Text>
        </View>

        <Text style={styles.description}>{hotel.description}</Text>

        {hotel.amenities && hotel.amenities.length > 0 && (
          <View style={styles.amenitiesContainer}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesList}>
              {hotel.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityBadge}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.reviewsContainer}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
            {!reviewSubmitted && user && (
              <TouchableOpacity onPress={() => setShowReviewModal(true)}>
                <Text style={styles.addReviewButton}>Add Review</Text>
              </TouchableOpacity>
            )}
            {!user && (
              <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
                <Text style={styles.addReviewButton}>Sign In to Review</Text>
              </TouchableOpacity>
            )}
            {reviewSubmitted && (
              <Text style={styles.thanksMessage}>Thanks for your review!</Text>
            )}
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet. Be the first to review!</Text>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUserName}>{review.userName}</Text>
                  <View style={styles.reviewRating}>
                    {[...Array(5)].map((_, i) => (
                      <Image
                        key={i}
                        source={require('@/Materials/06-Explore Page/star.png')}
                        style={[
                          styles.starIcon,
                          i >= review.rating && styles.starIconInactive,
                        ]}
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.bookButton, !user && styles.bookButtonDisabled]} 
          onPress={handleBookNow}
          disabled={!user}
        >
          <Text style={styles.bookButtonText}>
            {user ? 'Book Now' : 'Sign In to Book'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Review</Text>
            
            <Text style={styles.ratingLabel}>Rating</Text>
            <View style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  onPress={() => setReviewRating(rating)}
                >
                  <Image
                    source={require('@/Materials/06-Explore Page/star.png')}
                    style={[
                      styles.starIconLarge,
                      rating > reviewRating && styles.starIconInactive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.textAreaLabel}>Your Review</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Write your review..."
              placeholderTextColor="#999"
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={6}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAddReview}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#E0E0E0',
  },
  content: {
    padding: 20,
  },
  hotelName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  location: {
    fontSize: 16,
    color: '#666',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  starIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  starIconLarge: {
    width: 32,
    height: 32,
    marginHorizontal: 4,
  },
  starIconInactive: {
    opacity: 0.3,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  ratingCount: {
    fontSize: 14,
    color: '#999',
  },
  weatherContainer: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  weatherText: {
    fontSize: 14,
    color: '#1976D2',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 14,
    color: '#999',
    marginRight: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  priceUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  amenitiesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  amenityText: {
    fontSize: 14,
    color: '#666',
  },
  reviewsContainer: {
    marginBottom: 100,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addReviewButton: {
    color: '#0a7ea4',
    fontSize: 16,
    fontWeight: '600',
  },
  thanksMessage: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  noReviews: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  reviewItem: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bookButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  textAreaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

