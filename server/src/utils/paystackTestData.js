// Test data for Paystack integration
exports.TEST_DATA = {
  cards: {
    simple: {
      number: '4084084084084081',
      expiry: '02/26',
      cvv: '408',
      type: 'No validation (reusable)'
    },
    withPin: {
      number: '5078507850785078',
      expiry: '02/26',
      cvv: '081',
      pin: '1111',
      type: 'PIN validation'
    },
    withOtp: {
      number: '5060666666666666',
      expiry: '02/26',
      cvv: '123',
      pin: '1234',
      otp: '123456',
      type: 'PIN + OTP validation'
    }
  },
  bankAccounts: {
    zenith: {
      accountNumber: '0000000000',
      bankCode: '057',
      birthday: '2006-02-20',
      otp: '123456'
    },
    firstBank: {
      accountNumber: '0000000000',
      bankCode: '011'
    },
    kuda: {
      phone: '+2348100000000',
      bankCode: '50211',
      token: '123456'
    }
  },
  testAccount: {
    demoBank: {
      accountNumber: '1230001644',
      pin: '0000'
    }
  }
};

exports.isTestMode = () => process.env.NODE_ENV === 'development';

exports.getTestBankAccount = (bankName) => {
  const testAccounts = {
    'zenith bank': exports.TEST_DATA.bankAccounts.zenith,
    'first bank': exports.TEST_DATA.bankAccounts.firstBank,
    'kuda bank': exports.TEST_DATA.bankAccounts.kuda
  };
  
  return testAccounts[bankName.toLowerCase()];
}; 