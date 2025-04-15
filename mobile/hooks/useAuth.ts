import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '@/store';
import { getToken, getUser } from '@/store/features/auth/utils';

export function useAuth() {
  const dispatch = useDispatch();
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialScreen, setInitialScreen] = useState<string | null>(null);
  
  // Get user from Redux store
  const authUser = useSelector((state: RootState) => state.authState.user);
  const authStatus = useSelector((state: RootState) => state.authState.status);

  // Check if user is first time visitor
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      try {
        const isFirstTime = await AsyncStorage.getItem('isFirstTime');
        setIsFirstTimeUser(isFirstTime === 'true' || isFirstTime === null);
        setLoading(false);
      } catch (error) {
        console.error('Error checking first time user:', error);
        setIsFirstTimeUser(true); // Default to true if error
        setLoading(false);
      }
    };

    checkFirstTimeUser();
  }, []);

  return {
    isFirstTimeUser,
    loading,
    user: authUser,
    isAuthenticated: authStatus === 'signIn',
    setInitialScreen,
    initialScreen
  };
} 