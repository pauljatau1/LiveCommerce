import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import React, { useState, useMemo, useCallback, memo } from 'react';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';

// Predefined bid increment options
const BID_VARIATIONS = [500, 1000, 1500, 2000];

interface BidVariationSelectorProps {
  currentBid: number;
  onSelectBidAmount: (amount: number) => void;
  onCustomBid: (amount: number) => void;
  formatPrice?: (price: number) => string;
  closeSheet: () => void;
}

// Create memoized sub-components for better performance
const Header = memo(({ title, subtitle }: { title: string; subtitle: string }) => (
  <View style={styles.header}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
));

const VariationButton = memo(({ 
  variation, 
  isSelected, 
  formattedPrice, 
  onPress 
}: { 
  variation: number; 
  isSelected: boolean; 
  formattedPrice: string; 
  onPress: () => void 
}) => (
  <TouchableOpacity
    style={[
      styles.variationButton,
      isSelected && styles.selectedVariation
    ]}
    onPress={onPress}
  >
    <Text style={[
      styles.variationText,
      isSelected && styles.selectedVariationText
    ]}>
      {formattedPrice}
    </Text>
  </TouchableOpacity>
));

const Divider = memo(() => <View style={styles.divider} />);

const CustomBidInput = memo(({ 
  customBidAmount, 
  setCustomBidAmount, 
  customBidMode, 
  setCustomBidMode, 
  customBidValidation 
}: { 
  customBidAmount: string;
  setCustomBidAmount: (value: string) => void;
  customBidMode: boolean;
  setCustomBidMode: (value: boolean) => void;
  customBidValidation: { isValid: boolean; message: string } | null;
}) => (
  <View style={styles.customBidContainer}>
    <Text style={styles.sectionTitle}>Or enter custom amount:</Text>
    <View style={[
      styles.customBidInputContainer,
      customBidMode && customBidAmount && !customBidValidation?.isValid && styles.invalidBidInput,
      customBidMode && customBidAmount && customBidValidation?.isValid && styles.validBidInput
    ]}>
      <Text style={styles.currencySymbol}>₦</Text>
      <BottomSheetTextInput
        style={styles.customBidInput}
        value={customBidAmount}
        onChangeText={setCustomBidAmount}
        placeholder="Enter amount"
        placeholderTextColor="#888"
        keyboardType="numeric"
        onFocus={() => setCustomBidMode(true)}
      />
      {customBidMode && customBidAmount && (
        <View style={styles.validationIconContainer}>
          {customBidValidation?.isValid ? (
            <AntDesign name="checkcircle" size={18} color="#16783A" />
          ) : (
            <AntDesign name="exclamationcircle" size={18} color="#FF5733" />
          )}
        </View>
      )}
    </View>

    {customBidMode && customBidAmount && (
      <Text style={[
        styles.bidValidationMessage,
        customBidValidation?.isValid ? styles.validBidText : styles.invalidBidText
      ]}>
        {customBidValidation?.message}
      </Text>
    )}
  </View>
));

const ActionButtons = memo(({ 
  onCancel, 
  onSubmit, 
  isDisabled,
  nextBidText = null
}: { 
  onCancel: () => void; 
  onSubmit: () => void; 
  isDisabled: boolean;
  nextBidText?: string | null;
}) => (
  <View style={styles.summaryContainer}>
    {nextBidText && (
      <Text style={styles.nextBidText}>{nextBidText}</Text>
    )}

    <View style={styles.actionButtons}>
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.submitButton,
          isDisabled ? styles.disabledButton : {}
        ]}
        onPress={onSubmit}
        disabled={isDisabled}
      >
        <Text style={styles.submitButtonText}>Place Bid</Text>
        <MaterialIcons name="arrow-forward-ios" size={16} color="#FFF" />
      </TouchableOpacity>
    </View>
  </View>
));

const BidVariationSelector = ({
  currentBid,
  onSelectBidAmount,
  onCustomBid,
  formatPrice,
  closeSheet
}: BidVariationSelectorProps) => {
  // State is localized and minimized
  const [selectedVariation, setSelectedVariation] = useState<number | null>(BID_VARIATIONS[0]);
  const [customBidAmount, setCustomBidAmount] = useState('');
  const [customBidMode, setCustomBidMode] = useState(false);

  // Memoize the price formatting function to prevent recreation on every render
  const formatPriceDisplay = useCallback((price: number) => {
    if (formatPrice) {
      return formatPrice(price);
    }
    return `₦${price.toLocaleString()}`;
  }, [formatPrice]);

  // Memoize the header subtitle
  const headerSubtitle = useMemo(
    () => `Current bid: ${formatPriceDisplay(currentBid)}`,
    [currentBid, formatPriceDisplay]
  );

  // Memoize the next bid text
  const nextBidText = useMemo(() => {
    if (!customBidMode && selectedVariation !== null) {
      return `Next bid will be: ${formatPriceDisplay(currentBid + selectedVariation)}`;
    }
    return null;
  }, [customBidMode, selectedVariation, currentBid, formatPriceDisplay]);

  // Live validation of custom bid amount - already using useMemo which is good
  const customBidValidation = useMemo(() => {
    if (!customBidAmount) return null;

    const numericAmount = Number(customBidAmount);

    if (isNaN(numericAmount)) {
      return {
        isValid: false,
        message: 'Please enter a valid number'
      };
    }

    if (numericAmount <= 0) {
      return {
        isValid: false,
        message: 'Bid amount must be greater than zero'
      };
    }

    if (numericAmount <= currentBid) {
      return {
        isValid: false,
        message: `Bid must exceed ${formatPriceDisplay(currentBid)}`
      };
    }

    return {
      isValid: true,
      message: `Valid bid: ${formatPriceDisplay(numericAmount)}`
    };
  }, [customBidAmount, currentBid, formatPriceDisplay]);

  // Memoize the submit button disabled state
  const isSubmitDisabled = useMemo(() => 
    (customBidMode && (!customBidAmount || !customBidValidation?.isValid)) ||
    (!customBidMode && !selectedVariation),
    [customBidMode, customBidAmount, customBidValidation, selectedVariation]
  );

  // Handle selection of a bid variation with useCallback
  const handleSelectVariation = useCallback((variation: number) => {
    setSelectedVariation(variation);
    setCustomBidMode(false);
  }, []);

  // Memoize bid variation buttons for better performance
  const variationButtons = useMemo(() => 
    BID_VARIATIONS.map((variation) => {
      const isSelected = selectedVariation === variation && !customBidMode;
      return (
        <VariationButton
          key={variation}
          variation={variation}
          isSelected={isSelected}
          formattedPrice={formatPriceDisplay(variation)}
          onPress={() => handleSelectVariation(variation)}
        />
      );
    }),
    [selectedVariation, customBidMode, formatPriceDisplay, handleSelectVariation]
  );

  // Handle bid submission with useCallback
  const handleSubmitBid = useCallback(() => {
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
  }, [
    customBidMode, 
    customBidAmount, 
    currentBid, 
    selectedVariation, 
    onCustomBid, 
    onSelectBidAmount, 
    closeSheet, 
    formatPriceDisplay
  ]);

  return (
    <BottomSheetView style={styles.container}>
      <Header title="Place your bid" subtitle={headerSubtitle} />

      {/* Standard Bid Variations */}
      <View style={styles.variationsContainer}>
        <Text style={styles.sectionTitle}>Select increment amount:</Text>
        <View style={styles.variationsGrid}>
          {variationButtons}
        </View>
      </View>

      <Divider />

      {/* Custom Bid Input */}
      <CustomBidInput
        customBidAmount={customBidAmount}
        setCustomBidAmount={setCustomBidAmount}
        customBidMode={customBidMode}
        setCustomBidMode={setCustomBidMode}
        customBidValidation={customBidValidation}
      />

      {/* Action Buttons */}
      <ActionButtons
        onCancel={closeSheet}
        onSubmit={handleSubmitBid}
        isDisabled={isSubmitDisabled}
        nextBidText={nextBidText}
      />
    </BottomSheetView>
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
  invalidBidInput: {
    borderColor: '#FF5733',
    borderWidth: 1,
  },
  validBidInput: {
    borderColor: '#16783A',
    borderWidth: 1,
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
  validationIconContainer: {
    paddingHorizontal: 8,
  },
  bidValidationMessage: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  validBidText: {
    color: '#16783A',
  },
  invalidBidText: {
    color: '#FF5733',
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

// Export the component with React.memo for additional performance optimization
export default memo(BidVariationSelector); 