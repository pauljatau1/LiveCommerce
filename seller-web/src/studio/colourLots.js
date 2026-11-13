export function colourLots(products){
 return products.flatMap(p=>p.colourQuantities?.length?p.colourQuantities.filter(c=>c.quantity>0).map(c=>({...p,_id:`${p._id}:${c.colour}`,catalogueProductId:p._id,colour:c.colour,name:`${p.name} · ${c.colour}`,stock:c.quantity,image:c.image || p.image})):p);
}
export const soldCountLabel=n=>Number(n)===1?'ITEM SOLD':'ITEMS SOLD';
