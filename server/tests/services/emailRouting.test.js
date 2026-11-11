// Exercise every migrated send boundary with the original payload, without running
// payments, refunds, pickups or campaigns. The real controller expressions are used.
const fs=require('fs'),path=require('path'),vm=require('vm');
const parser=require('@babel/parser');
const sourceRoot=path.resolve(__dirname,'../../src');
const files=['controllers/returnController.js','controllers/returnControllerv2.js','controllers/messageController.js','controllers/campaignController.js','controllers/productController.js','controllers/pickupController.js','controllers/orderControllerv2.js','controllers/notificationController.js','controllers/postController.js','controllers/buyerController.js','models/Order.js'];
function nodes(source){const found=[];const ast=parser.parse(source,{sourceType:'unambiguous'});function walk(n){if(!n||typeof n!=='object')return;if(n.type==='CallExpression'&&n.callee?.object?.name==='mailer'&&n.callee.property?.name==='send')found.push(n);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(ast);return found;}
for(const file of files){const source=fs.readFileSync(path.join(sourceRoot,file),'utf8');const calls=nodes(source);
 test.each(calls.map(n=>[n.loc.start.line,source.slice(n.start,n.end)]))(`${file}:%s forwards recipients, subject and HTML to the mocked shared mailer`,async(line,expression)=>{
  const payload={to:'recipient@example.test',subject:'Original subject',html:'<p>Original HTML</p>',text:'Original text'};
  const send=jest.fn().mockResolvedValue({id:'mock-id'});
  const scope={mailer:{send},process:{env:{EMAIL_FROM:'onboarding@resend.dev'}},campaign:{_id:'campaign-1'},recipient:{buyer:{_id:'buyer-1'}},returnRequest:{buyer:{email:payload.to},seller:{email:payload.to}}};
  for(const key of ['msg','buyerEmail','sellerEmail','adminEmail','winnerEmail','slackEmailMsg','emailMsg','failedPaymentEmail','message','emailTemplate'])scope[key]={...payload};
  await vm.runInNewContext(expression,scope);
  expect(send).toHaveBeenCalledTimes(1);expect(send).toHaveBeenCalledWith(expect.objectContaining({to:payload.to,subject:payload.subject,html:payload.html,tags:expect.arrayContaining([{name:'type',value:expect.any(String)}])}));
 });
 test(`${file} has no active SendGrid SDK import or setup`,()=>{expect(source).not.toMatch(/require\(['"]@sendgrid\/mail['"]\)/);expect(source).not.toMatch(/sgMail\.(send|setApiKey)\(/);expect(calls.length).toBeGreaterThan(0);});
}
test('legacy imports and former admin/order senders enter the same mailer',async()=>{
 const mailer=require('@/services/email/mailer');const send=jest.spyOn(mailer,'send').mockResolvedValue({id:'shared-id'});
 const payload={email:'admin@example.test',subject:'Original subject',html:'<p>Original HTML</p>'};
 const bridge=require('@/services/termiiEmailService');await bridge.sendRawHTMLEmail(payload);
 await require('@/config/sendgrid').send({...payload,to:payload.email});
 expect(send).toHaveBeenCalledTimes(2);expect(send.mock.calls[0][0]).toMatchObject({to:payload.email,subject:payload.subject,html:payload.html});
 for(const file of ['controllers/adminController.js','controllers/orderController.js'])expect(fs.readFileSync(path.join(sourceRoot,file),'utf8')).toMatch(/termiiEmailService\.sendRawHTMLEmail/);
 send.mockRestore();
});
test('the Termii compatibility adapter retains its safe failure result for existing callers',async()=>{
 const mailer=require('@/services/email/mailer');const send=jest.spyOn(mailer,'send').mockRejectedValue(new Error('private request data'));
 try {expect(await require('@/services/termiiEmailService').sendRawHTMLEmail({email:'user@example.test',subject:'Update',html:'<p>Hello</p>'})).toEqual({code:'error',failed:true,message:'We couldn’t send the email. Please try again shortly.'});}finally{send.mockRestore();}
});
