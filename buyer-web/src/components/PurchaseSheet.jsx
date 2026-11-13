import {Link} from 'react-router-dom';
import {Sheet} from './ui';
import {naira} from '../api';
import {deliveryEstimateText,settlementText,hasFinalDelivery} from '../deliverySettlement';
export default function PurchaseSheet({purchase,delivery,estimate,ended=false,following,hasHost,onFollow,onClose}){
 const won=purchase.type==='won',final=hasFinalDelivery(delivery);
 return <Sheet className={`purchase-sheet${won?' won-sheet':''}`} title={won?'You won!':'It’s yours!'} onClose={onClose}>
  <div className="win-burst" aria-hidden="true"><span className="win-trophy">★</span>{won&&Array.from({length:12},(_,i)=><i key={i} style={{'--i':i}}/>)}</div>
  <div className="purchase-item"><span>{purchase.name}{purchase.quantity>1?` × ${purchase.quantity}`:''}</span><strong>{naira(purchase.amount)}</strong><small>Paid from your wallet ✓</small></div>
  {final?<p className="purchase-delivery">Final delivery: {naira(delivery.fee)}. {settlementText(delivery) || (delivery.status==='awaiting_payment'?'Open Orders to pay the remaining delivery amount.':'')}</p>:<p className="purchase-delivery">{ended?'Pricing your final parcel. It will appear here and in Orders. ':''}{estimate?.available?deliveryEstimateText(estimate.amount):'One parcel per show; final delivery is priced when the show ends.'}{purchase.deposit?` · ${naira(purchase.deposit)} held for delivery`:''}</p>}
  {ended?<Link to="/orders" className="btn">View orders</Link>:<button type="button" className="btn" onClick={onClose}>Keep watching</button>}
  <div className="purchase-links">{!ended&&<Link to="/orders" className="link">View order</Link>}{!following&&hasHost&&<button type="button" className="link" onClick={onFollow}>Follow host</button>}</div>
 </Sheet>;
}
