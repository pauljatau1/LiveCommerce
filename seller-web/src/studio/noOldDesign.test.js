import test from 'node:test';
import assert from 'node:assert/strict';
import { classicDashboardEnabled, studioDestination, safeStudioReturn } from '../config/featureFlags.js';
import { editorForm as raweditorForm, productPayload as rawproductPayload } from './productEditor.js';
const editorForm=(p,t)=>raweditorForm(p,t,true);
const productPayload=(f,p)=>rawproductPayload(f,p,true);


test('classic dashboard defaults off, with explicit rollback opt-in', () => {
  for (const value of [undefined,'','false','0']) assert.equal(classicDashboardEnabled({ VITE_CLASSIC_DASHBOARD: value }), false);
  for (const value of ['true','1','TRUE']) assert.equal(classicDashboardEnabled({ VITE_CLASSIC_DASHBOARD: value }), true);
});
test('every legacy section and nested route has a studio destination', () => {
  for(const [section,to] of [['products','products'],['orders','orders'],['earnings-payouts','money'],['settings','me'],['live-streams','shows']]) {
    for(const suffix of ['', '/', '/nested/id']) assert.equal(studioDestination(`/dashboard/${section}${suffix}`), `/studio/${to}`);
  }
  for(const path of ['/dashboard','/dashboard/home','/dashboard/blips','/dashboard/help','/dashboard/returns/id']) assert.equal(studioDestination(path), '/studio');
});
test('login return cannot escape studio', () => {
  for (const path of ['https://evil.test','//evil.test','/dashboard/home','/studio-evil']) assert.equal(safeStudioReturn(path), '/studio');
  assert.equal(safeStudioReturn('/studio/products/p1/edit?x=1'), '/studio/products/p1/edit?x=1');
});
test('edit preserves HTML, all variant levels, photos and shipping through the classic API', () => {
  const p = { name:'Adire gown', description:'<p>Hand dyed <strong>cotton</strong></p>', price:15000, stock:5, category:'Women', subCategory:'Dresses', sku:'A01', upc:'12345', images:[{url:'https://cdn.test/gown.jpg',isDefault:true}], variants:[{ _id:'v',name:'Colour',value:'Blue',totalStock:5,images:[{data:'https://cdn.test/blue.jpg'}],subVariants:[{name:'Size',value:'M',stock:3,subSubVariants:[{name:'Length',value:'Long',sku:'long',stock:3,images:[]}]}]}], shippingInfo:{weight:{value:500,unit:'g'},dimensions:{length:20,width:12,height:5},freeShipping:true,shippingClass:'express'}, colourVariants:['Blue'], colourQuantities:[{colour:'Blue',quantity:5}], fabric:'Adire',localStyle:'Bubu' };
  const payload=productPayload(editorForm(p),p);
  assert.equal(payload.description,p.description);assert.equal(payload.weight,.5);assert.equal(payload.images[0].data,p.images[0].url);
  assert.deepEqual(payload.variants,p.variants.map(v=>({...v,images:v.images.map(i=>({...i,contentType:'image/jpeg'})),subVariants:v.subVariants.map(s=>({...s,images:[],subSubVariants:s.subSubVariants.map(ss=>({...ss,images:[]}))}))})));
  assert.deepEqual(payload.colourQuantities,p.colourQuantities);assert.equal(payload.sku,'A01');assert.equal(payload.shippingInfo.freeShipping,true);assert.equal(payload.shippingInfo.shippingClass,'express');
});
test('listing hand-off carries proof, strips data prefix and keeps colour stock authoritative', () => {
  const p={fromDraft:true,draftProof:'signed',name:'Gown',price:12000,stock:4,images:[{url:'data:image/png;base64,YWJj'}],colourVariants:['Blue'],colourQuantities:[{colour:'Blue',quantity:4}]};
  let f=editorForm(p), payload=productPayload(f,p);assert.equal(payload.draftProof,'signed');assert.equal(payload.images[0].data,'YWJj');assert.deepEqual(payload.colourQuantities,p.colourQuantities);
  f.stock=7;assert.deepEqual(productPayload(f,p).colourQuantities,p.colourQuantities);assert.equal(productPayload(f,p).stock,4);
});
