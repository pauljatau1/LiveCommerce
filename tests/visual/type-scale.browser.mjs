// Capture real React screens with fixed, invented API data. No accounts or payments.
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const phase = process.env.CAPTURE_PHASE || 'before';
const out = process.env.SCREENSHOT_DIR || `docs/screenshots/type-scale/${phase}`;
await mkdir(out, { recursive: true });
const buyer = process.env.BUYER_TEST_URL || 'http://127.0.0.1:5175';
const seller = process.env.SELLER_TEST_URL || 'http://127.0.0.1:5174';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="480"><rect width="400" height="480" fill="#294b70"/><path d="M100 0L180 80 130 220 270 420M300 0L220 80 270 220 130 420" stroke="#d7e8f2" stroke-width="35" fill="none"/><path d="M0 200L400 200M0 360L400 360" stroke="#89acca" stroke-width="10"/></svg>');
const products = ['Adire Bubu Gown, Indigo', 'Ankara Two-Piece Set', 'Aso-Oke Gele'].map((name,i)=>({_id:`p${i}`,name,price:11000+i*5000,stock:12+i,status:'active',image,images:[image],description:'Hand-dyed cotton with flowing sleeves. Easy to wear, with a loose fit.',condition:'New with tags',category:'Women',authenticity:'official',sold:3,views:24,weightKg:.4}));
const show = {_id:'demo',title:'Friday fashion finds',status:'scheduled',type:'auction',images:[image],itemCount:3,scheduledStartTime:new Date('2026-11-13T19:00:00Z').toISOString(),link:'https://example.com/live/demo',sold:7};
const me = { _id:'seller', firstName:'Sade',lastName:'Test',storeName:'Sade’s Studio',email:'sade@example.test',aboutStore:'Nigerian prints and everyday favourites.',sellerAddress:{addressLine1:'1 Example Street',city:'Ikeja',state:'Lagos'},bankDetails:{bankName:'Test Bank',accountNumber:'1234567890'},weeklySlot:null };
const delivery = {_id:'delivery',status:'paid',show:{_id:'past',title:'Weekend edit'},seller:{_id:'seller',storeName:'Sade’s Studio'},buyer:{firstName:'Ada',area:'Lekki, Lagos'},items:[{name:products[0].name,quantity:1,image,price:11000}],itemCount:1,itemsTotal:11000,depositHeld:2450,fee:2450,courier:'Kwik',createdAt:'2026-11-10T12:00:00Z'};
const source = await (await fetch(`${seller}/src/studio/Home.jsx`)).text();
const react = source.match(/"([^"]*\/react\.js\?v=[a-z0-9]+)"/)[1];
const router = source.match(/"([^"]*\/react-router-dom\.js\?v=[a-z0-9]+)"/)[1];
const imports = ['StudioLayout','Home','Products','ProductDetail','Money','Me','Shows','Planner','Recap','GoLive','ListingAgent'].map(n=>`import ${n} from '/src/studio/${n}.jsx';`).join('');
const routes = [['','Home'],['products','Products'],['money','Money'],['me','Me']].map(([path,name])=>`h(Route,{${path?`path:'${path}'`:'index:true'},element:h(${name})})`).join(',');
const studioEntry=`import React from '${react}';import ReactDOM from '${react.replace('react.js','react-dom_client.js')}';import{BrowserRouter,Routes,Route}from '${router}';${imports}import '/src/index.css';import{GoLiveCheck}from '/src/studio/GoLive.jsx';import{Orders}from '/src/studio/Orders.jsx';const h=React.createElement;ReactDOM.createRoot(document.getElementById('root')).render(h(BrowserRouter,null,h(Routes,null,h(Route,{path:'/studio',element:h(StudioLayout)},${routes},h(Route,{path:'orders',element:h(Orders)})),h(Route,{path:'/studio/products/:id',element:h(ProductDetail)}),h(Route,{path:'/studio/shows',element:h(Shows)}),h(Route,{path:'/studio/plan',element:h(Planner)}),h(Route,{path:'/studio/recap/:id',element:h(Recap)}),h(Route,{path:'/studio/golive/:showId',element:h(GoLiveCheck)}),h(Route,{path:'/studio/list',element:h(ListingAgent)}))));`;
const metrics = {};
const fonts = await Promise.all(['Nunito','Fredoka'].map(async family => [family, `data:font/woff2;base64,${(await readFile(new URL(`./fonts/${family.toLowerCase()}.woff2`, import.meta.url))).toString('base64')}`]));
async function capture(app,path,name,ready,action) {
 const base=app==='shop'?buyer:seller;
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,permissions:['camera','microphone']});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({signedIn})=>{if(signedIn)localStorage.setItem('buyerToken','visual-mock');}, {signedIn:name!=='shop-sign-in'});
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url()),p=u.pathname;
  if(app==='studio'&&p==='/src/main.jsx')return route.fulfill({contentType:'application/javascript',body:studioEntry});
  if(app==='studio'&&p.startsWith('/src/Hooks/useIntercomVisibility'))return route.fulfill({contentType:'application/javascript',body:'export const useIntercomVisibility=()=>{}'});
  if(app==='studio'&&p.startsWith('/src/Hooks/useAuthContextV2'))return route.fulfill({contentType:'application/javascript',body:`export const useAuthContext=()=>({seller:${JSON.stringify(me)},logout(){}});`});
  if(app==='studio'&&p.startsWith('/src/util/auth'))return route.fulfill({contentType:'application/javascript',body:`export const tokenUtils={getBearerToken:()=> 'visual-mock'};export const sellerUtils={getSeller:()=>(${JSON.stringify(me)})};`});
  if(u.origin==='http://localhost:8000'){
   let json={};
   if(p.endsWith('/profile'))json={_id:'buyer',firstName:'Ada',lastName:'Test',email:'ada@example.test',phoneNumber:'08031234567',shippingAddresses:[{city:'Lekki',state:'Lagos'}]};
   else if(p.endsWith('/wallet/balance'))json={availableBalance:42500,onHoldAmount:1500,topUpMethods:{dva:true,savedCards:true}};
   else if(p.endsWith('/wallet/cards'))json={cards:[{id:'card',bank:'Test Bank',last4:'4081',expMonth:12,expYear:2035,usable:true}]};
   else if(p.endsWith('/wallet/dva'))json={status:'none'};
   else if(p.endsWith('/streams/active'))json=[{...show,status:'live',seller:me,coverImage:{url:image},viewers:['a','b']}];
   else if(p==='/api/streams')json={streams:[{...show,seller:me,coverImage:{url:image}}]};
   else if(p.endsWith('/deliveries/seller'))json={deliveries:[delivery],sandbox:false};
   else if(p==='/api/v2/deliveries')json={deliveries:[delivery,{...delivery,_id:'second',status:'in_transit'}]};
   else if(p.endsWith('/studio/home'))json={productCount:3,readyForShow:3,toShip:1,nextShow:show,lastShow:null,recent:products,money:{ready:84500,pending:21000}};
   else if(p.endsWith('/studio/products/p0'))json={product:products[0],shows:[show]};
   else if(p.endsWith('/studio/products'))json={products,counts:{all:3,ready:3,in_show:0,sold_out:0,hidden:0}};
   else if(p.endsWith('/studio/money'))json={ready:84500,pending:21000,requested:0,bank:{bankName:'Test Bank',last4:'7890'},activity:[{_id:'a',kind:'in',label:'Friday fashion finds',detail:'7 items sold',date:'2026-11-10T12:00:00Z',amount:84500}]};
   else if(p.endsWith('/studio/notifications'))json={items:[],unread:0};
   else if(p.endsWith('/studio/slot'))json={slot:null};
   else if(p.endsWith('/studio/shows/demo/recap'))json={show,minutes:42,itemsSold:7,earned:84500,buyers:4,viewers:32,deliveries:{toBook:3},sold:[{name:products[0].name,quantity:2,buyer:'Ada',area:'Lekki',amount:22000,image}],unsold:[products[2]],payout:{onTheWay:0},slot:null};
   else if(p.endsWith('/studio/shows/demo'))json={show,items:products.map(p=>({...p,productId:p._id,minBid:p.price})),sales:{count:0,amount:0}};
   else if(p.endsWith('/studio/shows'))json={shows:u.searchParams.get('status')?[{...show,status:'ended',endTime:'2026-11-10T12:00:00Z'}]:[show]};
   else if(p.endsWith('/ai/listing-draft'))json={draft:{title:products[0].name,description:products[0].description,category:'Women',subCategory:'Dresses',condition:'New with tags',fabric:'Adire',localStyle:'Bubu',confidence:{title:'high',fabric:'high',localStyle:'high'},tags:['adire','bubu','gown'],questions:[],suggestedPrice:{low:11000,high:15000}}};
   else if(p.endsWith('/public/categories'))json={categories:[{name:'Women',subCategories:['Dresses']}]};
   else if(p.endsWith('/studio/show-notes/default'))json={notes:null};
   return route.fulfill({json});
  }
  if(u.origin!==base&&!p.startsWith('/@'))return route.fulfill({body:''});
  return route.continue();
 });
 await page.goto(base+path);
 await page.getByText(ready,{exact:false}).first().waitFor();
 if(action)await action(page);
 await page.evaluate(async fonts=>{for(const [family,url]of fonts){const f=await new FontFace(family,`url(${url})`,{weight:'100 900'}).load();document.fonts.add(f);}await document.fonts.ready;},fonts);
 assert.deepEqual(errors,[],`${name} page errors`);
 metrics[name]=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,controls:[...document.querySelectorAll('.btn,.btn2,.chip,.pill,.in,.sel,.h1,.h2')].map(e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect();return{class:e.className,text:e.textContent.trim().slice(0,55),font:c.fontSize,weight:c.fontWeight,height:r.height,width:r.width};})}));
 if(name==='shop-home'||name==='studio-home') metrics[app+'-protected-live']=await page.evaluate(app=>{const root=document.createElement('div');root.className=app==='shop'?'watch':'studio-app lv';root.innerHTML=['btn','btn2','chip','qr','pill','f','h1','h2','cap','lab','hint','in'].map(c=>`<div class="${c}">Sample</div>`).join('')+'<div class="run-sheet"><div class="h2">Run</div><button class="chip">30s</button></div>';document.body.append(root);const result=[...root.querySelectorAll('*')].map(e=>{const c=getComputedStyle(e);return{class:e.className,size:c.fontSize,weight:c.fontWeight,height:c.height,minHeight:c.minHeight,padding:c.padding,border:c.borderWidth}});root.remove();return result;},app);
 await page.screenshot({path:`${out}/${name}.png`,fullPage:true});
 console.log(`Captured ${phase}: ${name}${metrics[name].overflow?' — HORIZONTAL OVERFLOW':''}`);
 await page.close();
}
try{
 await capture('shop','/','shop-home','Shop clothes live');
 await capture('shop','/orders','shop-orders','Weekend edit');
 await capture('shop','/wallet','shop-wallet','READY TO SPEND');
 await capture('shop','/signin','shop-sign-in','Sign in');
 await capture('shop','/wallet','shop-top-up','READY TO SPEND',async p=>{await p.getByRole('button',{name:'Top up',exact:true}).click();await p.getByRole('button',{name:/Top up ₦10,000/}).waitFor();});
 for(const [path,name,ready]of[['/studio','home','Friday fashion finds'],['/studio/products','products','Adire Bubu'],['/studio/products/p0','product','Adire Bubu'],['/studio/orders','orders','Ada'],['/studio/money','money','READY TO WITHDRAW'],['/studio/me','me','Sade’s Studio'],['/studio/shows','shows','Upcoming'],['/studio/plan','planner','Auction show'],['/studio/recap/demo','recap','You made'],['/studio/golive/demo','go-live','Ready to go live?'],['/studio/list','listing-agent','Camera']])await capture('studio',path,`studio-${name}`,ready);
 await capture('studio','/studio/list','studio-listing-draft','Camera',async p=>{await p.locator('input[type=file]').first().setInputFiles({name:'adire.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j2S8AAAAASUVORK5CYII=','base64')});await p.getByRole('button',{name:'Write it',exact:true}).click();await p.getByRole('group',{name:'Quantity',exact:true}).getByRole('button',{name:'1',exact:true}).click();await p.getByRole('group',{name:'Original or replica',exact:true}).getByRole('button',{name:'Original',exact:true}).click();await p.getByRole('button',{name:/Publish for/}).waitFor();});
 await writeFile(`${out}/metrics.json`,JSON.stringify(metrics,null,2));
}finally{await browser.close()}
