import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=new URL('../../',import.meta.url);
const before=JSON.parse(await readFile(new URL('docs/screenshots/type-scale/before/metrics.json',root)));
const after=JSON.parse(await readFile(new URL('docs/screenshots/type-scale/after/metrics.json',root)));
for(const app of ['shop','studio'])assert.deepEqual(after[`${app}-protected-live`],before[`${app}-protected-live`],`${app} live controls must stay unchanged`);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const values={};
const classes=['btn','btn2','btn3','link','ib','chip','qr','pill','tab','tab-live','cap','lab','hint','in','sel','banner','toast','err','wallet-chip','dnav','bub','me','h1','h2'];
try{
 for(const [name,base,file]of [['shop','http://127.0.0.1:5175','styles.css'],['studio','http://127.0.0.1:5174','studio/studio.css']]){
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.route('https://fonts.**/*',r=>r.fulfill({body:''}));
  await page.setContent(`<link rel="stylesheet" href="${base}/src/${file}?direct"><div class="${name==='shop'?'app':'studio-app'}">${classes.map(c=>`<${['in','sel'].includes(c)?'input':'div'} class="${c}">Sample</${['in','sel'].includes(c)?'input':'div'}>`).join('')}</div>`);
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.btn')).height==='48px');
  values[name]=await page.evaluate(classes=>Object.fromEntries(classes.map(c=>{const e=document.querySelector('.'+c),s=getComputedStyle(e);return[c,{size:s.fontSize,weight:s.fontWeight,height:s.height,border:s.borderWidth}]})),classes);
  for(const [c,size,weight,height]of [['btn','15px','600','48px'],['btn2','13px','600','44px'],['btn3','13px','600','44px'],['chip','13px','600','38px'],['qr','13px','600','38px'],['pill','11px','600','22px'],['in','16px','400','48px'],['sel','16px','400','48px']])assert.deepEqual(values[name][c],{size,weight,height,border:['btn','btn3','pill'].includes(c)?'0px':'1px'},`${name} ${c}`);
  for(const c of ['chip','qr'])assert.equal(await page.locator('.'+c).evaluate(e=>{const s=getComputedStyle(e,'::after');return parseFloat(getComputedStyle(e).height)-parseFloat(s.top)-parseFloat(s.bottom)}),44);
  for(const [c,size,weight]of [['link','13px','600'],['tab','11px','600'],['tab-live','11px','600'],['cap','12px','600'],['lab','13px','600'],['hint','13px','400'],['banner','13px','600'],['toast','13px','600'],['err','13px','600'],['wallet-chip','13px','600'],['dnav','13px','600'],['bub','15px','400'],['me','15px','400'],['h1','20px','500'],['h2','17px','500']]){assert.equal(values[name][c].size,size,`${name} ${c} size`);assert.equal(values[name][c].weight,weight,`${name} ${c} weight`);}
  if(name==='studio'){
   const extras=await page.evaluate(()=>{const root=document.querySelector('.studio-app');root.insertAdjacentHTML('beforeend','<div class="money"><span>₦</span><input value="11000"></div><span class="tg">Adire</span><span class="sh-pill-tx">Message</span><button class="sh-copy">Copy</button>');return Object.fromEntries(['.money','.money input','.tg','.sh-pill-tx','.sh-copy'].map(q=>{const s=getComputedStyle(root.querySelector(q));return[q,{size:s.fontSize,weight:s.fontWeight,height:s.height}]}));});
   assert.equal(extras['.money'].height,'48px');assert.equal(extras['.money input'].size,'17px');assert.deepEqual(extras['.tg'],{size:'12px',weight:'600',height:'26px'});assert.equal(extras['.sh-pill-tx'].size,'13px');assert.equal(extras['.sh-pill-tx'].weight,'400');assert.equal(extras['.sh-copy'].size,'13px');assert.equal(extras['.sh-copy'].weight,'600');
  }
  await page.close();
 }
 for(const c of classes)assert.deepEqual(values.shop[c],values.studio[c],`${c} must match in both apps`);
 console.log('PASS: shared control parity, requested sizes/weights/heights, 16px form inputs, 44px chip tap areas, protected live styles unchanged');
}finally{await browser.close()}
