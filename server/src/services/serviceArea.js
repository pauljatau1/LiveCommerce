const lagosAreas = require('../data/lagosAreas.json');
const normalizeState = state => String(state || '').trim().replace(/\s+/g, ' ').replace(/\s+state$/i, '').trim().toLowerCase();
const allowedStates = () => [...new Map((process.env.SERVICE_STATES || 'Lagos').split(',').filter(s => normalizeState(s)).map(s => [normalizeState(s), normalizeState(s).replace(/\b\w/g, c => c.toUpperCase())])).values()];
const inServiceArea = state => allowedStates().some(s => normalizeState(s) === normalizeState(state));
const serviceAreaConfig = () => ({ states: allowedStates(), areas: { Lagos: lagosAreas } });
const deliveryMessage = () => `Delivery is ${allowedStates().join(' and ')}-only for now`;
const pickupMessage = () => `We deliver within ${allowedStates().join(' and ')} for now. Update your pickup address to go live.`;
const pickupAddress = s => s?.warehouseDetails?.address?.addressLine1 ? s.warehouseDetails.address : s?.businessAddress?.addressLine1 ? s.businessAddress : s?.sellerAddress || {};
class ServiceAreaError extends Error {
  constructor(state, seller = false) { super(seller ? pickupMessage() : deliveryMessage()); this.code = 'out_of_area'; this.reason = 'out_of_area'; this.status = 422; this.state = state; }
}
const requireState = (state, seller = false) => { if (!inServiceArea(state)) throw new ServiceAreaError(state, seller); };
const checkAddresses = (buyer, seller) => { if (buyer?.shippingAddresses?.length) requireState(buyer.shippingAddresses[0].state); requireState(pickupAddress(seller).state, true); };
// Independent of courier configuration and whether a deposit is already held.
async function checkPurchase(streamId, buyerId) {
  const mongoose = require('mongoose');
  const [buyer, stream] = await Promise.all([mongoose.model('Buyer').findById(buyerId).lean(), mongoose.model('Stream').findById(streamId).populate('seller').lean()]);
  if (!buyer || !stream) return; // Existing not-found handling owns these errors.
  checkAddresses(buyer, stream.seller);
}
// Shared by the socket bid handler: a refusal emits the client-recognised code.
function allowBid(socket, buyer, seller) {
  try { checkAddresses(buyer, seller); return true; }
  catch(e) { if(e.code !== 'out_of_area') throw e; socket.emit('bid_error', {code:e.code,message:e.message,state:e.state}); return false; }
}
module.exports = { allowBid, normalizeState, allowedStates, inServiceArea, lagosAreas, serviceAreaConfig, deliveryMessage, pickupMessage, pickupAddress, requireState, checkAddresses, checkPurchase, ServiceAreaError };
