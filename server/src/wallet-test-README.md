# Wallet Top-Up Test Component

This is a test component for the Auqli wallet top-up system using Paystack.

## Setup Instructions

1. Install the required dependencies:

```bash
npm install react-paystack
```

2. Import and use the TestTopup component in your application:

```jsx
import TestTopup from './client';

function App() {
  return (
    <div>
      <TestTopup />
    </div>
  );
}
```

## Configuration

Before using the component, make sure to update the following values in the `client.jsx` file:

1. **Auth Token**: Replace the sample auth token with a valid token for testing:

```jsx
const authToken = 'YOUR_VALID_AUTH_TOKEN';
```

2. **Buyer ID**: Replace the sample buyer ID with a valid buyer ID:

```jsx
const [buyerId, setBuyerId] = useState('VALID_BUYER_ID');
```

3. **Paystack Public Key**: Replace with your Paystack test public key:

```jsx
const paystackPublicKey = 'YOUR_PAYSTACK_TEST_PUBLIC_KEY';
```

## How It Works

The component provides two methods for topping up a wallet:

1. **Paystack Payment**: Uses the Paystack payment modal to process payments.
2. **Direct Top-Up**: For admin/testing purposes only, bypasses Paystack.

### Paystack Payment Flow

1. Enter the amount you want to add to the wallet
2. Click "Top Up with Paystack"
3. Complete the payment in the Paystack modal
4. The component will automatically verify the payment
5. The wallet balance will be updated if the payment is successful

### Testing Features

- View current wallet balance
- View recent transactions
- Refresh data to see updated balance and transactions
- Test both Paystack and direct top-up methods

## Backend Integration

This component works with the following backend endpoints:

- `GET /api/buyer/wallet/balance` - Get the current wallet balance
- `GET /api/buyer/wallet/transactions` - Get recent transactions
- `GET /api/buyer/wallet/topup/verify?reference={reference}` - Verify a payment
- `POST /api/buyer/wallet/topup` - Direct top-up (admin only)

## Important Notes

1. The Paystack payment is initiated from the frontend, with the payment reference and buyer ID included in the metadata.
2. The backend verifies the payment and updates the wallet balance.
3. The webhook handles payments even if the user closes their browser after payment.
4. For testing, you can use Paystack's test cards available at: https://paystack.com/docs/payments/test-payments/

## Troubleshooting

If you encounter any issues:

1. Check the browser console for errors
2. Verify that the auth token is valid
3. Ensure the buyer ID exists in the database
4. Confirm that the Paystack public key is correct
5. Make sure the backend endpoints are properly configured 