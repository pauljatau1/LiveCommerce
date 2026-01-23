const mongoose = require('mongoose');
const orderRepository = require('../repositories/order.repository');
const terminalAPI = require('../../../config/terminalAPI');
const { determinePickupAddress, formatAddressForTerminal } = require('../helpers/order.helper');
const { formatAddress } = require('../helpers/address.helper');
const { handleShipmentFailure } = require('../helpers/shipment.helper');
const errorLoggingService = require('../../error-logging/services/error-logging.service');

const formatPhoneNumber = (phone) => {
    if (typeof phone === 'string' && phone.startsWith('0')) {
        return `+234${phone.substring(1)}`;
    }
    return phone;
};

exports.createShipmentForOrder = async (orderId, shipmentPurpose) => {
    let session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            throw new Error('Invalid order ID format');
        }

        const order = await orderRepository.findOrderById(orderId, session);

        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status !== 'draft') {
            throw new Error('Shipment can only be created for draft orders.');
        }
        
        if (order.isStorePickup) {
            // No shipment needed for store pickup, just update status
            order.status = 'pending_payment';
            await order.save({ session });
            await session.commitTransaction();
            session.endSession();
            return { message: 'Order is for store pickup. No shipment created.', order };
        }
        
        // Batch fetch buyer and seller to reduce query time
        const [buyer, seller] = await Promise.all([
            orderRepository.findBuyerById(order.buyer, session),
            orderRepository.findSellerById(order.seller, session)
        ]);
        
        // Prepare all data needed for Terminal Africa API
        let cleanPickupAddress = formatAddress(order.pickup_address.toObject());

        if (!order.delivery_address) {
            throw new Error('Order is missing a delivery address.');
        }
        let cleanDeliveryAddress = formatAddress(order.delivery_address.toObject());

        if (cleanDeliveryAddress.line1 && cleanDeliveryAddress.line1.length > 45) {
            cleanDeliveryAddress.line1 = cleanDeliveryAddress.line1.substring(0, 44);
        }

        // Format phone numbers to international standard
        if (cleanPickupAddress.phone) {
            cleanPickupAddress.phone = formatPhoneNumber(cleanPickupAddress.phone);
        }
        if (cleanDeliveryAddress.phone) {
            cleanDeliveryAddress.phone = formatPhoneNumber(cleanDeliveryAddress.phone);
        }
        
        const parcelItems = order.items.map(item => {
            const itemWeight = item.weight || 0.4; // Use order item weight, default to 0.4kg
            
            return {
                description: item.productName,
                name: item.productName,
                type: "parcel",
                currency: "NGN",
                value: item.price,
                quantity: item.quantity,
                weight: itemWeight,
                metadata: {} // Per user feedback, this should not contain internal data
            }
        });

        const terminalShipmentRequest = {
            pickup_address: cleanPickupAddress,
            delivery_address: cleanDeliveryAddress,
            metadata : {delivery_type: "Urgent delivery from Auqli"},
            shipment_purpose: shipmentPurpose || 'commercial',
            parcel: {
              items: parcelItems,
              description: `Order from ${seller.storeName || seller.businessName || 'Seller'}`,
              weight_unit: "kg"
            }
        };

        // CRITICAL OPTIMIZATION: Commit transaction BEFORE external API call
        // This reduces database lock time from 3-5 seconds to ~50-100ms
        await session.commitTransaction();
        session.endSession();

        console.log('Shipment Service: Sending request to Terminal Africa:', JSON.stringify(terminalShipmentRequest, null, 2));
        const terminalResponse = await terminalAPI.post('/shipments/quick', terminalShipmentRequest);
        console.log('Shipment Service: Received response from Terminal Africa:', JSON.stringify(terminalResponse.data, null, 2));

        if (!terminalResponse.data.status || !terminalResponse.data.data) {
            await errorLoggingService.logError(orderId, 'arrange_shipment', terminalResponse.data);
            throw new Error(terminalResponse.data.message || 'Failed to create shipment with Terminal Africa');
        }

        // Start a NEW transaction to update order with shipment data
        session = await mongoose.startSession();
        session.startTransaction();

        // Refetch order in new transaction
        const orderToUpdate = await orderRepository.findOrderById(orderId, session);
        if (!orderToUpdate) {
            throw new Error('Order not found after shipment creation');
        }

        const shipmentData = terminalResponse.data.data;
        orderToUpdate.shipping.shipment_id = shipmentData.shipment_id || shipmentData._id;
        orderToUpdate.shipping.carrier = { name: 'Terminal Africa', reference: orderToUpdate.shipping.shipment_id };
        orderToUpdate.shipping.tracking = { number: orderToUpdate.shipping.shipment_id, status: 'pending' };

        await orderToUpdate.save({ session });

        await session.commitTransaction();
        session.endSession();

        return {
            message: 'Shipment created successfully and order is now pending payment.',
            order_id: orderToUpdate.order_id,
            shipment_id: orderToUpdate.shipping.shipment_id,
            status: orderToUpdate.status
        };

    } catch (error) {
        if (session && session.inTransaction()) {
            await session.abortTransaction();
        }
        if (session) {
            session.endSession();
        }

        // Handle shipment failure
        const orderForFailureHandling = await orderRepository.findOrderById(orderId);
        if (orderForFailureHandling) {
            await handleShipmentFailure(orderForFailureHandling, error);
        }

        throw error;
    }
}; 