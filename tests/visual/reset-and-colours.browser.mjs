// Render the real router and forms with invented API data. No accounts or live credentials.
import assert from 'node:assert/strict';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.SELLER_TEST_URL || 'http://127.0.0.1:5174',out=process.env.SCREENSHOT_DIR || 'docs/screenshots/reset-and-colours';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="240"><rect width="200" height="240" fill="#294b70"/><path d="M30 0L100 70 50 160 130 240M160 0L100 70 150 160 70 240" stroke="#abcbdc" fill="none" stroke-width="18"/></svg>');
const me={createdAt:'2026-01-01T00:00:00Z',_id:'seller',firstName:'Sade',lastName:'Test',email:'sade@example.test',storeName:'Sade’s Studio',aboutStore:'Nigerian fabrics, everyday favourites.',phoneNumber:'08031234567',accountType:'individual',hasFilledAddress:true,hasFilledBusinessAddress:true,isVerified:true,emailVerified:true,categories:['Women'],sellerAddress:{state:'Lagos',city:'Lekki',addressLine1:'12 Test Street'},bankDetails:{bankName:'Test Bank',accountNumber:'0123456789',bankIdentifierCode:'001',bankAccountType:'Savings',accountName:'SADE TEST'}};
const product={_id:'p0',name:'Adire Bubu Gown, Indigo',description:'<p>Hand-dyed cotton with flowing sleeves.</p>',price:11000,stock:12,status:'active',condition:'New with tags',category:'Women',subCategory:'Dresses',fabric:'Adire',localStyle:'Bubu',tags:['adire','bubu'],images:[{url:image}],weight:.5,colourVariants:['Blue and white','Purple and beige'],colourQuantities:[{colour:'Blue and white',quantity:5},{colour:'Purple and beige',quantity:7}],variants:[],sku:'AD01'};
const calls=[],results={},errors=[];
const fonts=await Promise.all(['Nunito','Fredoka'].map(async f=>[f,`data:font/woff2;base64,${(await readFile(new URL(`./fonts/${f.toLowerCase()}.woff2`,import.meta.url))).toString('base64')}`]));
async function page({signed=true,missingPickup=false,preview=null,origin=base}={}){
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(({me,signed})=>{if(signed){localStorage.setItem('sellerToken',JSON.stringify({data:'test-token',isVerified:true}));localStorage.setItem('seller',JSON.stringify(me));}}, {me:{...me,hasFilledAddress:!missingPickup},signed});
 await p.route('**/*',async r=>{const u=new URL(r.request().url()),path=u.pathname,method=r.request().method();
  if(path.includes('@tanstack_react-query-devtools')) return r.fulfill({contentType:'application/javascript',body:'export const ReactQueryDevtools=()=>null;'});
  if(preview === 'error' && path.startsWith('/src/studio/Help.jsx')) return r.fulfill({contentType:'application/javascript',body:"export default function Help(){throw new Error('Fixture route error')}"});
  if(preview === 'loader' && path.endsWith('/sellers/profile')) { await new Promise(resolve=>setTimeout(resolve,10000)); try { return await r.fulfill({json:{data:me}}); } catch { return; } }
  if(path.startsWith('/api/')){
   calls.push({path,method,body:r.request().postDataJSON()});let json={};
   if(path.endsWith('/watch/config'))json={serviceArea:{states:['Lagos'],areas:{Lagos:{'Lagos Mainland':['Yaba','Lekki']}}}};
   else if(path.endsWith('/sellers/profile'))json={data:{...me,hasFilledAddress:!missingPickup}};
   else if(path.endsWith('/sellers/login')||path.endsWith('/sellers/register')||path.endsWith('/sellers/google-auth'))json={data:{user:me,token:'test-token'}};
   else if(path.endsWith('/banks/verify'))json={data:{accountName:'SADE TEST'}};
   else if(path.endsWith('/banks'))json={data:[{name:'Test Bank',code:'001'},{name:'Another Bank',code:'002'}]};
   else if(path.endsWith('/public/categories'))json=[{name:'Women',subCategories:['Dresses','Tops']},{name:'Men',subCategories:['Shirts']}];
   else if(path==='/api/products/p0')json=method==='GET'?product:{_id:'p0'};
   else if(path==='/api/products')json={_id:'p0'};
   else if(path.endsWith('/studio/products/p0'))json={product:{...product,images:[image]},shows:[]};
   else if(path.endsWith('/studio/products'))json={products:[{...product,image,images:[image]}],counts:{all:1,ready:1,in_show:0,sold_out:0,hidden:0}};
   else if(path.endsWith('/studio/money'))json={ready:84500,pending:20000,requested:0,bank:{bankName:'Test Bank',last4:'6789',accountName:'SADE TEST'},activity:[]};
   else if(path.endsWith('/studio/notifications'))json={items:[],unread:0};
   else if(path.endsWith('/studio/slot'))json={slot:null};
   else if(path.endsWith('/studio/home'))json={productCount:1,readyForShow:1,toShip:0,nextShow:null,lastShow:null,recent:[],money:{ready:84500,pending:20000}};
   else if(path.endsWith('/studio/onboarding'))json={store:{done:true,storeName:me.storeName,aboutStore:me.aboutStore,categories:['Women']},pickup:{done:!missingPickup,...me.sellerAddress,phone:me.phoneNumber},bank:{done:true},ready:!missingPickup};
   else if(path.endsWith('/orders/states'))json={data:[{name:'Lagos',isoCode:'LA'}]};
   else if(path.endsWith('/orders/cities/LA'))json={data:[{name:'Lekki'}]};
   else if(path.endsWith('/deliveries/seller'))json={deliveries:[],sandbox:true};
   else if(path.endsWith('/studio/shows'))json={shows:[]};
   return r.fulfill({json});
  }
  if(u.origin!==origin)return r.fulfill({body:'',contentType:'text/plain'});
  return r.continue();
 });return p;
}
async function shot(p,name,phase='after'){
 await p.addStyleTag({content:'button[aria-label="Open Tanstack query devtools"]{display:none!important}'});
 await p.evaluate(async fonts=>{for(const [family,url]of fonts){const f=await new FontFace(family,`url(${url})`,{weight:'100 900'}).load();document.fonts.add(f)}await document.fonts.ready},fonts);
 if(name.includes('colours')) await p.locator('#pe-colours').scrollIntoViewIfNeeded();
 else await p.evaluate(()=>window.scrollTo(0,0));
 await p.waitForTimeout(100);
 await mkdir(`${out}/${phase}`,{recursive:true});await p.screenshot({path:`${out}/${phase}/${name}.png`,fullPage:false});
 results[`${phase}/${name}`]={url:new URL(p.url()).pathname,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};console.log('Captured',phase,name);
}
try {
 const p=await page({signed:false});
 await p.goto(base+'/forgot-password');
 await p.getByLabel('Email',{exact:true}).fill('sade@example.test');
 await p.getByRole('button',{name:'Send code',exact:true}).click();
 await p.getByLabel('Digit 6',{exact:true}).waitFor();
 assert.equal(await p.locator('.code-boxes input').count(),6);
 await p.getByLabel('Digit 1',{exact:true}).evaluate(el=>{const data=new DataTransfer(); data.setData('text/plain','123456');el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));});
 assert.deepEqual(await p.locator('.code-boxes input').evaluateAll(els=>els.map(el=>el.value)),['1','2','3','4','5','6']);
 await shot(p,'reset-six-boxes');
 await p.getByLabel('New password',{exact:true}).fill('new-password-123');
 await p.getByRole('button',{name:'Change password',exact:true}).click();
 await p.getByRole('heading',{name:'Password changed',exact:true}).waitFor();
 assert(calls.some(c=>c.path.endsWith('/reset-password')&&c.body.code==='123456'));
 await p.close();
 for(const query of ['?email=sade%40example.test&code=123456','?token=example-link-token']) {
  const link=await page({signed:false});await link.goto(base+'/forgot-password'+query);
  await link.getByLabel('New password',{exact:true}).fill('linked-password-123');
  await link.getByRole('button',{name:'Change password',exact:true}).click();
  await link.getByRole('heading',{name:'Password changed',exact:true}).waitFor();await link.close();
 }
 for(const draft of [true,false]) {
  const e=await page();
  if(draft) await e.addInitScript(d=>history.replaceState({...history.state,usr:{listingDraft:d}},''),{...product,fromDraft:true,draftProof:'signed-proof'});
  await e.goto(base+(draft?'/studio/products/new':'/studio/products/p0/edit'));
  await e.getByRole('textbox',{name:'Colour name',exact:true}).nth(1).waitFor();
  assert.equal(await e.getByRole('textbox',{name:'Blue and white in stock',exact:true}).inputValue(),'5');
  assert.equal(await e.locator('#pe-sku').count(),0);
  await e.getByRole('textbox',{name:'Blue and white in stock',exact:true}).fill('9');
  await e.getByRole('button',{name:'Remove Purple and beige',exact:true}).click();
  await e.getByRole('button',{name:'Add colour',exact:true}).click();
  await e.getByRole('textbox',{name:'Colour name',exact:true}).nth(1).fill('Green and gold');
  await e.getByRole('textbox',{name:'Green and gold in stock',exact:true}).fill('4');
  await e.locator('#pe-colours').scrollIntoViewIfNeeded();
  await shot(e,draft?'listing-agent-colours':'saved-product-colours');
  await e.getByRole('button',{name:draft?'Save product':'Save changes',exact:true}).click();
  await e.waitForURL('**/studio/products/p0');
  const saved=calls.findLast(c=>c.path===(draft?'/api/products':'/api/products/p0')&&c.method===(draft?'POST':'PUT')).body;
  assert.equal(saved.stock,13);assert.deepEqual(saved.colourVariants,['Blue and white','Green and gold']);
  assert.deepEqual(saved.colourQuantities,[{colour:'Blue and white',quantity:9},{colour:'Green and gold',quantity:4}]);
  if(draft)assert.equal(saved.draftProof,'signed-proof');
  await e.close();
 }
 const help=await page();await help.goto(base+'/studio/help');
 await help.getByText('What about returns?',{exact:true}).click();await help.getByText('[RETURNS POLICY – TO BE CONFIRMED]',{exact:true}).waitFor();
 await help.getByText('What are the fees?',{exact:true}).click();await help.getByText('[SELLER FEES – TO BE CONFIRMED]',{exact:true}).waitFor();await help.close();
 assert.deepEqual(errors,[]);
 assert(Object.values(results).every(v=>!v.overflow),'Horizontal overflow');
 await writeFile(`${out}/checks.json`,JSON.stringify({results,calls:calls.filter(c=>c.method!=='GET')},null,2));
 console.log('PASS six boxes, paste, code and token links, draft and saved colour editing, total stock, Help placeholders');
} finally {await browser.close();}
