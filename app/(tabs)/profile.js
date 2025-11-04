import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '@/config/firebase';

const db = getFirestore(app);
const storage = getStorage(app);

export default function ProfileScreen() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [profileImageUri, setProfileImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload profile pictures!');
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserProfile();
      fetchBookings();
    } else if (!authLoading && !user) {
      setUserProfile(null);
      setBookings([]);
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile(data);
        setEditName(data.name || user.displayName || '');
        setProfileImageUri(data.profileImageUrl || null);
      } else {
        setUserProfile({
          name: user.displayName || 'User',
          email: user.email,
        });
        setEditName(user.displayName || 'User');
        setProfileImageUri(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!user) return; // Secure check
    
    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(bookingsQuery);
      const bookingsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      bookingsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const imageUri = result.assets[0].uri;
        
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const imageRef = ref(storage, `profile-pictures/${user.uid}/${Date.now()}.jpg`);
        await uploadBytes(imageRef, blob);
        const downloadURL = await getDownloadURL(imageRef);
        
        setProfileImageUri(downloadURL);
        setUploadingImage(false);
        Alert.alert('Success', 'Profile picture updated! Click Save to apply changes.');
      }
    } catch (error) {
      console.error('Error picking/uploading image:', error);
      setUploadingImage(false);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to update your profile');
      return;
    }
    
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setUpdating(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        name: editName,
      };
      
      if (profileImageUri && profileImageUri !== userProfile?.profileImageUrl) {
        updateData.profileImageUrl = profileImageUri;
      }
      
      await updateDoc(userRef, updateData);
      const updatedProfile = {
        ...userProfile,
        name: editName,
      };
      if (profileImageUri && profileImageUri !== userProfile?.profileImageUrl) {
        updatedProfile.profileImageUrl = profileImageUri;
      }
      setUserProfile(updatedProfile);
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            setUserProfile(null);
            setBookings([]);
            setProfileImageUri(null);
            await logout();
            router.replace('/(auth)/signin');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Please sign in to view your profile</Text>
      </View>
    );
  }

  const displayImageUri = userProfile?.profileImageUrl || profileImageUri || null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={() => {
              setProfileImageUri(userProfile?.profileImageUrl || null);
              setShowEditModal(true);
            }}
            style={styles.profileImageContainer}
          >
            <Image
              source={
                displayImageUri
                  ? { uri: displayImageUri }
                  : require('@/Materials/09-Account Page/Ellipse 33.png')
              }
              style={styles.profileImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <View style={styles.profileImageOverlay}>
              <Text style={styles.profileImageEditText}>Edit</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userProfile?.name || user?.displayName || 'User'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setProfileImageUri(userProfile?.profileImageUrl || null);
            setShowEditModal(true);
          }}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Bookings ({bookings.length})</Text>
        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No bookings yet</Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text style={styles.exploreButtonText}>Explore Hotels</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingHotelName}>{booking.hotelName}</Text>
                <View style={styles.bookingStatus}>
                  <Text style={styles.bookingStatusText}>{booking.status}</Text>
                </View>
              </View>
              <View style={styles.bookingDetails}>
                <View style={styles.bookingDetailRow}>
                  <Text style={styles.bookingDetailLabel}>Check-in:</Text>
                  <Text style={styles.bookingDetailValue}>
                    {formatDate(booking.checkIn)}
                  </Text>
                </View>
                <View style={styles.bookingDetailRow}>
                  <Text style={styles.bookingDetailLabel}>Check-out:</Text>
                  <Text style={styles.bookingDetailValue}>
                    {formatDate(booking.checkOut)}
                  </Text>
                </View>
                <View style={styles.bookingDetailRow}>
                  <Text style={styles.bookingDetailLabel}>Rooms:</Text>
                  <Text style={styles.bookingDetailValue}>{booking.rooms}</Text>
                </View>
                <View style={styles.bookingDetailRow}>
                  <Text style={styles.bookingDetailLabel}>Guests:</Text>
                  <Text style={styles.bookingDetailValue}>{booking.guests}</Text>
                </View>
              </View>
              <View style={styles.bookingTotal}>
                <Text style={styles.bookingTotalLabel}>Total:</Text>
                <Text style={styles.bookingTotalValue}>R{booking.totalPrice}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <View style={styles.profileImageSection}>
              <Text style={styles.inputLabel}>Profile Picture</Text>
              <View style={styles.profileImagePickerContainer}>
                <TouchableOpacity
                  style={styles.profileImagePicker}
                  onPress={pickImage}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="#0a7ea4" />
                  ) : (
                    <>
                      <Image
                        source={
                          profileImageUri
                            ? { uri: profileImageUri }
                            : displayImageUri
                            ? { uri: displayImageUri }
                            : require('@/Materials/09-Account Page/Ellipse 33.png')
                        }
                        style={styles.profileImagePreview}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                      <View style={styles.profileImagePickerOverlay}>
                        <Text style={styles.profileImagePickerText}>
                          {profileImageUri || displayImageUri ? 'Change' : 'Select'} Photo
                        </Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.email || ''}
              editable={false}
            />
            <Text style={styles.disabledNote}>Email cannot be changed</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setProfileImageUri(userProfile?.profileImageUrl || null);
                  setShowEditModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateProfile}
                disabled={updating}
              >
                <Text style={styles.saveButtonText}>
                  {updating ? 'Saving...' : 'Save'}
                </Text>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#F9F9F9',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  profileImageEditText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  profileImageSection: {
    marginBottom: 20,
  },
  profileImagePickerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  profileImagePreview: {
    width: '100%',
    height: '100%',
  },
  profileImagePickerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  profileImagePickerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
  exploreButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingHotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  bookingStatus: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookingStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  bookingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookingDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  bookingDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  bookingTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bookingTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bookingTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  logoutButton: {
    backgroundColor: '#FF5252',
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  disabledInput: {
    backgroundColor: '#E0E0E0',
    color: '#999',
  },
  disabledNote: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
    fontStyle: 'italic',
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
  saveButton: {
    backgroundColor: '#0a7ea4',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

