import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

interface BidErrorMessageProps {
  errorMessage: string;
  closeSheet: () => void;
}

const BidErrorMessage = ({ errorMessage, closeSheet }: BidErrorMessageProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
      </View>
      
      <Text style={styles.title}>Bid Error</Text>
      
      <Text style={styles.message}>{errorMessage}</Text>
      
      <TouchableOpacity style={styles.button} onPress={closeSheet}>
        <Text style={styles.buttonText}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
};

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

export default BidErrorMessage; 