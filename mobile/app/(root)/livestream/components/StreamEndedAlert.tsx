import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface StreamEndedAlertProps {
  onLeave: (backButton: boolean) => void;
  isLeavingStream: boolean;
}

const StreamEndedAlert: React.FC<StreamEndedAlertProps> = ({ onLeave, isLeavingStream }) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.alertContainer}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="videocam-off" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Stream Has Ended</Text>
        <Text style={styles.message}>
          This live stream has ended. Thank you for joining!
        </Text>
        <TouchableOpacity
          style={styles.leaveButton}
          onPress={() => {
            onLeave(true);
          }}
          disabled={isLeavingStream}
        >
          <Text style={styles.leaveButtonText}>Go Home</Text>
          {isLeavingStream && (
            <ActivityIndicator
              size={12}
              color="white"
              style={{ marginLeft: 5 }}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  alertContainer: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  leaveButton: {
    backgroundColor: '#16783A',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default StreamEndedAlert; 