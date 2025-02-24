const axios = require('axios');
const NodeCache = require('node-cache');

const bankCache = new NodeCache({ stdTTL: 86400 }); // Cache for 24 hours

const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to validate key before making requests
paystack.interceptors.request.use((config) => {
  if (!process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY === 'sk_test_REDACTED') {
    throw new Error('Invalid or missing Paystack secret key');
  }
  return config;
});

exports.getBankList = async () => {
  try {
    // Check cache first
    const cachedBanks = bankCache.get('banks');
    if (cachedBanks) {
      return cachedBanks;
    }

    // Fetch from Paystack if not in cache
    const response = await paystack.get('/bank');
    const banks = response.data.data.map(bank => ({
      code: bank.code,
      name: bank.name,
      longcode: bank.longcode,
      active: bank.active
    }));

    // Store in cache
    bankCache.set('banks', banks);

    return banks;
  } catch (error) {
    console.error('Error fetching bank list:', error);
    if (error.message === 'Invalid or missing Paystack secret key') {
      throw new Error('Paystack configuration error: Invalid API key');
    }
    throw new Error('Failed to fetch bank list');
  }
};

exports.verifyBankAccount = async (accountNumber, bankCode) => {
  try {
    const response = await paystack.get(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    );
    return response.data.data;
  } catch (error) {
    if (error.message === 'Invalid or missing Paystack secret key') {
      throw new Error('Paystack configuration error: Invalid API key');
    }
    throw new Error(error.response?.data?.message || 'Could not verify account');
  }
}; 