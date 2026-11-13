jest.mock('@/services/shipbubble',()=>({validateAddress:jest.fn(),isConfigured:()=>true}));
const shipbubble=require('@/services/shipbubble');
const {courierName,fullName}=require('@/utils/courierName');
const service=require('@/services/deliveryService');
test('full address name wins, then full account name; no usernames or one-word fallbacks',()=>{
 expect(courierName({name:'Ada 123 Okafor!!'},{firstName:'Bola',lastName:'Test'})).toBe('Ada Okafor');
 expect(courierName({firstName:'Ada',lastName:'Okafor'},{firstName:'Bola',lastName:'Test'})).toBe('Ada Okafor');
 expect(courierName({name:'Ada'},{firstName:'Bola',lastName:'Adeyemi'})).toBe('Bola Adeyemi');
 expect(courierName({},{username:'ada_123',firstName:'Ada'})).toBeNull();
 expect(fullName('1234 !!!')).toBeNull();expect(fullName('José Ádébáyọ̀')).toBeTruthy();
});
test('pickup uses address/account identity instead of store or username',()=>{
 expect(service.sellerPickup({storeName:'9ja Store',firstName:'Sade',lastName:'Test',warehouseDetails:{address:{name:'Bola Courier',addressLine1:'1 Test Road',state:'Lagos'}}}).name).toBe('Bola Courier');
 const buyer={firstName:'Ada',lastName:'Test',username:'ada123',shippingAddresses:[{name:'Bola Courier'}]};expect(service.buyerDropoff(buyer).name).toBe('Bola Courier');
});
test.each([['Please provide a full name (e.g John Doe), please remove all numbers and symbols','Add your full name for the courier'],['The phone number is invalid','Check the phone number'],['Address not found',"Shipbubble couldn't find that address"]])('provider rejection %s is mapped accurately',async(message,expected)=>{
 shipbubble.validateAddress.mockRejectedValueOnce(Object.assign(new Error(message),{status:400}));await expect(service.validateCourierAddress('buyer',{name:'Ada Test',phone:'08031234567',address:'12 Test Road'})).rejects.toThrow(expected);
});
test('never sends an absent name to Shipbubble; outages remain retryable',async()=>{
 shipbubble.validateAddress.mockClear();await expect(service.validateCourierAddress('buyer',{phone:'08031234567'})).rejects.toMatchObject({code:'courier_name',fixable:true});expect(shipbubble.validateAddress).not.toHaveBeenCalled();shipbubble.validateAddress.mockRejectedValueOnce(Object.assign(new Error('Service unavailable'),{status:503}));await expect(service.validateCourierAddress('buyer',{name:'Ada Test',phone:'08031234567'})).rejects.toMatchObject({status:503});
});
