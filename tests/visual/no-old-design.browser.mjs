// Render the real router and forms with invented API data. No accounts or live credentials.
import assert from 'node:assert/strict';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.SELLER_TEST_URL || 'http://127.0.0.1:5174',out='docs/screenshots/no-old-design';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="240"><rect width="200" height="240" fill="#294b70"/><path d="M30 0L100 70 50 160 130 240M160 0L100 70 150 160 70 240" stroke="#abcbdc" fill="none" stroke-width="18"/></svg>');
const me={createdAt:'2026-01-01T00:00:00Z',_id:'seller',firstName:'Sade',lastName:'Test',email:'sade@example.test',storeName:'Sade’s Studio',aboutStore:'Nigerian fabrics, everyday favourites.',phoneNumber:'08031234567',accountType:'individual',hasFilledAddress:true,hasFilledBusinessAddress:true,isVerified:true,emailVerified:true,categories:['Women'],sellerAddress:{state:'Lagos',city:'Lekki',addressLine1:'12 Test Street'},bankDetails:{bankName:'Test Bank',accountNumber:'0123456789',bankIdentifierCode:'001',bankAccountType:'Savings',accountName:'SADE TEST'}};
const product={_id:'p0',name:'Adire Bubu Gown, Indigo',description:'<p>Hand-dyed cotton with flowing sleeves.</p>',price:11000,stock:12,status:'active',condition:'New with tags',category:'Women',subCategory:'Dresses',fabric:'Adire',localStyle:'Bubu',tags:['adire','bubu'],images:[{url:image}],weight:.5,variants:[],sku:'AD01'};
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
   if(path.endsWith('/sellers/profile'))json={data:{...me,hasFilledAddress:!missingPickup}};
   else if(path.endsWith('/sellers/login')||path.endsWith('/sellers/register')||path.endsWith('/sellers/google-auth'))json={data:{user:me,token:'test-token'}};
   else if(path.endsWith('/banks/verify'))json={data:{accountName:'SADE TEST'}};
   else if(path.endsWith('/banks'))json={data:[{name:'Test Bank',code:'001'},{name:'Another Bank',code:'002'}]};
   else if(path.endsWith('/public/categories'))json=[{name:'Women',subCategories:['Dresses','Tops']},{name:'Men',subCategories:['Shirts']}];
   else if(path==='/api/products/p0')json=product;
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
 await mkdir(`${out}/${phase}`,{recursive:true});await p.screenshot({path:`${out}/${phase}/${name}.png`,fullPage:true});
 results[`${phase}/${name}`]={url:new URL(p.url()).pathname,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};console.log('Captured',phase,name);
}
try{
 for(const [path,name,ready] of [['/login','login','Welcome back'],['/signup','signup','Create your store'],['/forgot-password','forgot-password','Reset your password'],['/studio/help','help','How can we help?']]){
  const p=await page({signed:false});await p.goto(base+path);await p.getByText(ready,{exact:true}).waitFor();await shot(p,name);if(name==='forgot-password'){
   await p.getByLabel('Email',{exact:true}).fill('sade@example.test');await p.getByRole('button',{name:'Send reset code',exact:true}).click();await p.getByLabel('4-digit email code').waitFor();await shot(p,'reset-code');await p.getByLabel('4-digit email code').fill('1234');await p.getByLabel('New password',{exact:true}).fill('new-password-123');await p.getByLabel('Confirm password').fill('new-password-123');await p.getByRole('button',{name:'Save new password'}).click();await p.getByText('Password changed',{exact:true}).waitFor();assert(calls.some(c=>c.path.endsWith('/seller/reset-password')&&c.body.code==='1234'));await shot(p,'reset-success');
  }await p.close();
 }
 for(const [path,name,ready] of [['/studio/products/p0/edit','edit-product','Edit product'],['/studio/profile','store-profile','Edit store profile'],['/studio/bank','bank-account','Your payout account'],['/studio/start?step=pickup','pickup-address','Pickup address'],['/studio/me','me','Edit store profile']]){
  const p=await page();await p.goto(base+path);await p.getByText(ready,{exact:true}).first().waitFor();if(name==='edit-product')await p.getByLabel('Title',{exact:true}).waitFor();await shot(p,name);
  if(name==='bank-account'){
   await p.getByRole('button',{name:'Check account name'}).click();await p.getByRole('status').filter({hasText:'SADE TEST'}).waitFor();await shot(p,'bank-verified');await p.getByLabel('Account number').fill('1123456789');await p.getByRole('button',{name:'Save bank account'}).isDisabled().then(v=>assert(v));await p.getByRole('button',{name:'Check account name'}).click();await p.getByText('SADE TEST',{exact:true}).waitFor();await p.getByRole('button',{name:'Save bank account'}).click();await p.waitForURL('**/studio/me');assert(calls.some(c=>c.path.endsWith('/profile/bank-details')&&c.body.bankDetails.accountNumber==='1123456789'&&c.body.isVerified));
  }
  if(name==='edit-product'){await p.getByLabel('Title',{exact:true}).fill('Edited Adire Bubu');await p.getByRole('button',{name:'Save product',exact:true}).click();await p.waitForURL('**/studio/products/p0');const saved=calls.findLast(c=>c.path==='/api/products/p0'&&c.method==='PUT');assert.equal(saved.body.name,'Edited Adire Bubu');assert(saved.body.description.includes('Hand-dyed'));assert.equal(saved.body.fabric,'Adire');}
  if(name==='me'){assert.equal(await p.getByText('Classic dashboard',{exact:true}).count(),0);for(const a of await p.locator('a[href]').evaluateAll(links=>links.map(a=>a.getAttribute('href'))))assert(!a.startsWith('/dashboard'));}
  await p.close();
 }
 const login=await page({signed:false});await login.goto(base+'/studio/products/p0/edit');await login.waitForURL('**/login');await login.getByLabel('Email',{exact:true}).fill('sade@example.test');await login.getByLabel('Password',{exact:true}).fill('test-password-123');await login.getByRole('button',{name:'Sign in',exact:true}).click();await login.waitForURL('**/studio/products/p0/edit');await login.close();
 const signup=await page({signed:false});await signup.goto(base+'/signup');await signup.getByLabel('Full name').fill('Sade Test');await signup.getByLabel('Store name',{exact:true}).fill('Sade’s Studio');await signup.getByLabel('Nigerian phone number').fill('08031234567');await signup.getByLabel('Email',{exact:true}).fill('sade@example.test');await signup.getByLabel('Password',{exact:true}).fill('test-password-123');await signup.getByLabel('Confirm password').fill('different');await signup.getByRole('checkbox').check();await signup.getByRole('button',{name:'Create account',exact:true}).click();await signup.getByRole('alert').filter({hasText:"Passwords don't match"}).waitFor();await signup.getByLabel('Confirm password').fill('test-password-123');await signup.getByRole('button',{name:'Create account',exact:true}).click();await signup.waitForURL('**/studio/start');assert(calls.some(c=>c.path.endsWith('/sellers/register')&&c.body.phoneNumber==='8031234567'));await signup.close();
 const handoff=await page();await handoff.addInitScript(draft=>history.replaceState({...history.state,usr:{listingDraft:draft}},''),{...product,fromDraft:true,draftProof:'signed-proof',images:[{url:'data:image/png;base64,iVBORw0KGgo='}],colourVariants:['Blue'],colourQuantities:[{colour:'Blue',quantity:12}]});await handoff.goto(base+'/studio/products/new');await handoff.getByLabel('Title',{exact:true}).waitFor();await handoff.getByRole('button',{name:'Publish product',exact:true}).click();await handoff.waitForURL('**/studio/products/p0');const published=calls.findLast(c=>c.path==='/api/products'&&c.method==='POST');assert.equal(published.body.draftProof,'signed-proof');assert.equal(published.body.colourQuantities[0].quantity,12);assert.equal(published.body.fabric,'Adire');await handoff.close();
 const profile=await page();await profile.goto(base+'/studio/profile');await profile.getByLabel('Store name',{exact:true}).fill('Sade’s New Studio');await profile.getByRole('button',{name:'Save profile',exact:true}).click();await profile.waitForURL('**/studio/me');assert(calls.some(c=>c.path==='/api/seller/store-profile'&&c.body.storeName==='Sade’s New Studio'&&c.body.categories.includes('Women')));await profile.close();
 const tokenReset=await page({signed:false});await tokenReset.goto(base+'/forgot-password?token=example-token');await tokenReset.getByLabel('New password',{exact:true}).fill('new-password-123');await tokenReset.getByLabel('Confirm password').fill('new-password-123');await tokenReset.getByRole('button',{name:'Save new password'}).click();await tokenReset.getByText('Password changed',{exact:true}).waitFor();assert(calls.some(c=>c.path.endsWith('/reset-password-with-token')&&c.body.token==='example-token'));await tokenReset.close();
 if(process.env.CLASSIC_SELLER_URL){const classic=await page({origin:process.env.CLASSIC_SELLER_URL});await classic.goto(process.env.CLASSIC_SELLER_URL+'/studio/me');await classic.getByRole('link',{name:/Classic dashboard/}).waitFor();assert.equal(await classic.getByRole('link',{name:/Classic dashboard/}).getAttribute('href'),'/dashboard/home');results.classicRollback='Classic dashboard row enabled';await classic.close();}
 const redirectPage=await page();
 for(const [section,to]of [['products','products'],['orders','orders'],['earnings-payouts','money'],['settings','me'],['live-streams','shows'],['home',''],['help',''],['other','']]){
  for(const tail of ['', '/nested/123']){const path=`/dashboard/${section}${tail}`;await redirectPage.goto(base+path);await redirectPage.waitForURL(base+'/studio'+(to?'/'+to:''));results[path]=new URL(redirectPage.url()).pathname;}
 }await redirectPage.close();
 const pickup=await page({missingPickup:true});await pickup.goto(base+'/studio/list');await pickup.waitForURL('**/studio/start?step=pickup');await pickup.getByRole('status').filter({hasText:'Add your pickup address'}).waitFor();await shot(pickup,'pickup-required-toast');await pickup.close();
 const missing=await page({signed:false});await missing.goto(base+'/missing-test-page');await missing.getByRole('link',{name:'Go to studio',exact:true}).waitFor();await shot(missing,'not-found');await missing.close();
 for(const preview of ['loader','error']){const p=await page({preview});await p.goto(base+(preview==='loader'?'/studio':'/studio/help'));await p.getByText(preview==='loader'?'Loading your studio…':'Something didn’t load',{exact:true}).waitFor();await shot(p,preview);await p.close();}
 // Capture preserved classic authentication screens from the pre-change baseline.
 if(process.env.BASELINE_SELLER_URL){for(const [path,name]of [['/login','login'],['/signup','signup'],['/forgot-password','forgot-password']]){const p=await page({signed:false,origin:process.env.BASELINE_SELLER_URL});await p.goto(process.env.BASELINE_SELLER_URL+path);await p.locator('input[type=email]').first().waitFor();await shot(p,name,'before');await p.close();}}
 assert.deepEqual(errors.filter(e=>e!=='Fixture route error'),[]);assert(Object.values(results).filter(v=>typeof v==='object').every(v=>!v.overflow),'Horizontal overflow');
 await writeFile(`${out}/checks.json`,JSON.stringify({results,calls: calls.filter(c=>c.method!=='GET')},null,2));
 console.log('All route and form checks passed.');
}finally{await browser.close()}
