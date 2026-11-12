// XSS regression: real React rendering in both apps with browser HTML parsing.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 for(const [app,port,componentPath]of[['shop',5175,'/src/components/SafeDescription.jsx'],['studio',5174,'/src/studio/SafeDescription.jsx']]){
  const page=await browser.newPage({viewport:{width:390,height:844}}),base=`http://127.0.0.1:${port}`;
  const source=await(await fetch(base+(app==='shop'?'/src/components/watch.jsx':'/src/studio/Start.jsx'))).text(),react=source.match(/"([^"]*\/react\.js\?v=[a-z0-9]+)"/)[1];
  const html='<p>Soft <strong>Adire cotton</strong><br>Made in Lagos.</p><ul><li>Flowing sleeves</li></ul><img src=x onerror="window.__xss=true"><script>window.__xss=true</script><svg onload="window.__xss=true"><circle/></svg><math><mtext>hidden</mtext></math><a href="javascript:alert(1)">Ask the host</a><p style="color:red" onclick="window.__xss=true">No unsafe attributes</p>';
  const entry=`import React from '${react}';import ReactDOM from '${react.replace('react.js','react-dom_client.js')}';import Description from '${componentPath}';${app==='shop'?"import '/src/styles.css';":"import '/src/studio/base.css';import '/src/studio/studio.css';"}ReactDOM.createRoot(document.getElementById('root')).render(React.createElement('main',{className:'${app==='shop'?'app':'studio-app'}',style:{padding:20}},React.createElement('h1',null,'Adire Bubu Gown'),React.createElement(Description,{value:${JSON.stringify(html)}})));`;
  await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.pathname==='/src/main.jsx')return route.fulfill({contentType:'application/javascript',body:entry});if(url.origin!==base)return route.fulfill({body:''});return route.continue();});
  await page.goto(base);await page.locator('.product-description strong').waitFor();
  assert.equal(await page.locator('.product-description strong').textContent(),'Adire cotton');assert.equal(await page.locator('.product-description li').count(),1);
  assert.equal(await page.locator('.product-description script,.product-description img,.product-description a,.product-description svg,.product-description math,.product-description [style],.product-description [onclick]').count(),0);
  assert.equal(await page.evaluate(()=>Boolean(window.__xss)),false);assert.match(await page.locator('.product-description').innerText(),/Ask the host/);
  await mkdir('docs/screenshots/seller-profile-wipe/after',{recursive:true});await page.screenshot({path:`docs/screenshots/seller-profile-wipe/after/${app}-safe-description.png`});await page.close();
  console.log('PASS',app,'description: basic formatting, no executable HTML or attributes');
 }
}finally{await browser.close();}
