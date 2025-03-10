import React, { useState, useEffect } from 'react'
import { PaystackButton } from 'react-paystack'

function TestTopup() {
  // State variables for wallet
  const [amount, setAmount] = useState(1000);
  const [buyerId, setBuyerId] = useState('676e96b120e1a98b76e28a3e');
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [reference, setReference] = useState('67cdd60c9cbb0b29500c3d1e');
  
  // State variables for order payment
  const [activeTab, setActiveTab] = useState('wallet'); // 'wallet' or 'order'
  const [orderId, setOrderId] = useState('67cdd60c9cbb0b29500c3d1e'); // Hardcoded order ID for testing
  const [orderAmount, setOrderAmount] = useState(2000);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [useHardcodedOrder, setUseHardcodedOrder] = useState(true); // Flag to use hardcoded order ID

  // Sample auth token - replace with your actual test token
  const authToken = 'JWT_REDACTED';
  
  // Paystack public key - replace with your test key
  const paystackPublicKey = 'pk_test_4362c6ccfe78d91e6216122d1b36c848fa051362';

  // Generate a new reference when component mounts
  useEffect(() => {
    generateReference();
    fetchWalletBalance();
    fetchTransactions();
    fetchOrders();
    
    // If using hardcoded order ID, fetch its details on mount
    if (useHardcodedOrder && orderId) {
      fetchOrderDetails(orderId);
    }
  }, []);

  // Generate a unique reference
  const generateReference = () => {
    const prefix = activeTab === 'wallet' ? 'WALLET' : 'ORDER';
    const newReference = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setReference(newReference);
    return newReference;
  };

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/buyer/wallet/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setWalletBalance(data.balance);
      } else {
        showMessage(data.message || 'Failed to fetch wallet balance', 'error');
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      showMessage('Error fetching wallet balance', 'error');
    }
  };

  // Fetch transaction history
  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/buyer/wallet/transactions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTransactions(data.transactions || []);
      } else {
        console.error('Failed to fetch transactions:', data.message);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };
  
  // Fetch buyer's orders
  const fetchOrders = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/order/buyer/${buyerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data || []);
      } else {
        console.error('Failed to fetch orders:', data.message);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };
  
  // Fetch order details
  const fetchOrderDetails = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/api/order/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSelectedOrder(data);
        setOrderAmount(data.totalAmount);
        return data;
      } else {
        showMessage(data.message || 'Failed to fetch order details', 'error');
        return null;
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      showMessage('Error fetching order details', 'error');
      return null;
    }
  };

  // Verify wallet payment
  const verifyWalletPayment = async (reference) => {
    try {
      setLoading(true);
      showMessage('Verifying payment...', 'info');
      
      console.log('Verifying wallet payment with reference:', reference);
      
      const response = await fetch(`http://localhost:8000/api/buyer/wallet/topup/verify?reference=${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Verification response:', data);
      
      if (response.ok) {
        showMessage(`Your wallet has been topped up with ₦${data.transaction.amount}. New balance: ₦${data.newBalance}`, 'success');
        setWalletBalance(data.newBalance);
        fetchTransactions();
      } else {
        // Enhanced error handling
        let errorMessage = data.message || 'Payment verification failed';
        
        // If there's detailed error information, display it
        if (data.error) {
          console.error('Verification error details:', data.error);
          
          // Check if it's a Paystack verification that succeeded but our backend failed
          if (data.error.status === true && data.error.message === "Verification successful") {
            errorMessage = 'Payment was successful with Paystack, but our system failed to process it. Please contact support with this reference: ' + reference;
          }
        }
        
        showMessage(errorMessage, 'error');
        
        // If verification failed but Paystack succeeded, try fallback verification
        if (data.error && data.error.status === true && data.error.data && data.error.data.status === 'success') {
          console.log('Attempting fallback verification...');
          tryFallbackVerification(reference, data.error.data);
        }
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      showMessage('Error verifying payment: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Verify order payment
  const verifyOrderPayment = async (reference) => {
    try {
      setLoading(true);
      showMessage('Verifying order payment...', 'info');
      
      console.log('Verifying order payment with reference:', reference);
      
      // First, mark the order as paid
      const response = await fetch(`http://localhost:8000/api/order/${orderId}/mark-as-paid`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentReference: reference,
          // Don't send transactionId, let the server get it from Paystack
        })
      });
      
      const data = await response.json();
      console.log('Order payment verification response:', data);
      
      if (response.ok) {
        showMessage(`Order payment successful! Order #${data.order.order_id} has been marked as paid.`, 'success');
        fetchOrders();
        if (orderId) {
          fetchOrderDetails(orderId);
        }
      } else {
        let errorMessage = data.message || 'Order payment verification failed';
        
        if (data.error) {
          console.error('Order verification error details:', data.error);
          
          // If there's a specific error about constant variable assignment
          if (typeof data.error === 'string' && 
              (data.error.includes('Assignment to constant variable') || 
               data.error.includes('paystack is not defined'))) {
            errorMessage = 'Server error: ' + data.error + '. Trying alternative method...';
            
            // Try a direct approach without verification
            tryDirectOrderPayment(reference);
          }
        }
        
        showMessage(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error verifying order payment:', error);
      showMessage('Error verifying order payment: ' + (error.message || 'Unknown error'), 'error');
      
      // Try direct method as fallback for any error
      tryDirectOrderPayment(reference);
    } finally {
      setLoading(false);
    }
  };

  // Try direct order payment without verification
  const tryDirectOrderPayment = async (reference) => {
    try {
      showMessage('Attempting alternative payment method...', 'info');
      
      // Get the order details first
      const orderResponse = await fetch(`http://localhost:8000/api/order/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const orderData = await orderResponse.json();
      
      if (!orderResponse.ok) {
        showMessage('Failed to get order details for direct payment', 'error');
        return;
      }
      
      // Update the order directly - using a simpler approach
      const updateData = {
        paid: true,
        paymentInfo: {
          ...orderData.paymentInfo,
          status: 'paid',
          paymentReference: reference,
          paidAt: new Date().toISOString()
        }
      };
      
      console.log('Attempting direct update with data:', updateData);
      
      const response = await fetch(`http://localhost:8000/api/order/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      const data = await response.json();
      console.log('Direct update response:', data);
      
      if (response.ok) {
        showMessage(`Direct payment successful! Order has been marked as paid.`, 'success');
        fetchOrders();
        if (orderId) {
          fetchOrderDetails(orderId);
        }
      } else {
        // Try an even simpler approach as last resort
        trySimplestOrderUpdate(reference);
      }
    } catch (error) {
      console.error('Error in direct payment:', error);
      showMessage('Direct payment failed: ' + (error.message || 'Unknown error'), 'error');
      // Try simplest approach as last resort
      trySimplestOrderUpdate(reference);
    }
  };

  // Simplest possible order update as last resort
  const trySimplestOrderUpdate = async (reference) => {
    try {
      showMessage('Attempting final fallback method...', 'info');
      
      // Create a simple custom endpoint request
      const response = await fetch(`http://localhost:8000/api/order/simple-mark-paid/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reference: reference
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage(`Fallback payment successful! Order has been marked as paid.`, 'success');
        fetchOrders();
        if (orderId) {
          fetchOrderDetails(orderId);
        }
      } else {
        showMessage('All payment methods failed. Please contact support with reference: ' + reference, 'error');
      }
    } catch (error) {
      console.error('Error in simplest update:', error);
      showMessage('All payment methods failed. Please contact support with reference: ' + reference, 'error');
    }
  };

  // Fallback verification method for wallet
  const tryFallbackVerification = async (reference, paystackData) => {
    try {
      showMessage('Attempting alternative verification method...', 'info');
      
      // Try the direct top-up method as a fallback
      const response = await fetch('http://localhost:8000/api/buyer/wallet/topup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: paystackData.amount / 100, // Convert from kobo to naira
          description: `Wallet top up via Paystack (Reference: ${reference})`,
          paymentReference: reference,
          bypassPaystack: true
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage(`Fallback successful! Your wallet has been topped up with ₦${data.transaction.amount}. New balance: ₦${data.newBalance}`, 'success');
        setWalletBalance(data.newBalance);
        fetchTransactions();
      } else {
        showMessage('Fallback verification also failed. Please contact support with reference: ' + reference, 'error');
      }
    } catch (error) {
      console.error('Error in fallback verification:', error);
      showMessage('Fallback verification failed: ' + (error.message || 'Unknown error'), 'error');
    }
  };

  // Direct top-up (admin/test only)
  const directTopUp = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:8000/api/buyer/wallet/topup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Number(amount),
          description: 'Direct wallet top up (test)',
          bypassPaystack: true
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage(`Your wallet has been topped up with ₦${data.transaction.amount}. New balance: ₦${data.newBalance}`, 'success');
        setWalletBalance(data.newBalance);
        fetchTransactions();
      } else {
        showMessage(data.message || 'Failed to top up wallet', 'error');
      }
    } catch (error) {
      console.error('Error topping up wallet:', error);
      showMessage('Error topping up wallet', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show message helper
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    
    // Clear message after 5 seconds
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // Handle order selection
  const handleOrderSelect = async (e) => {
    const id = e.target.value;
    setOrderId(id);
    
    if (id) {
      await fetchOrderDetails(id);
    } else {
      setSelectedOrder(null);
    }
    
    // When selecting an order from dropdown, turn off hardcoded mode
    setUseHardcodedOrder(false);
  };

  // Paystack config for wallet top-up
  const getPaystackConfig = () => {
    // Generate a new reference when needed
    if (!reference) {
      generateReference();
    }
    
    const baseConfig = {
      reference,
      email: "boluaj16@gmail.com", // This would normally come from the user's profile
      publicKey: paystackPublicKey,
    };
    
    if (activeTab === 'wallet') {
      return {
        ...baseConfig,
        amount: amount * 100, // Paystack amount is in kobo
        metadata: {
          buyerId: buyerId,
          transactionType: 'wallet_topup',
          description: 'Wallet top up test',
          custom_fields: [
            {
              display_name: "Buyer ID",
              variable_name: "buyer_id",
              value: buyerId
            },
            {
              display_name: "Transaction Type",
              variable_name: "transaction_type",
              value: "wallet_topup"
            }
          ]
        },
        onSuccess: (response) => {
          // Payment was successful
          verifyWalletPayment(response.reference);
          // Generate a new reference for next payment
          generateReference();
        },
        onClose: () => {
          // Handle when customer closes payment modal
          showMessage('Payment window closed', 'info');
        }
      };
    } else {
      return {
        ...baseConfig,
        amount: orderAmount * 100, // Paystack amount is in kobo
        metadata: {
          orderId: orderId,
          buyerId: buyerId,
          transactionType: 'order_payment',
          description: 'Order payment test',
          custom_fields: [
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: orderId
            },
            {
              display_name: "Buyer ID",
              variable_name: "buyer_id",
              value: buyerId
            },
            {
              display_name: "Transaction Type",
              variable_name: "transaction_type",
              value: "order_payment"
            }
          ]
        },
        onSuccess: (response) => {
          // Payment was successful
          verifyOrderPayment(response.reference);
          // Generate a new reference for next payment
          generateReference();
        },
        onClose: () => {
          // Handle when customer closes payment modal
          showMessage('Payment window closed', 'info');
        }
      };
    }
  };

  // Switch tabs
  const switchTab = (tab) => {
    setActiveTab(tab);
    setMessage('');
    generateReference();
    
    // If switching to order tab and using hardcoded order ID, fetch its details
    if (tab === 'order' && useHardcodedOrder && orderId) {
      fetchOrderDetails(orderId);
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100'>
      {/* Tab Navigation */}
      <div className='w-full max-w-md mb-4 overflow-hidden bg-white rounded-lg shadow-md'>
        <div className='flex'>
          <button 
            className={`flex-1 py-3 font-medium ${activeTab === 'wallet' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => switchTab('wallet')}
          >
            Wallet Top-Up
          </button>
          <button 
            className={`flex-1 py-3 font-medium ${activeTab === 'order' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => switchTab('order')}
          >
            Order Payment
          </button>
        </div>
      </div>
      
      <div className='w-full max-w-md p-6 bg-white rounded-lg shadow-md'>
        <h1 className='mb-6 text-2xl font-bold text-center'>
          {activeTab === 'wallet' ? 'Wallet Top-Up Test' : 'Order Payment Test'}
        </h1>
        
        {/* Wallet Balance (shown for both tabs) */}
        <div className='p-4 mb-6 text-center bg-blue-50 rounded-lg'>
          <h2 className='text-sm font-semibold text-blue-600'>Current Wallet Balance</h2>
          <p className='text-3xl font-bold text-blue-700'>₦{walletBalance?.toLocaleString()}</p>
        </div>
        
        {/* Message Display */}
        {message && (
          <div className={`p-3 mb-4 rounded-md ${
            messageType === 'success' ? 'bg-green-100 text-green-700' : 
            messageType === 'error' ? 'bg-red-100 text-red-700' : 
            'bg-blue-100 text-blue-700'
          }`}>
            {message}
          </div>
        )}
        
        {/* Wallet Top-Up Form */}
        {activeTab === 'wallet' && (
          <div className='mb-6 space-y-4'>
            <div>
              <label className='block mb-1 text-sm font-medium text-gray-700'>Buyer ID</label>
              <input
                type='text'
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
              />
            </div>
            
            <div>
              <label className='block mb-1 text-sm font-medium text-gray-700'>Amount (₦)</label>
              <input
                type='number'
                min='100'
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
              />
            </div>
            
            <div className='flex flex-col space-y-3'>
              <PaystackButton
                {...getPaystackConfig()}
                className='w-full px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50'
                text={loading ? 'Processing...' : 'Top Up with Paystack'}
                disabled={loading || amount < 100}
              />
              
              <button
                onClick={directTopUp}
                disabled={loading}
                className='w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
              >
                {loading ? 'Processing...' : 'Direct Top Up (Admin/Test)'}
              </button>
              
              <button
                onClick={() => {
                  fetchWalletBalance();
                  fetchTransactions();
                }}
                className='w-full px-4 py-2 font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                Refresh Data
              </button>
            </div>
          </div>
        )}
        
        {/* Order Payment Form */}
        {activeTab === 'order' && (
          <div className='mb-6 space-y-4'>
            <div>
              <label className='block mb-1 text-sm font-medium text-gray-700'>Buyer ID</label>
              <input
                type='text'
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            
            {/* Hardcoded Order Toggle */}
            <div className='flex items-center'>
              <input
                type='checkbox'
                id='useHardcodedOrder'
                checked={useHardcodedOrder}
                onChange={() => {
                  setUseHardcodedOrder(!useHardcodedOrder);
                  if (!useHardcodedOrder) {
                    // When switching to hardcoded, set the ID and fetch details
                    setOrderId('67cdd60c9cbb0b29500c3d1e');
                    fetchOrderDetails('67cdd60c9cbb0b29500c3d1e');
                  } else {
                    // When switching to dropdown, clear selection
                    setOrderId('');
                    setSelectedOrder(null);
                  }
                }}
                className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
              />
              <label htmlFor='useHardcodedOrder' className='ml-2 text-sm font-medium text-gray-700'>
                Use hardcoded order ID: 67cdd60c9cbb0b29500c3d1e
              </label>
            </div>
            
            {/* Order Selection Dropdown (only shown when not using hardcoded ID) */}
            {!useHardcodedOrder && (
              <div>
                <label className='block mb-1 text-sm font-medium text-gray-700'>Select Order</label>
                <select
                  value={orderId}
                  onChange={handleOrderSelect}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value="">-- Select an order --</option>
                  {orders.map(order => (
                    <option key={order._id} value={order._id}>
                      {order.order_id} - ₦{order.totalAmount.toLocaleString()} - {order.paid ? 'Paid' : 'Unpaid'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Order ID Input (only shown when using hardcoded ID) */}
            {useHardcodedOrder && (
              <div>
                <label className='block mb-1 text-sm font-medium text-gray-700'>Order ID</label>
                <input
                  type='text'
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value);
                    if (e.target.value) {
                      fetchOrderDetails(e.target.value);
                    } else {
                      setSelectedOrder(null);
                    }
                  }}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            )}
            
            {selectedOrder && (
              <div className='p-4 bg-gray-50 rounded-lg'>
                <h3 className='mb-2 text-lg font-semibold'>Order Details</h3>
                <p><strong>Order ID:</strong> {selectedOrder.order_id}</p>
                <p><strong>Amount:</strong> ₦{selectedOrder.totalAmount ? selectedOrder.totalAmount.toLocaleString() : '0'}</p>
                <p><strong>Status:</strong> {selectedOrder.paid ? 'Paid' : 'Unpaid'}</p>
                <p><strong>Items:</strong> {selectedOrder.items ? selectedOrder.items.length : 0}</p>
              </div>
            )}
            
            <div>
              <label className='block mb-1 text-sm font-medium text-gray-700'>Amount to Pay (₦)</label>
              <input
                type='number'
                min='100'
                value={orderAmount}
                onChange={(e) => setOrderAmount(Number(e.target.value))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            
            <div className='flex flex-col space-y-3'>
              <PaystackButton
                {...getPaystackConfig()}
                className='w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
                text={loading ? 'Processing...' : 'Pay for Order with Paystack'}
                disabled={loading || !orderId || orderAmount < 100}
              />
              
              <button
                onClick={() => {
                  fetchOrders();
                  if (orderId) {
                    fetchOrderDetails(orderId);
                  }
                }}
                className='w-full px-4 py-2 font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                Refresh Orders
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Transaction History (for wallet tab) */}
      {activeTab === 'wallet' && (
        <div className='w-full max-w-md p-6 mt-6 bg-white rounded-lg shadow-md'>
          <h2 className='mb-4 text-xl font-bold'>Recent Transactions</h2>
          
          {transactions.length === 0 ? (
            <p className='text-gray-500'>No transactions found</p>
          ) : (
            <div className='space-y-3'>
              {transactions.slice(0, 5).map((tx, index) => (
                <div key={index} className='p-3 border-b border-gray-200 last:border-0'>
                  <div className='flex justify-between'>
                    <span className={`font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                    </span>
                    <span className='text-sm text-gray-500'>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className='text-sm text-gray-600'>{tx.description}</p>
                  <p className='text-xs text-gray-500'>Ref: {tx.paymentReference}</p>
                  <span className={`inline-block px-2 py-1 mt-1 text-xs rounded-full ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Orders List (for order tab) */}
      {activeTab === 'order' && (
        <div className='w-full max-w-md p-6 mt-6 bg-white rounded-lg shadow-md'>
          <h2 className='mb-4 text-xl font-bold'>Recent Orders</h2>
          
          {orders.length === 0 ? (
            <p className='text-gray-500'>No orders found</p>
          ) : (
            <div className='space-y-3'>
              {orders.slice(0, 5).map((order, index) => (
                <div key={index} className='p-3 border-b border-gray-200 last:border-0'>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Order #{order.order_id}</span>
                    <span className='text-sm text-gray-500'>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className='text-sm text-gray-600'>Amount: ₦{order.totalAmount.toLocaleString()}</p>
                  <p className='text-sm text-gray-600'>Items: {order.items.length}</p>
                  <span className={`inline-block px-2 py-1 mt-1 text-xs rounded-full ${
                    order.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.paid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TestTopup
