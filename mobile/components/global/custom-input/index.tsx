import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

const PhoneNumberInput = ({ onChange, value }: any) => {
  const [countryCode] = useState('+234'); // Default country code (e.g., US)
  // const [, setPhoneNumber] = useState(''); // Actual number typed by the user
  const [isFocused, setIsFocused] = useState(false); // Track focus state

  return (
    <View
      style={[
        styles.container,
        { borderColor: isFocused ? '#C6C6C6' : '#5E5D6F' },
      ]}
    >
      <View style={styles.countryCodeContainer}>
        <Text style={styles.countryCodeText} className="">
          {countryCode}
        </Text>
      </View>

      <TextInput
        style={styles.phoneNumberInput}
        value={value}
        onChangeText={onChange}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
        outlineColor="#5E5D6F"
        placeholderTextColor="#5E5D6F"
        activeOutlineColor={'#C6C6C6'}
        onFocus={() => setIsFocused(true)} // Set focus state to true
        onBlur={() => setIsFocused(false)} // Set focus state to false
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6C6C6',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 6,
  },
  countryCodeContainer: {
    backgroundColor: '#F1F8FB', // Gray background for country code
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 14,
    color: '#888787',
    backgroundColor: '#F1F8FB',
    paddingHorizontal: 4,
    paddingVertical: 6,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  phoneNumberInput: {
    flex: 1,
    backgroundColor: '#000',
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
});

export default PhoneNumberInput;
