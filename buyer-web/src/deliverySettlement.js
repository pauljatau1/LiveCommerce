const naira=value=>`₦${Number(value || 0).toLocaleString('en-NG')}`;
export const settlementText=d=>!d?.paidAt||!Number.isFinite(d.adjustment)?'':d.adjustment>0?`Final parcel price was higher than the first-item estimate. ${naira(d.adjustment)} more was paid from your wallet.`:d.adjustment<0?`Final parcel price was lower than the first-item estimate. ${naira(-d.adjustment)} returned to your available wallet.`:'Your delivery hold covered the final parcel price.';

export const deliveryEstimateText=amount=>`Delivery from ${naira(amount)} · one parcel per show, priced when the show ends`;

export const hasFinalDelivery=d=>Boolean(d&&['awaiting_payment','paid','booked','in_transit','delivered'].includes(d.status)&&Number.isFinite(d.fee));
