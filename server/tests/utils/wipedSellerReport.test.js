const {report}=require('../../scripts/report-wiped-sellers');
test('report identifies lost names with activity without writing or guessing',async()=>{
 const sellers=[{_id:'lost',email:'seller@example.test'},{_id:'empty'}];
 const collections={sellers:{find:jest.fn(()=>sellers)},products:{countDocuments:jest.fn(async q=>q.seller==='lost'?2:0)},streams:{countDocuments:jest.fn(async()=>0)}};
 const result=await report({collection:name=>collections[name]});
 expect(result).toEqual([{...sellers[0],products:2,streams:0,action:expect.stringContaining('do not infer')}]);
 expect(collections.sellers.find).toHaveBeenCalledWith({$or:[{storeName:null},{storeName:''}]},expect.any(Object));
});
