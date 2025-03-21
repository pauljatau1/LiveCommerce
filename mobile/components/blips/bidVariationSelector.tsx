import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// Predefined bid increment options
const BID_VARIATIONS = [500, 1000, 1500, 2000];

interface BidVariationSelectorProps {
  currentBid: number;
  onSelectBidAmount: (amount: number) => void;
  onCustomBid: (amount: number) => void;
  formatPrice?: (price: number) => string;
  closeSheet: () => void;
}

const BidVariationSelector = ({
  currentBid,
  onSelectBidAmount,
  onCustomBid,
  formatPrice,
  closeSheet
}: BidVariationSelectorProps) => {
  const [selectedVariation, setSelectedVariation] = useState<number | null>(BID_VARIATIONS[0]);
  const [customBidAmount, setCustomBidAmount] = useState('');
  const [customBidMode, setCustomBidMode] = useState(false);

  // Format prices consistently
  const formatPriceDisplay = (price: number) => {
    if (formatPrice) {
      return formatPrice(price);
    }
    return `₦${price.toLocaleString()}`;
  };

  // Handle selection of a bid variation
  const handleSelectVariation = (variation: number) => {
    setSelectedVariation(variation);
    setCustomBidMode(false);
  };

  // Toggle to custom bid input mode
  const toggleCustomBidMode = () => {
    setCustomBidMode(!customBidMode);
    if (!customBidMode) {
      setSelectedVariation(null);
    }
  };

  // Handle bid submission
  const handleSubmitBid = () => {
    if (customBidMode) {
      // Process custom bid amount
      const customAmount = Number(customBidAmount);
      
      // Validate custom bid amount
      if (isNaN(customAmount) || customAmount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid bid amount');
        return;
      }
      
      if (customAmount <= currentBid) {
        Alert.alert('Invalid Bid', `Your bid must be higher than the current bid of ${formatPriceDisplay(currentBid)}`);
        return;
      }
      
      // Submit custom bid and close sheet
      onCustomBid(customAmount);
      closeSheet();
    } else if (selectedVariation !== null) {
      // Submit selected variation amount
      const nextBidAmount = currentBid + selectedVariation;
      onSelectBidAmount(nextBidAmount);
      closeSheet();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Place your bid</Text>
        <Text style={styles.subtitle}>Current bid: {formatPriceDisplay(currentBid)}</Text>
      </View>
      
      {/* Standard Bid Variations */}
      <View style={styles.variationsContainer}>
        <Text style={styles.sectionTitle}>Select increment amount:</Text>
        <View style={styles.variationsGrid}>
          {BID_VARIATIONS.map((variation) => (
            <TouchableOpacity
              key={variation}
              style={[
                styles.variationButton,
                selectedVariation === variation && !customBidMode && styles.selectedVariation
              ]}
              onPress={() => handleSelectVariation(variation)}
            >
              <Text style={[
                styles.variationText, 
                selectedVariation === variation && !customBidMode && styles.selectedVariationText
              ]}>
                {formatPriceDisplay(variation)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Divider */}
      <View style={styles.divider} />

      {/* Custom Bid Option */}
      <View style={styles.customBidContainer}>
        <Text style={styles.sectionTitle}>Or enter custom amount:</Text>
        <View style={styles.customBidInputContainer}>
          <Text style={styles.currencySymbol}>₦</Text>
          <TextInput
            style={styles.customBidInput}
            value={customBidAmount}
            onChangeText={setCustomBidAmount}
            placeholder="Enter amount"
            placeholderTextColor="#888"
            keyboardType="numeric"
            onFocus={() => setCustomBidMode(true)}
          />
        </View>
        {customBidMode && customBidAmount && (
          <Text style={styles.bidPreview}>
            Your bid: {formatPriceDisplay(Number(customBidAmount))}
          </Text>
        )}
      </View>

      {/* Summary and Action Buttons */}
      <View style={styles.summaryContainer}>
        {!customBidMode && selectedVariation !== null && (
          <Text style={styles.nextBidText}>
            Next bid will be: {formatPriceDisplay(currentBid + selectedVariation)}
          </Text>
        )}
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={closeSheet}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!selectedVariation && !customBidAmount) && styles.disabledButton
            ]} 
            onPress={handleSubmitBid}
            disabled={!selectedVariation && !customBidAmount}
          >
            <Text style={styles.submitButtonText}>Place Bid</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#121212',
    borderRadius: 12,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#16783A',
    fontWeight: '600',
  },
  variationsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#CCC',
    marginBottom: 12,
  },
  variationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  variationButton: {
    width: '48%',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedVariation: {
    backgroundColor: 'rgba(22, 120, 58, 0.2)',
    borderColor: '#16783A',
  },
  variationText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedVariationText: {
    color: '#16783A',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 20,
  },
  customBidContainer: {
    marginBottom: 24,
  },
  customBidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currencySymbol: {
    color: '#16783A',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  customBidInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#FFF',
  },
  bidPreview: {
    marginTop: 8,
    color: '#16783A',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    marginTop: 10,
  },
  nextBidText: {
    fontSize: 16,
    color: '#16783A',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 16,
    backgroundColor: '#16783A',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: 'rgba(22, 120, 58, 0.5)',
  }
});

export default BidVariationSelector; 