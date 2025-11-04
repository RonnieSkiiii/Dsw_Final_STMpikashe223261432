import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function BookingSuccessScreen() {
  const { hotelName, totalPrice } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('@/Materials/12-Booking success Page/Path.png')}
          style={styles.successIcon}
        />
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.message}>
          Your booking at {hotelName} has been confirmed successfully.
        </Text>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsLabel}>Total Amount</Text>
          <Text style={styles.detailsValue}>R{totalPrice}</Text>
        </View>
        <Text style={styles.infoText}>
          A confirmation email has been sent to your registered email address.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={styles.buttonText}>View My Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Continue Exploring
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  detailsContainer: {
    backgroundColor: '#F9F9F9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  detailsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  detailsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    gap: 12,
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
  },
  secondaryButtonText: {
    color: '#333',
  },
});

