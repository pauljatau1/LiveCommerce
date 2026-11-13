const {colourRows,colourStockUpdate}=require('@/services/productColours');
test('colour quantities and legacy variants resolve the same stock breakdown',()=>{expect(colourRows({variants:[{name:'Colour',value:'Blue',totalStock:2}]})).toEqual([{colour:'Blue',quantity:2}]);});
test('editing colours keeps total and variants in sync, including sold-out colours',()=>{
 const product={stock:7,colourVariants:['Blue','Red'],colourQuantities:[{colour:'Blue',quantity:4},{colour:'Red',quantity:3}],variants:[{name:'Colour',value:'Blue',totalStock:4},{name:'Colour',value:'Red',totalStock:3},{name:'Size',value:'M',stock:7}]};
 const next=colourStockUpdate(product,[{colour:'Blue',quantity:1},{colour:'Red',quantity:0}]);expect(next.stock).toBe(1);expect(next.variants.map(v=>v.totalStock)).toEqual([1,0,undefined]);expect(()=>colourStockUpdate(product,[{colour:'Blue',quantity:1}])).toThrow('Add stock for each colour');
});
