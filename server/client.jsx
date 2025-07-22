'use client'

import React, { useContext, useState, useEffect, useMemo } from 'react';
import { PaystackButton } from 'react-paystack';
import { CartContext } from '../context/CartContext';
import axios from 'axios';
import { useRouter } from 'next/navigation';

function CheckoutPage() {
  const { cartItems, removeFromCart, updateItemQuantity, clearCart } = useContext(CartContext);
  const router = useRouter();

  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    line1: '',
    state: '',
    city: '',
    zip: '',
    country: 'NG'
  });

  const [currentStep, setCurrentStep] = useState('address'); // address -> shipping -> payment -> success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Order & shipping states
  const [draftOrders, setDraftOrders] = useState([]); // Each order will have a `rates` array
  const [selectedCarriers, setSelectedCarriers] = useState({}); // { [orderId]: rateObject }
  
  const baseUrl = 'https://api.staging.auqli.live/api/v2';
  const paystackKey = 'pk_test_4362c6ccfe78d91e6216122d1b36c848fa051362';

  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
    'Yobe', 'Zamfara'
  ];

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0 && currentStep !== 'success') {
      router.push('/products');
    }
  }, [cartItems, currentStep, router]);


  const formatPrice = (price) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price);

  const cartSubtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);
  
  const grandTotal = useMemo(() => {
    const itemsTotal = draftOrders.reduce((acc, order) => acc + order.totalAmount, 0);
    const shippingTotal = Object.values(selectedCarriers).reduce((acc, rate) => acc + (rate?.amount || 0), 0);
    return itemsTotal + shippingTotal;
  }, [draftOrders, selectedCarriers]);


  const handleAddressChange = (field, value) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleProceedToShipping = async () => {
    if (!shippingAddress.first_name || !shippingAddress.last_name || !shippingAddress.phone || !shippingAddress.email || !shippingAddress.line1 || !shippingAddress.state || !shippingAddress.city || !shippingAddress.zip) {
      return setError('Please fill all required shipping fields.');
    }
    setError(null);
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          weight: item.weight,
          specifications: item.specifications,
        })),
        shippingAddress
      };

      // Single API call to create order, shipment, and get rates
      const { data } = await axios.post(`${baseUrl}/orders`, payload, { headers });

      // The response now contains orders with their rates included
      setDraftOrders(data.orders || []);
      setCurrentStep('shipping');

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create draft orders and fetch rates.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCarrier = (orderId, rate) => {
    setSelectedCarriers(prev => ({ ...prev, [orderId]: rate }));
  };

  const allCarriersSelected = useMemo(() => {
      if (draftOrders.length === 0) return false;
      return draftOrders.every(order => selectedCarriers[order.orderId]);
  }, [draftOrders, selectedCarriers]);


  const handleProceedToPayment = () => {
      if (!allCarriersSelected) {
          setError('Please select a shipping option for all orders.');
          return;
      }
      setError(null);
      setCurrentStep('payment');
  };

  const handlePayment = async (paymentMethod, paystackReference = null) => {
      setLoading(true);
      setError(null);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        await Promise.all(
            draftOrders.map(order => {
                const payload = {
                    carrier: selectedCarriers[order.orderId],
                    paymentDetails: {
                        method: paymentMethod,
                        reference: paymentMethod === 'paystack' ? paystackReference : undefined
                    }
                };
                return axios.post(`${baseUrl}/orders/${order.orderId}/pay`, payload, { headers });
            })
        );
        
        clearCart();
        setCurrentStep('success');
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Payment failed.');
      } finally {
        setLoading(false);
      }
  };

  const paystackOnSuccess = (ref) => {
    handlePayment('paystack', ref.reference);
  };
  
  // RENDER LOGIC
  const renderAddressStep = () => (
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 bg-white rounded-lg shadow p-4'>
            <h2 className='text-xl font-semibold mb-4'>Your Cart ({cartItems.length})</h2>
            <div className='space-y-4'>
                {cartItems.map((item) => (
                <div key={`${item.productId}-${item.sellerId}`} className='flex items-center'>
                    <img src={item.image || 'https://via.placeholder.com/60'} alt={item.name} className='w-16 h-16 object-cover rounded mr-4'/>
                    <div className='flex-1'>
                    <h3 className='font-semibold'>{item.name}</h3>
                    <p className='text-sm text-gray-500'>Sold by: {item.sellerName}</p>
                    <p className='text-sm'>{formatPrice(item.price)} x {item.quantity}</p>
                    </div>
                    <div className='flex items-center space-x-2'>
                    <button onClick={() => updateItemQuantity(item.productId, item.sellerId, Math.max(1, item.quantity - 1))} className='px-2 py-1 bg-gray-200 rounded'>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateItemQuantity(item.productId, item.sellerId, item.quantity + 1)} className='px-2 py-1 bg-gray-200 rounded'>+</button>
                    <button onClick={() => removeFromCart(item.productId, item.sellerId)} className='text-red-500 hover:text-red-700 ml-2'>Remove</button>
                    </div>
                </div>
                ))}
            </div>
            <div className='mt-4 pt-4 border-t flex justify-between font-bold text-lg'>
                <span>Subtotal:</span>
                <span>{formatPrice(cartSubtotal)}</span>
            </div>
        </div>
        <div className='bg-white rounded-lg shadow p-4'>
            <h2 className='text-xl font-semibold mb-4'>Shipping Details</h2>
            <div className='space-y-3'>
            <input type='text' placeholder='First Name *' value={shippingAddress.first_name} onChange={(e)=>handleAddressChange('first_name', e.target.value)} className='w-full border rounded px-3 py-2'/>
            <input type='text' placeholder='Last Name *' value={shippingAddress.last_name} onChange={(e)=>handleAddressChange('last_name', e.target.value)} className='w-full border rounded px-3 py-2'/>
            <input type='tel' placeholder='Phone Number *' value={shippingAddress.phone} onChange={(e)=>handleAddressChange('phone', e.target.value)} className='w-full border rounded px-3 py-2'/>
            <input type='email' placeholder='Email *' value={shippingAddress.email} onChange={(e)=>handleAddressChange('email', e.target.value)} className='w-full border rounded px-3 py-2'/>
            <textarea placeholder='Delivery Address *' value={shippingAddress.line1} onChange={(e)=>handleAddressChange('line1', e.target.value)} rows={3} className='w-full border rounded px-3 py-2'/>
            <select value={shippingAddress.state} onChange={(e)=>handleAddressChange('state', e.target.value)} className='w-full border rounded px-3 py-2'>
                <option value=''>Select State *</option>
                {nigerianStates.map((st)=> <option key={st} value={st}>{st}</option>)}
            </select>
            <input type='text' placeholder='City *' value={shippingAddress.city} onChange={(e)=>handleAddressChange('city', e.target.value)} className='w-full border rounded px-3 py-2'/>
            <input type='text' placeholder='Zip Code *' value={shippingAddress.zip} onChange={(e) => handleAddressChange('zip', e.target.value)} className='w-full border rounded px-3 py-2' />
            </div>
            <button onClick={handleProceedToShipping} disabled={loading || cartItems.length === 0} className='w-full mt-4 bg-green-600 text-white py-3 rounded hover:bg-green-700 disabled:bg-gray-400 font-semibold'>
            {loading ? 'Processing...' : 'Proceed to Shipping'}
            </button>
        </div>
      </div>
  );

  const renderShippingStep = () => (
    <div className='bg-white rounded-lg shadow p-6 mt-6'>
        <h2 className='text-2xl font-bold mb-4'>Choose Shipping Option</h2>
        <p className='mb-6 text-gray-600'>Select a delivery option for each order below.</p>
        <div className='space-y-6'>
            {draftOrders.map(order => (
                <div key={order.orderId} className='border rounded-lg p-4'>
                    <h3 className='font-bold text-lg mb-2'>Order {order.order_id}</h3>
                    <div className='pl-2'>
                        {(!order.rates || order.rates.length === 0) && <p>No shipping rates available for this order.</p>}
                        {order.rates && order.rates.map(rate => (
                            <label key={rate.rate_id} className='flex items-center space-x-3 p-3 border-b cursor-pointer hover:bg-gray-50'>
                                <input
                                    type='radio'
                                    name={`carrier-${order.orderId}`}
                                    checked={selectedCarriers[order.orderId]?.rate_id === rate.rate_id}
                                    onChange={() => handleSelectCarrier(order.orderId, rate)}
                                />
                                <span className='flex-1 font-medium'>{rate.carrier}</span>
                                <span className='font-semibold'>{formatPrice(rate.amount)}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        <div className='mt-6 text-right'>
             <button onClick={handleProceedToPayment} disabled={!allCarriersSelected || loading} className='bg-green-600 text-white py-3 px-8 rounded hover:bg-green-700 disabled:bg-gray-400 font-semibold'>
                {loading ? 'Confirming...' : 'Proceed to Payment'}
            </button>
        </div>
    </div>
  );
  
  const renderPaymentStep = () => (
    <div className='bg-white rounded-lg shadow p-6 mt-6'>
        <h2 className='text-2xl font-bold mb-4'>Final Payment</h2>
        <div className='mb-6 border-b pb-4'>
            {draftOrders.map(order => {
                const shipping = selectedCarriers[order.orderId]?.amount || 0;
                return(
                    <div key={order.orderId} className='flex justify-between items-center py-1 text-gray-700'>
                        <span>Order {order.order_id} (Items: {formatPrice(order.totalAmount)}) + Shipping:</span>
                        <span className='font-medium'>{formatPrice(shipping)}</span>
                    </div>
                )
            })}
             <div className='flex justify-between items-center py-2 mt-4 border-t font-bold text-xl'>
                <span>Grand Total:</span>
                <span>{formatPrice(grandTotal)}</span>
            </div>
        </div>

        <div className='flex items-center justify-center gap-6'>
             <button
                onClick={() => handlePayment('wallet')}
                disabled={loading}
                className='bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-lg'
              >
                {loading ? 'Processing...' : 'Pay with Wallet'}
              </button>
            <PaystackButton
                className='bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold text-lg'
                disabled={loading || grandTotal <= 0}
                publicKey={paystackKey}
                email={shippingAddress.email}
                amount={Math.round(grandTotal * 100)}
                reference={`auqli-${Date.now()}`}
                onSuccess={paystackOnSuccess}
                onClose={() => console.log('Paystack modal closed.')}
                text={loading ? 'Processing...' : 'Pay with Card / Bank'}
            />
        </div>
    </div>
  );

  const renderSuccessStep = () => (
      <div className='bg-white rounded-lg shadow p-8 mt-6 text-center'>
        <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className='text-3xl font-bold mt-4'>Payment Successful!</h2>
        <p className='text-gray-600 mt-2'>Your orders have been placed and are now being processed.</p>
        <button onClick={() => router.push('/products')} className='mt-6 bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700'>
            Continue Shopping
        </button>
      </div>
  );

  return (
    <div className='min-h-screen bg-gray-100 p-4'>
      <div className='max-w-5xl mx-auto'>
        <h1 className='text-3xl font-bold mb-6 text-center'>Checkout</h1>

        {error && (
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
            {error}
          </div>
        )}

        {currentStep === 'address' && renderAddressStep()}
        {currentStep === 'shipping' && renderShippingStep()}
        {currentStep === 'payment' && renderPaymentStep()}
        {currentStep === 'success' && renderSuccessStep()}
      </div>
    </div>
  );
}

export default CheckoutPage; 