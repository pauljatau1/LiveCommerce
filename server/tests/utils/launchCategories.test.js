const {LAUNCH_CATEGORY_NAMES,launchCategories,CATALOGUE,LEGACY_CATALOGUE}=require('../../src/config/catalogue');
test('one launch list hides legacy picks without removing old categories',()=>{
 expect(LAUNCH_CATEGORY_NAMES).toEqual(['Women','Men','Thrift','Shoes','Bags','Accessories']);
 expect(CATALOGUE.flatMap(g=>g.categories.map(c=>c.name))).toEqual(LAUNCH_CATEGORY_NAMES);
 expect(launchCategories([{name:'Figures'},{name:'Women'},{name:'Game Collectibles'},{name:'Men'}])).toEqual([{name:'Women'},{name:'Men'}]);
 expect(LEGACY_CATALOGUE.flatMap(g=>g.categories).some(c=>c.name==='Figures')).toBe(true);
});
