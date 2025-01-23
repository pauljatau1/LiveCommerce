const getShipmentCreatedEmailTemplate = (order, trackingNumber) => ({
  buyer: {
    subject: `Shipment Created for Order #${order._id}`,
    html: `
      <h2>Your Order is Ready for Shipping!</h2>
      <p>Hello ${order.buyer.firstName},</p>
      <p>Great news! The shipment for your order #${order._id} has been created and is being prepared for pickup.</p>
      <div style="margin: 20px 0;">
        <h3>Shipment Details:</h3>
        <ul>
          <li>Tracking Number: ${trackingNumber}</li>
          <li>Order Total: ${order.totalAmount}</li>
          <li>Shipping Address: ${formatAddress(order.shipping.delivery)}</li>
        </ul>
      </div>
      <p>You'll receive updates as your package moves through our delivery network.</p>
      <p>Thank you for shopping with us!</p>
    `
  },
  seller: {
    subject: `Shipment Created for Order #${order._id}`,
    html: `
      <h2>Shipment Created Successfully</h2>
      <p>Hello ${order.seller.firstName},</p>
      <p>A shipment has been created for order #${order._id}.</p>
      <div style="margin: 20px 0;">
        <h3>Shipment Details:</h3>
        <ul>
          <li>Tracking Number: ${trackingNumber}</li>
          <li>Order Total: ${order.totalAmount}</li>
          <li>Delivery Address: ${formatAddress(order.shipping.delivery)}</li>
        </ul>
      </div>
      <p>Please ensure the package is ready for pickup.</p>
    `
  }
});

// Helper function to format address
const formatAddress = (delivery) => {
  if (!delivery) return 'Address not available';
  
  const parts = [
    delivery.line1,
    delivery.line2,
    delivery.city,
    delivery.state,
    delivery.country,
    delivery.zip
  ].filter(Boolean); // Remove empty or undefined values
  
  return parts.join(', ');
};

const getShipmentInTransitEmailTemplate = (order, location) => ({
  buyer: {
    subject: `Your Order #${order._id} is in Transit`,
    html: `
      <h2>Your Package is on the Move!</h2>
      <p>Hello ${order.buyer.firstName},</p>
      <p>Your order #${order._id} is now in transit.</p>
      <div style="margin: 20px 0;">
        <h3>Current Status:</h3>
        <ul>
          <li>Location: ${location || 'In transit'}</li>
          <li>Tracking Number: ${order.shipping.tracking.number}</li>
        </ul>
      </div>
      <p>We'll keep you updated on your package's journey!</p>
    `
  }
});

const getShipmentDeliveredEmailTemplate = (order) => ({
  buyer: {
    subject: `Your Order #${order._id} Has Been Delivered!`,
    html: `
      <h2>Package Delivered Successfully!</h2>
      <p>Hello ${order.buyer.firstName},</p>
      <p>Your order #${order._id} has been delivered!</p>
      <div style="margin: 20px 0;">
        <h3>Delivery Details:</h3>
        <ul>
          <li>Delivered on: ${new Date().toLocaleDateString()}</li>
          <li>Tracking Number: ${order.shipping.tracking.number}</li>
        </ul>
      </div>
      <p>Please take a moment to review your purchase and let us know if you have any questions.</p>
    `
  },
  seller: {
    subject: `Order #${order._id} Delivered Successfully`,
    html: `
      <h2>Order Delivered</h2>
      <p>Hello ${order.seller.firstName},</p>
      <p>Order #${order._id} has been successfully delivered to the customer.</p>
      <div style="margin: 20px 0;">
        <h3>Delivery Details:</h3>
        <ul>
          <li>Delivered on: ${new Date().toLocaleDateString()}</li>
          <li>Tracking Number: ${order.shipping.tracking.number}</li>
        </ul>
      </div>
    `
  }
});

const getShipmentCancelledEmailTemplate = (order, reason) => ({
  buyer: {
    subject: `Shipment Cancelled for Order #${order._id}`,
    html: `
      <h2>Shipment Cancellation Notice</h2>
      <p>Hello ${order.buyer.firstName},</p>
      <p>Unfortunately, the shipment for order #${order._id} has been cancelled.</p>
      <div style="margin: 20px 0;">
        <h3>Cancellation Details:</h3>
        <ul>
          <li>Reason: ${reason || 'Shipping carrier cancellation'}</li>
          <li>Order Number: ${order._id}</li>
        </ul>
      </div>
      <p>Our support team will contact you shortly to resolve this issue.</p>
    `
  },
  seller: {
    subject: `Shipment Cancelled for Order #${order._id}`,
    html: `
      <h2>Shipment Cancellation Alert</h2>
      <p>Hello ${order.seller.firstName},</p>
      <p>The shipment for order #${order._id} has been cancelled.</p>
      <div style="margin: 20px 0;">
        <h3>Cancellation Details:</h3>
        <ul>
          <li>Reason: ${reason || 'Shipping carrier cancellation'}</li>
          <li>Order Number: ${order._id}</li>
        </ul>
      </div>
      <p>Please check your Terminal Africa dashboard for more details.</p>
    `
  }
});

module.exports = {
  getShipmentCreatedEmailTemplate,
  getShipmentInTransitEmailTemplate,
  getShipmentDeliveredEmailTemplate,
  getShipmentCancelledEmailTemplate
}; 