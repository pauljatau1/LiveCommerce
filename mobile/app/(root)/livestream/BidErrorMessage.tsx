import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { memo, useCallback, useMemo } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface BidErrorMessageProps {
  errorMessage: string;
  closeSheet: () => void;
}

// Memoized icon component to prevent re-rendering
const ErrorIcon = memo(() => (
  <View style={styles.iconContainer}>
    <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
  </View>
));

// Memoized button component for address redirect
const AddressButton = memo(({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>Add Shipping Address</Text>
  </TouchableOpacity>
));

// Memoized dismiss button
const DismissButton = memo(({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>Dismiss</Text>
  </TouchableOpacity>
));

const BidErrorMessage = memo(({ errorMessage, closeSheet }: BidErrorMessageProps) => {
  const router = useRouter();

  // Memoize the navigation function to avoid recreating on each render
  const navigateToAddress = useCallback(() => {
    router.push("/addresses/addAddress");
    closeSheet();
  }, [router, closeSheet]);

  // Memoize the button component based on the error message
  const ActionButton = useMemo(() => {
    if (errorMessage === "Please add a shipping address to your profile before bidding") {
      return <AddressButton onPress={navigateToAddress} />;
    }
    return <DismissButton onPress={closeSheet} />;
  }, [errorMessage, closeSheet, navigateToAddress]);

  // Memoize the content to prevent unnecessary re-renders
  const content = useMemo(() => (
    <>
      <ErrorIcon />
      <Text style={styles.title}>Bid Error</Text>
      <Text style={styles.message}>{errorMessage}</Text>
      {ActionButton}
    </>
  ), [errorMessage, ActionButton]);

  return (
    <View style={styles.container}>
      {content}
    </View>
  );
});

// Styles are static and don't need to be recreated on each render
const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#121212',
    borderRadius: 12,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#DDDDDD',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#16783A',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// DisplayName helps with debugging
BidErrorMessage.displayName = 'BidErrorMessage';

export default BidErrorMessage; 