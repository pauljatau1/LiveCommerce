// Explicitly exercise the retained legacy feature. Default-off cases have their own suite.
beforeEach(()=>{process.env.COLOURS='true';});
afterEach(()=>{delete process.env.COLOURS;});
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

test('off keeps a legacy product plain and uses total stock without altering rollback data',()=>{
 delete process.env.COLOURS;
 const p={_id:new mongoose.Types.ObjectId(),name:'Adire Two-Piece – Indigo',stock:5,colourVariants:['Blue'],colourQuantities:[{colour:'Blue',quantity:1}]};const before=JSON.stringify(p);
 expect(snapshot(p,'Blue')).toMatchObject({productId:p._id,name:p.name,quantity:5});expect(snapshot(p,'Blue')).not.toHaveProperty('colourVariants');
 expect(stockWrite(p,'Other',2)).toEqual({filter:{_id:p._id,stock:{$gte:2}},update:{$inc:{stock:-2}},options:{}});expect(JSON.stringify(p)).toBe(before);
});
