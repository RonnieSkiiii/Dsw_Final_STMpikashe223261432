import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { sampleHotels } from '@/data/hotels';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestore, collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import app from '@/config/firebase';

const db = getFirestore(app);

export default function BookingScreen() {
  const { hotelId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [hotel, setHotel] = useState(null);
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 86400000)); // Tomorrow
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(1);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const foundHotel = sampleHotels.find((h) => h.id === hotelId);
    setHotel(foundHotel);
  }, [hotelId]);

  const calculateDays = () => {
    const diffTime = Math.abs(checkOutDate - checkInDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const calculateTotal = () => {
    if (!hotel) return 0;
    const days = calculateDays();
    return hotel.price * days * rooms;
  };

  const validateBooking = () => {
    if (checkOutDate <= checkInDate) {
      Alert.alert('Error', 'Check-out date must be after check-in date');
      return false;
    }
    if (rooms < 1) {
      Alert.alert('Error', 'Please select at least 1 room');
      return false;
    }
    if (guests < 1) {
      Alert.alert('Error', 'Please select at least 1 guest');
      return false;
    }
    return true;
  };

  const handleConfirmBooking = async () => {
    if (!validateBooking()) return;

    if (!user) {
      Alert.alert('Error', 'Please sign in to complete booking');
      router.push('/(auth)/signin');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        hotelId: hotelId,
        hotelName: hotel.name,
        userId: user.uid,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        rooms: rooms,
        guests: guests,
        totalPrice: calculateTotal(),
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        bookings: arrayUnion(bookingRef.id),
      });

      router.push({
        pathname: '/booking-success',
        params: {
          bookingId: bookingRef.id,
          hotelName: hotel.name,
          totalPrice: calculateTotal().toString(),
        },
      });
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to confirm booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!hotel) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Booking Details</Text>

        <View style={styles.hotelInfo}>
          <Text style={styles.hotelName}>{hotel.name}</Text>
          <Text style={styles.hotelLocation}>{hotel.location}</Text>
        </View>

        <View style={styles.dateContainer}>
          <View style={styles.dateInput}>
            <Text style={styles.label}>Check-in</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowCheckInPicker(true)}
            >
              <Text style={styles.dateText}>
                {checkInDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' ? (
              <Modal
                visible={showCheckInPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCheckInPicker(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity onPress={() => setShowCheckInPicker(false)}>
                        <Text style={styles.modalCancel}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.modalTitle}>Select Check-in Date</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setShowCheckInPicker(false);
                        }}
                      >
                        <Text style={styles.modalDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={checkInDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setCheckInDate(selectedDate);
                          if (selectedDate >= checkOutDate) {
                            setCheckOutDate(new Date(selectedDate.getTime() + 86400000));
                          }
                        }
                      }}
                      minimumDate={new Date()}
                      style={styles.picker}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              showCheckInPicker && (
                <DateTimePicker
                  value={checkInDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowCheckInPicker(false);
                    if (event.type === 'set' && selectedDate) {
                      setCheckInDate(selectedDate);
                      if (selectedDate >= checkOutDate) {
                        setCheckOutDate(new Date(selectedDate.getTime() + 86400000));
                      }
                    }
                  }}
                  minimumDate={new Date()}
                />
              )
            )}
          </View>

          <View style={styles.dateInput}>
            <Text style={styles.label}>Check-out</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowCheckOutPicker(true)}
            >
              <Text style={styles.dateText}>
                {checkOutDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' ? (
              <Modal
                visible={showCheckOutPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCheckOutPicker(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity onPress={() => setShowCheckOutPicker(false)}>
                        <Text style={styles.modalCancel}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.modalTitle}>Select Check-out Date</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setShowCheckOutPicker(false);
                        }}
                      >
                        <Text style={styles.modalDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={checkOutDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setCheckOutDate(selectedDate);
                        }
                      }}
                      minimumDate={new Date(checkInDate.getTime() + 86400000)}
                      style={styles.picker}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              showCheckOutPicker && (
                <DateTimePicker
                  value={checkOutDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowCheckOutPicker(false);
                    if (event.type === 'set' && selectedDate) {
                      setCheckOutDate(selectedDate);
                    }
                  }}
                  minimumDate={new Date(checkInDate.getTime() + 86400000)}
                />
              )
            )}
          </View>
        </View>

        <View style={styles.selectorContainer}>
          <Text style={styles.label}>Rooms</Text>
          <View style={styles.selectorRow}>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setRooms(Math.max(1, rooms - 1))}
            >
              <Text style={styles.selectorButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.selectorValue}>{rooms}</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setRooms(rooms + 1)}
            >
              <Text style={styles.selectorButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.selectorContainer}>
          <Text style={styles.label}>Guests</Text>
          <View style={styles.selectorRow}>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setGuests(Math.max(1, guests - 1))}
            >
              <Text style={styles.selectorButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.selectorValue}>{guests}</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setGuests(guests + 1)}
            >
              <Text style={styles.selectorButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              R{hotel.price} × {calculateDays()} nights × {rooms} room(s)
            </Text>
            <Text style={styles.summaryValue}>R{calculateTotal()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R{calculateTotal()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.buttonDisabled]}
          onPress={handleConfirmBooking}
          disabled={loading}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Processing...' : 'Confirm Booking'}
          </Text>
        </TouchableOpacity>
      </View>
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
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  hotelInfo: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  hotelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  hotelLocation: {
    fontSize: 14,
    color: '#666',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dateInput: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  selectorContainer: {
    marginBottom: 24,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
  },
  selectorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectorValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  summaryContainer: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a7ea4',
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
  confirmButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalDone: {
    fontSize: 16,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  picker: {
    height: 200,
  },
});

