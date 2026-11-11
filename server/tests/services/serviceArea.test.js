const area = require('../../src/services/serviceArea');
describe('service area settings', () => {
  const original=process.env.SERVICE_STATES;
  afterEach(()=>{if(original===undefined)delete process.env.SERVICE_STATES;else process.env.SERVICE_STATES=original;});
  test('default Lagos and state name normalization',()=>{delete process.env.SERVICE_STATES;for(const value of ['Lagos',' Lagos State ','lagos','  LAGOS   STATE '])expect(area.inServiceArea(value)).toBe(true);expect(area.inServiceArea('Abuja')).toBe(false);expect(area.inServiceArea('')).toBe(false);});
  test('opening Ogun needs only an environment setting',()=>{process.env.SERVICE_STATES=' Lagos State , Ogun ';expect(area.allowedStates()).toEqual(['Lagos','Ogun']);expect(area.inServiceArea('ogun state')).toBe(true);expect(area.inServiceArea('Oyo')).toBe(false);});
  test('twenty LGAs and search clues include Lekki under Eti-Osa',()=>{expect(Object.keys(area.lagosAreas)).toHaveLength(20);expect(area.lagosAreas['Eti-Osa']).toContain('Lekki');expect(area.lagosAreas['Lagos Mainland']).toContain('Yaba');});
  test('buyer and seller must both have a supported address',()=>{const buyer={shippingAddresses:[{state:'Lagos'}]},seller={sellerAddress:{state:'Lagos',addressLine1:'Street'}};expect(()=>area.checkAddresses(buyer,seller)).not.toThrow();expect(()=>area.checkAddresses({shippingAddresses:[{state:'Abuja'}]},seller)).toThrow(area.ServiceAreaError);expect(()=>area.checkAddresses(buyer,{sellerAddress:{state:'Ogun'}})).toThrow(area.ServiceAreaError);});
  test('socket bid refusals use out_of_area; Lagos can continue to the wallet hold',()=>{
    const socket={emit:jest.fn()}, hold=jest.fn(), seller={sellerAddress:{state:'Lagos'}};
    for(const state of ['Abuja','Lagos']) if(area.allowBid(socket,{shippingAddresses:[{state}]},seller)) hold();
    expect(hold).toHaveBeenCalledTimes(1);expect(socket.emit).toHaveBeenCalledWith('bid_error',expect.objectContaining({code:'out_of_area',state:'Abuja'}));
  });

});
