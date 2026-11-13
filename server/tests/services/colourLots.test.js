const mongoose=require('mongoose');
const {snapshot,stockWrite,catalogueId}=require('../../src/services/colourLots');
test('colour snapshots have separate lot identities, a shared catalogue, own name/photo/stock',()=>{
 const p={_id:new mongoose.Types.ObjectId(),name:'Adire',stock:3,price:13000,colourVariants:['Indigo','Rust'],colourQuantities:[{colour:'Indigo',quantity:2,image:'indigo.jpg'},{colour:'Rust',quantity:1}]};
 const a=snapshot(p,'Indigo'),b=snapshot(p,'Rust');expect(String(a.productId)).not.toBe(String(b.productId));expect(catalogueId(a)).toEqual(p._id);expect(a).toMatchObject({name:'Adire · Indigo',quantity:2,images:[{url:'indigo.jpg'}]});expect(snapshot(p).productId).toEqual(p._id);expect(()=>snapshot(p,'Blue')).toThrow('Choose a colour');
});
test('stock guard includes the selected colour and total, retaining the plain update',()=>{
 const p={_id:'p',colourVariants:['Indigo'],colourQuantities:[{colour:'Indigo',quantity:1}]};
 expect(stockWrite(p,'Indigo',1)).toMatchObject({filter:{stock:{$gte:1},colourQuantities:{$elemMatch:{colour:'Indigo',quantity:{$gte:1}}}},update:{$inc:{stock:-1,'colourQuantities.$[colour].quantity':-1}}});expect(()=>stockWrite(p,'Rust',1)).toThrow('Choose a colour');expect(stockWrite({_id:'p'},undefined,2)).toEqual({filter:{_id:'p',stock:{$gte:2}},update:{$inc:{stock:-2}},options:{}});
});
