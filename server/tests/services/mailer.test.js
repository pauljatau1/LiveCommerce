const {createMailer,plainText}=require('@/services/email/mailer');
const {authEmail}=require('@/utils/authEmail');
const input={to:'buyer@example.test',subject:'Reset your password',html:'<p>Code 123456</p>',tags:[{name:'type',value:'password-reset'}],idempotencyKey:'password-reset/challenge-1'};
function setup(changes={}) {
 let clock=0;
 const send=jest.fn().mockResolvedValue({data:{id:'resend-123'},error:null});
 const Client=jest.fn().mockImplementation(()=>({emails:{send}}));
 const sleep=jest.fn(async ms=>{clock+=ms});
 const log={info:jest.fn(),warn:jest.fn()};
 const env={APP_ENV:'staging',APP_NAME:'Test Shop',EMAIL_FROM:'onboarding@resend.dev',RESEND_API_KEY:'not-a-real-key',...changes};
 return {mailer:createMailer({Client,env,sleep,now:()=>clock,log}),send,Client,sleep,log,env};
}
test('official SDK receives sender, reply-to, idempotency key and tags; logs only safe metadata',async()=>{
 const {mailer,send,Client,log}=setup({EMAIL_REPLY_TO:'help@example.test'});
 expect(await mailer.send(input)).toEqual({id:'resend-123',provider:'resend'});
 expect(Client).toHaveBeenCalledWith('not-a-real-key');
 expect(send).toHaveBeenCalledWith(expect.objectContaining({from:'onboarding@resend.dev',to:['buyer@example.test'],replyTo:'help@example.test',text:'Code 123456',tags:input.tags}),{idempotencyKey:input.idempotencyKey});
 expect(log.info).toHaveBeenCalledWith('[email] Sent.',{type:'password-reset',domain:'example.test',provider:'resend',id:'resend-123'});
 expect(JSON.stringify(log.info.mock.calls)).not.toMatch(/123456|not-a-real-key|buyer@/);
});
test('returned Resend error fails even when the SDK promise resolves, without leaking its details',async()=>{
 const {mailer,send,log}=setup();send.mockResolvedValue({data:null,error:{statusCode:403,message:'secret-key <p>Code 123456</p>'}});
 await expect(mailer.send(input)).rejects.toThrow('We couldn’t send the email. Please try again shortly.');
 expect(JSON.stringify(log.warn.mock.calls)).not.toMatch(/secret-key|123456|<p>/);
});
test('network failure fails plainly and does not poison the queue',async()=>{
 const {mailer,send}=setup();send.mockRejectedValueOnce(new Error('network with private payload'));
 await expect(mailer.send(input)).rejects.toThrow('We couldn’t send');await expect(mailer.send(input)).resolves.toMatchObject({id:'resend-123'});
});
test('429 retries with backoff and exactly the same payload and event key',async()=>{
 const {mailer,send,sleep}=setup();send.mockResolvedValueOnce({data:null,error:{statusCode:429}});
 await mailer.send(input);expect(send).toHaveBeenCalledTimes(2);expect(send.mock.calls[0]).toEqual(send.mock.calls[1]);expect(sleep).toHaveBeenCalledWith(500);
});
test('repeated 429 stops after three retries',async()=>{
 const {mailer,send}=setup();send.mockResolvedValue({error:{name:'rate_limit_exceeded'}});
 await expect(mailer.send(input)).rejects.toThrow('We couldn’t send');expect(send).toHaveBeenCalledTimes(4);
});
test('concurrent bulk calls are spaced below ten requests per second',async()=>{
 const {mailer,sleep,send}=setup();await Promise.all(Array.from({length:12},(_,i)=>mailer.send({...input,idempotencyKey:`password-reset/${i}`})));
 expect(send).toHaveBeenCalledTimes(12);expect(sleep.mock.calls.filter(([ms])=>ms===110)).toHaveLength(11);
});
test('missing config warns once with names, fails without an SDK call, and shows missing health',async()=>{
 const {mailer,send,log}=setup({RESEND_API_KEY:'',EMAIL_FROM:''});mailer.checkConfig();mailer.checkConfig();
 expect(mailer.configuration()).toEqual({email:'missing',redirect:false});expect(log.warn).toHaveBeenCalledTimes(1);expect(log.warn).toHaveBeenCalledWith('[email] Missing settings: RESEND_API_KEY, EMAIL_FROM.');
 await expect(mailer.send(input)).rejects.toThrow('Email is not set up');expect(send).not.toHaveBeenCalled();
});
test('staging redirects all recipients, prefixes subject and puts a safe note inside body and text',async()=>{
 const {mailer,send}=setup({EMAIL_REDIRECT_TO:'owner@example.test'});
 await mailer.send({...input,to:['a@example.test','b@example.test'],html:'<!doctype html><html><body><p>Hello</p></body></html>'});
 const message=send.mock.calls[0][0];expect(message.to).toEqual(['owner@example.test']);expect(message.subject).toBe('[to: a@example.test, b@example.test] Reset your password');expect(message.html).toMatch(/<body><p[^>]*>Staging: this was for a@example.test, b@example.test<\/p>/);expect(message.text).toMatch(/^Staging: this was for/);expect(mailer.configuration()).toEqual({email:'configured',redirect:true});
});
test('production ignores redirect, warns once and exposes no address in health',async()=>{
 const {mailer,send,log}=setup({APP_ENV:'production',EMAIL_REDIRECT_TO:'owner@example.test'});await mailer.send(input);await mailer.send(input);
 expect(send.mock.calls[0][0].to).toEqual(['buyer@example.test']);expect(send.mock.calls[0][0].subject).toBe(input.subject);expect(log.warn).toHaveBeenCalledTimes(1);expect(log.warn.mock.calls[0][0]).toMatch(/ignored in production/);expect(mailer.configuration()).toEqual({email:'configured',redirect:false});
});
test('legacy callers receive stable hashed event/id keys and a type tag',async()=>{
 const {mailer,send}=setup();const message={to:'buyer@example.test',subject:'Hello Auqli',html:'<p>Auqli code 123456</p>'};await mailer.send(message);await mailer.send(message);
 expect(send.mock.calls[0][1]).toEqual(send.mock.calls[1][1]);expect(send.mock.calls[0][1].idempotencyKey).toMatch(/^transactional\/[a-f0-9]{64}$/);expect(send.mock.calls[0][0].tags).toEqual([{name:'type',value:'transactional'}]);expect(send.mock.calls[0][0].subject).toBe('Hello Test Shop');
});
test('auth templates have plain text including code and expiry, and changed-password notice',()=>{
 for(const kind of ['verify','reset','passwordChanged']){const template=authEmail({}, {forceCurrent:true,kind,code:'123456',minutes:15,audience:'seller',email:'a@example.test'});expect(template.text).not.toMatch(/<p|<html/);expect(template.text).toMatch(kind==='passwordChanged'?/password has been changed/:/123456/);if(kind!=='passwordChanged')expect(template.text).toMatch(/15 minutes/);}
 expect(plainText('<p>Hi &amp; bye</p>')).toBe('Hi & bye');
});
test('Termii and SendGrid remain selectable; credentials do not activate another provider',async()=>{
 for(const provider of ['termii','sendgrid']){
  const sender=jest.fn().mockResolvedValue(provider==='termii'?{code:'ok',message_id:'termii-1'}:[{headers:{'x-message-id':'sg-1'}}]);
  const env={EMAIL_PROVIDER:provider,EMAIL_FROM:'sender@example.test',TERMII_API_KEY:'termii',SENDGRID_API_KEY:'sg'};
  const mailer=createMailer({env,termiiSend:sender,sendgridSend:sender,log:{info:jest.fn(),warn:jest.fn()}});
  const result=await mailer.send(input);expect(result.provider).toBe(provider);expect(sender).toHaveBeenCalledWith(expect.objectContaining({from:'sender@example.test',to:['buyer@example.test']}));
 }
});
test('unknown provider and invalid recipients do not send anything',async()=>{
 const bad=setup({EMAIL_PROVIDER:'unknown'});await expect(bad.mailer.send(input)).rejects.toThrow('Email is not set up');expect(bad.send).not.toHaveBeenCalled();
 const {mailer,send}=setup();await expect(mailer.send({...input,to:'not-an-email'})).rejects.toThrow('Enter a valid email');expect(send).not.toHaveBeenCalled();
});
test('the retained Termii transport receives scalar recipients and staging redirects the whole group',async()=>{
 const previous=process.env.TERMII_API_KEY;process.env.TERMII_API_KEY='termii-test';
 const api=require('@/config/termii');const post=jest.spyOn(api,'post').mockResolvedValue({data:{code:'ok',message_id:'termii-1'}});
 const env={EMAIL_PROVIDER:'termii',EMAIL_FROM:'sender@example.test',TERMII_API_KEY:'termii-test',APP_ENV:'staging'};
 try {
  const mailer=createMailer({env,sleep:async()=>{},log:{warn:jest.fn(),info:jest.fn()}});
  await mailer.send({...input,to:['a@example.test','b@example.test']});
  expect(post.mock.calls.map(call=>call[1].email)).toEqual(['a@example.test','b@example.test']);
  post.mockClear();env.EMAIL_REDIRECT_TO='owner@example.test';
  await mailer.send({...input,to:['a@example.test','b@example.test']});expect(post).toHaveBeenCalledTimes(1);expect(post.mock.calls[0][1]).toMatchObject({email:'owner@example.test',subject:'[to: a@example.test, b@example.test] Reset your password'});
 } finally {post.mockRestore();if(previous===undefined)delete process.env.TERMII_API_KEY;else process.env.TERMII_API_KEY=previous;}
});
test('redirected text-only mail keeps its content instead of gaining an empty HTML alternative',async()=>{
 const {mailer,send}=setup({EMAIL_REDIRECT_TO:'owner@example.test'});await mailer.send({to:'buyer@example.test',subject:'Hello',text:'Your original message.'});
 expect(send.mock.calls[0][0]).toMatchObject({to:['owner@example.test'],html:undefined,text:'Staging: this was for buyer@example.test\n\nYour original message.'});
});
