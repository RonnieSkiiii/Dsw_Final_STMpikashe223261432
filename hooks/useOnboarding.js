import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import app from '@/config/firebase';

const db = getFirestore(app);
const ONBOARDING_KEY = '@has_completed_onboarding';

export function useOnboarding() {
  const { user } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      // First check Firebase user profile (account-based)
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const firebaseOnboardingStatus = userData.hasCompletedOnboarding;
          
          if (firebaseOnboardingStatus !== undefined) {
            setHasCompletedOnboarding(firebaseOnboardingStatus);
            setLoading(false);
            return;
          }
        }
      }
      
      // Fallback to AsyncStorage (device-based) for non-authenticated users
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasCompletedOnboarding(value === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Fallback to AsyncStorage on error
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasCompletedOnboarding(value === 'true');
      } catch (e) {
        setHasCompletedOnboarding(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      // Update Firebase user profile
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          hasCompletedOnboarding: true,
        });
      }
      
      // Also update AsyncStorage
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return { hasCompletedOnboarding, loading, completeOnboarding };
}

