const {areaOptions,findArea,validateArea,deliveryAddress}=require('@/services/areaDirectory');
const service=require('@/services/serviceArea');
const saved=process.env.SERVICE_STATES;
beforeEach(()=>{process.env.SERVICE_STATES='Lagos';});
afterAll(()=>{if(saved===undefined)delete process.env.SERVICE_STATES;else process.env.SERVICE_STATES=saved;});
test('canonical options preserve all LGA groups and rank popular areas',()=>{
 const rows=areaOptions('Lagos State');expect(new Set(rows.map(r=>r.lga)).size).toBe(20);expect(rows.find(r=>r.name==='Lekki')).toMatchObject({lga:'Eti-Osa',group:'Island',popularRank:0});expect(rows.find(r=>r.name==='Yaba')).toMatchObject({lga:'Lagos Mainland',group:'Mainland'});expect(rows.filter(r=>r.name==='Victoria Island')).toHaveLength(1);expect(rows.some(r=>r.name==='VI')).toBe(false);expect(service.serviceAreaConfig().areaOptions.Lagos).toEqual(rows);
});
test('validates area from source, derives LGA, canonicalises aliases and refuses unknown or mismatched areas',()=>{
 expect(validateArea({state:' lagos STATE ',city:'v.i'})).toEqual({city:'Victoria Island',lga:'Eti-Osa'});
 expect(validateArea({state:'Lagos',city:'Yaba'})).toEqual({city:'Yaba',lga:'Lagos Mainland'});
 expect(()=>validateArea({state:'Lagos',city:'Anything'})).toThrow('Choose your area from the list.');
 expect(()=>validateArea({state:'Lagos',city:'Lekki',lga:'Ikeja'})).toThrow('Choose your area from the list.');
 expect(findArea({state:'Lagos',city:'Ogba',lga:'Ikeja'})).toMatchObject({lga:'Ikeja'});
});
test('courier address includes street, optional landmark, area, LGA and state',()=>{
 expect(deliveryAddress({state:'Lagos State',city:'Lekki',lga:'Eti-Osa',addressLine1:'12 Test Street',addressLine2:'Near the gate'})).toBe('12 Test Street, Near the gate, Lekki, Eti-Osa, Lagos, Nigeria');
 expect(deliveryAddress({state:'Lagos',city:'Yaba',addressLine1:'12 Test Street'})).toBe('12 Test Street, Yaba, Lagos Mainland, Lagos, Nigeria');
});
test('old addresses without an LGA or with a legacy city still work on reads/bids',()=>{
 const buyer={shippingAddresses:[{state:'Lagos',city:'Legacy location'}]},seller={sellerAddress:{state:'Lagos',city:'Another old location'}};
 expect(()=>service.checkAddresses(buyer,seller)).not.toThrow();expect(deliveryAddress({...buyer.shippingAddresses[0],addressLine1:'12 Old Street'})).toBe('12 Old Street, Legacy location, Lagos, Nigeria');
});
