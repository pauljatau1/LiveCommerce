exports.validateAddress = (address) => {
  const requiredFields = ['country', 'state', 'city', 'address1', 'zipCode'];
  
  for (const field of requiredFields) {
    if (!address[field]) {
      return false;
    }
  }

  // Validate country code format
  if (!/^[A-Z]{2}$/.test(address.country)) {
    return false;
  }

  // Validate zip code format (basic)
  if (!/^[0-9A-Z-\s]{3,10}$/.test(address.zipCode)) {
    return false;
  }

  return true;
}; 