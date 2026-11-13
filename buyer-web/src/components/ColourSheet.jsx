import {useState} from 'react';
import {Sheet} from './ui';
import {naira} from '../api';
import {priceOf} from './watch';
export default function ColourSheet({item,onBuy,onClose,busy=false,error=''}){
 const swatch=name=>/indigo|blue|purple/i.test(name)?'var(--accent)':/rust|red|orange|brown/i.test(name)?'var(--warm)':/green/i.test(name)?'var(--primary)':'var(--surface-sunken)';
 const rows=item.product?.colourQuantities || [],[colour,setColour]=useState(item.product?.colour || rows.find(c=>c.quantity>0)?.colour || ''),[quantity,setQuantity]=useState(1);
 const selected=rows.find(c=>c.colour===colour),limit=Math.min(10,selected?.quantity || 0);
 return <Sheet className="colour-sheet" title={item.product?.colour?item.product.name.slice(0,-(item.product.colour.length+3)):item.product?.name} onClose={onClose}>
  <div className="wallet-available"><span>Colour</span><strong>{naira(priceOf(item))}</strong></div>
  <div role="group" aria-label="Choose a colour">{rows.map(c=><button type="button" key={c.colour} className={`colour-option${colour===c.colour?' selected':''}`} disabled={c.quantity<=0} aria-pressed={colour===c.colour} onClick={()=>{setColour(c.colour);setQuantity(1);}}><span className="colour-swatch" style={{background:swatch(c.colour)}} aria-hidden="true">{c.image&&<img src={c.image} alt=""/>}</span><span>{c.quantity?c.colour:<s>{c.colour}</s>}</span><small>{c.quantity?`${c.quantity} left`:'Sold out'}</small></button>)}</div>
  <div className="colour-quantity"><span>Quantity</span><button type="button" className="ib" aria-label="One fewer" disabled={quantity<=1} onClick={()=>setQuantity(q=>q-1)}>−</button><span aria-live="polite">{quantity}</span><button type="button" className="ib" aria-label="One more" disabled={quantity>=limit} onClick={()=>setQuantity(q=>q+1)}>+</button></div>
  {error&&<p className="err" role="alert">{error}</p>}<button type="button" className="btn two-line" disabled={!limit || busy} onClick={()=>onBuy(colour,quantity)}><span>Buy · {naira(priceOf(item)*quantity)}</span><small>Paid from your wallet</small></button>
 </Sheet>;
}
