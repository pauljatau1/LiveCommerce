import React, { useState, useEffect } from 'react'
import { PaystackButton } from 'react-paystack'

function OrderPaymentClient() {
  // State variables for order payment
  const [buyerId, setBuyerId] = useState('676e96b120e1a98b76e28a3e');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [reference, setReference] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderAmount, setOrderAmount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [useHardcodedOrder, setUseHardcodedOrder] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // Sample auth token - replace with your actual test token
  const authToken = 'JWT_REDACTED';
  
  // Paystack public key - replace with your test key
  const paystackPublicKey = 'pk_test_4362c6ccfe78d91e6216122d1b36c848fa051362';

  // Generate a new reference when component mounts
  useEffect(() => {
    generateReference();
    fetchWalletBalance();
    fetchOrders();
  }, []);

  // Generate a unique reference
  const generateReference = () => {
    const newReference = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setReference(newReference);
    return newReference;
  };

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/buyer/wallet', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setWalletBalance(data.balance);
      } else {
        console.error('Error fetching wallet balance:', data);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/order', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders);
      } else {
        console.error('Error fetching orders:', data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Fetch order details
  const fetchOrderDetails = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/api/order/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSelectedOrder(data.order);
        setOrderAmount(data.order.totalAmount);
        setOrderId(data.order._id);
      } else {
        console.error('Error fetching order details:', data);
        showMessage('Error fetching order details: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      showMessage('Error fetching order details: ' + error.message, 'error');
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
            // Try direct order payment as fallback
            tryDirectOrderPayment(reference);
            return;
          }
        }
        
        showMessage(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error verifying order payment:', error);
      showMessage('Error verifying payment: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Try direct order payment as fallback
  const tryDirectOrderPayment = async (reference) => {
    try {
      setLoading(true);
      showMessage('Trying direct order payment...', 'info');
      
      const response = await fetch(`http://localhost:8000/api/order/verify-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reference,
          orderId
        })
      });
      
      const data = await response.json();
      console.log('Direct order payment response:', data);
      
      if (response.ok) {
        showMessage(`Order payment successful! Order has been marked as paid.`, 'success');
        fetchOrders();
        if (orderId) {
          fetchOrderDetails(orderId);
        }
      } else {
        showMessage(data.message || 'Direct order payment failed', 'error');
      }
    } catch (error) {
      console.error('Error with direct order payment:', error);
      showMessage('Error with direct payment: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Display message
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    
    // Clear message after 10 seconds
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 10000);
  };

  // Handle order selection
  const handleOrderSelect = async (e) => {
    const selectedId = e.target.value;
    setOrderId(selectedId);
    
    if (selectedId) {
      await fetchOrderDetails(selectedId);
    } else {
      setSelectedOrder(null);
      setOrderAmount(0);
    }
    
    // When selecting an order from dropdown, turn off hardcoded mode
    setUseHardcodedOrder(false);
  };

  // Paystack config for order payment
  const getPaystackConfig = () => {
    // Generate a new reference when needed
    if (!reference) {
      generateReference();
    }
    
    return {
      reference,
      email: "test@example.com", // This would normally come from the user's profile
      publicKey: paystackPublicKey,
      amount: orderAmount * 100, // Paystack amount is in kobo
      metadata: {
        orderId: orderId,
        buyerId: buyerId,
        transactionType: 'order_payment',
        description: 'Order payment',
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
  };

  // Create a new order
  const createOrder = async () => {
    try {
      setLoading(true);
      showMessage('Creating new order...', 'info');
      
      const orderData = {
        items: [
          {
            productId: "6797aa783d6b1521817bdd55",
            quantity: 1,
            price: 200000,
            weight: 1,
            seller: {
              sellerId: "67974a2bb708ae48a32baf87",
              senderInfo: {
                senderName: "Todimu Bamtefa",
                senderAddress: "just incase",
                senderPhone: "+2348083412865",
                senderEmail: "todimubamtefa11@gmail.com",
                pickUpState: "Lagos"
              },
              shippingFee: 100,
              parcelInfo: {
                itemDescription: "Gaming Mouse"
              }
            },
            specifications: {
              color: "",
              size: "",
              material: ""
            }
          }
        ],
        shippingAddress: {
          recipientName: "Todimu Bamtefa",
          recipientEmail: "todibamtefa17@gmail.com",
          recipientPhone: "+2348083412865",
          recipientAddress: "123 street off somolu express way beside so-1",
          recipientState: "lagos"
        },
        paymentMethod: "paystack",
        isItemCod: false,
        shippingFee: 100,
        additionalDetails: "Please handle with care",
        paidFromWallet: false
      };
      
      const response = await fetch('http://localhost:8000/api/order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage(`Order created successfully! Order ID: ${data.order.order_id}`, 'success');
        fetchOrders();
        setOrderId(data.order._id);
        setOrderAmount(data.order.totalAmount);
        setSelectedOrder(data.order);
        setUseHardcodedOrder(false);
      } else {
        showMessage('Error creating order: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showMessage('Error creating order: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100'>
      <div className='w-full max-w-md p-6 bg-white rounded-lg shadow-md'>
        <h1 className='mb-6 text-2xl font-bold text-center'>Order Payment</h1>
        
        {/* Wallet Balance */}
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
        
        {/* Create Order Button */}
        <div className='mb-6'>
          <button
            onClick={createOrder}
            disabled={loading}
            className='w-full px-4 py-2 font-medium text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50'
          >
            {loading ? 'Processing...' : 'Create New Order'}
          </button>
        </div>
        
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
          
          {/* Order Selection Dropdown */}
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
          
          {/* Order Details */}
          {selectedOrder && (
            <div className='p-4 mt-4 border border-gray-200 rounded-md'>
              <h3 className='mb-2 text-lg font-semibold'>Order Details</h3>
              <p><strong>Order ID:</strong> {selectedOrder.order_id}</p>
              <p><strong>Amount:</strong> ₦{selectedOrder.totalAmount.toLocaleString()}</p>
              <p><strong>Status:</strong> {selectedOrder.paid ? 'Paid' : 'Unpaid'}</p>
              <p><strong>Items:</strong> {selectedOrder.items?.length || 0}</p>
              <p><strong>Created:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
            </div>
          )}
          
          {/* Payment Button */}
          {selectedOrder && !selectedOrder.paid && (
            <div className='mt-4'>
              <PaystackButton
                {...getPaystackConfig()}
                className='w-full px-4 py-2 font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
                text={loading ? 'Processing...' : 'Pay with Paystack'}
                disabled={loading || !orderId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderPaymentClient
