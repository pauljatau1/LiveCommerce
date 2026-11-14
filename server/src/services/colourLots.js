// A lot has its own stream identity. Its catalogue identity never changes.
// Plain/legacy snapshots retain their existing productId and behaviour.
const mongoose=require('mongoose');
const {coloursEnabled}=require('../config/colours');
const {colourRows}=require('./productColours');
const catalogueId=item=>item?.product?.catalogueProductId || item?.catalogueProductId || item?.product?.productId || item?.product?._id || item?.productId || item?._id;
const label=(name,colour)=>coloursEnabled()&&colour?`${name} · ${colour}`:name;
function snapshot(product,colour){
 if(!coloursEnabled())colour=undefined;
 const rows=colourRows(product),chosen=colour?rows.find(c=>c.colour===colour):null;
 if(colour&&!chosen)throw Object.assign(new Error('Choose a colour from this product.'),{status:400});
 const image=product.colourQuantities?.find(c=>c.colour===colour)?.image;
 return {productId:colour?new mongoose.Types.ObjectId():product._id,...(colour?{catalogueProductId:product._id,colour}:{}),name:label(product.name,colour),category:product.category,images:image?[{url:image},...(product.images || [])]:product.images,sku:product.sku,quantity:chosen?chosen.quantity:product.stock || 0,price:product.price,discountedPrice:product.discount?.discountedPrice,description:product.description,...(coloursEnabled()?{variants:product.variants,colourVariants:rows.map(c=>c.colour),colourQuantities:rows}:{})};
}
function stockWrite(product,colour,quantity){
 if(!coloursEnabled())return {filter:{_id:product._id,stock:{$gte:quantity}},update:{$inc:{stock:-quantity}},options:{}};
 const rows=colourRows(product);
 if(rows.length&&!rows.some(c=>c.colour===colour))throw Object.assign(new Error('Choose a colour before buying.'),{reason:'choose_colour'});
 const filter={_id:product._id,stock:{$gte:quantity}},inc={stock:-quantity};
 if(rows.length){
  // Support both canonical stock rows and older colour variants, retaining both.
  if(product.colourQuantities?.length){filter.colourQuantities={$elemMatch:{colour,quantity:{$gte:quantity}}};inc['colourQuantities.$[colour].quantity']=-quantity;}
  else {filter.variants={$elemMatch:{name:/^colou?r$/i,value:colour,totalStock:{$gte:quantity}}};}
  if(product.variants?.some(v=>/^colou?r$/i.test(v.name)&&v.value===colour))inc['variants.$[legacy].totalStock']=-quantity;
 }
 const arrayFilters=[];
 if(inc['colourQuantities.$[colour].quantity'])arrayFilters.push({'colour.colour':colour});
 if(inc['variants.$[legacy].totalStock'])arrayFilters.push({'legacy.name':/^colou?r$/i,'legacy.value':colour});
 return {filter,update:{$inc:inc},options:arrayFilters.length?{arrayFilters}:{}};
}
module.exports={catalogueId,label,snapshot,stockWrite};
