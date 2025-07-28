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
    const session = await mongoose.startSession();
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
        
        const buyer = await orderRepository.findBuyerById(order.buyer, session);
        const seller = await orderRepository.findSellerById(order.seller, session);
        
        // Cleanse addresses to remove Mongoose-specific properties
        // Cleanse and format addresses
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

        console.log('Shipment Service: Sending request to Terminal Africa:', JSON.stringify(terminalShipmentRequest, null, 2));
        const terminalResponse = await terminalAPI.post('/shipments/quick', terminalShipmentRequest);
        console.log('Shipment Service: Received response from Terminal Africa:', JSON.stringify(terminalResponse.data, null, 2));

        if (!terminalResponse.data.status || !terminalResponse.data.data) {
            await errorLoggingService.logError(orderId, 'arrange_shipment', terminalResponse.data);
            throw new Error(terminalResponse.data.message || 'Failed to create shipment with Terminal Africa');
        }

        const shipmentData = terminalResponse.data.data;
        order.shipping.shipment_id = shipmentData.shipment_id || shipmentData._id;
        order.shipping.carrier = { name: 'Terminal Africa', reference: order.shipping.shipment_id };
        order.shipping.tracking = { number: order.shipping.shipment_id, status: 'pending' };

        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        return {
            message: 'Shipment created successfully and order is now pending payment.',
            order_id: order.order_id,
            shipment_id: order.shipping.shipment_id,
            status: order.status
        };

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();

        // Handle shipment failure
        const orderForFailureHandling = await orderRepository.findOrderById(orderId);
        if (orderForFailureHandling) {
            await handleShipmentFailure(orderForFailureHandling, error);
        }

        throw error;
    }
}; 