const {normalisePhone,storedPhone,internationalPhone}=require('../../src/utils/phone');
const Seller=require('../../src/models/Seller'),Buyer=require('../../src/models/Buyer');
describe('canonical Nigerian phones',()=>{
 test.each(['08031234567','0803 123 4567','8031234567','+2348031234567','2348031234567','(0803)-123-4567'])('normalises %s',value=>expect(normalisePhone(value)).toBe('08031234567'));
 test.each(['081085565429','+18031234567','abc08031234567','0803','',null])('rejects %s without truncation',value=>expect(normalisePhone(value)).toBeNull());
 test('provider form and database setters share normalization',()=>{
  expect(internationalPhone('8031234567')).toBe('+2348031234567');
  const seller=new Seller({phoneNumber:'+2348031234567',warehouseDetails:{contactNumber:'8031234567'}});
  const buyer=new Buyer({phoneNumber:'8031234567',shippingAddresses:[{phoneNumber:'+2348031234567'}]});
  expect(seller.phoneNumber).toBe('08031234567');expect(seller.warehouseDetails.contactNumber).toBe('08031234567');
  expect(buyer.phoneNumber).toBe('08031234567');expect(buyer.shippingAddresses[0].phoneNumber).toBe('08031234567');
  expect(()=>storedPhone('081085565429')).toThrow('11-digit');
 });
 test('query updates normalize phone values, GETs do not write',()=>{
  const query=Seller.updateOne({},{$set:{phoneNumber:'8031234567','warehouseDetails.contactNumber':'+2348031234567'}});
  const update=query._castUpdate(query.getUpdate());
  expect(update.$set.phoneNumber).toBe('08031234567');expect(update.$set['warehouseDetails.contactNumber']).toBe('08031234567');
 });
});
