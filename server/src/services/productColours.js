const colourRows=p=>p.colourVariants?.length?p.colourVariants.map(colour=>({colour,quantity:Number(p.colourQuantities?.find(c=>c.colour===colour)?.quantity ?? p.variants?.find(v=>/^colou?r$/i.test(v.name)&&v.value===colour)?.totalStock ?? 0)})):(p.variants || []).filter(v=>/^colou?r$/i.test(v.name)).map(v=>({colour:v.value,quantity:Number(v.totalStock || 0)}));
function colourStockUpdate(product,rows){
 const current=colourRows(product),names=current.map(c=>c.colour);
 if(!Array.isArray(rows)||rows.length!==names.length||new Set(rows.map(c=>c.colour)).size!==names.length||rows.some(c=>!names.includes(c.colour)||!Number.isInteger(c.quantity)||c.quantity<0||c.quantity>999))throw Object.assign(new Error('Add stock for each colour'),{status:400});
 return {stock:rows.reduce((s,c)=>s+c.quantity,0),colourVariants:names,colourQuantities:rows,variants:(product.variants || []).map(v=>/^colou?r$/i.test(v.name)?{...v,totalStock:rows.find(c=>c.colour===v.value)?.quantity ?? v.totalStock}:v)};
}
module.exports={colourRows,colourStockUpdate};
