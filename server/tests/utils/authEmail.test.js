const { authEmail } = require('../../src/utils/authEmail');
const { buyerAppUrl, sellerAppUrl, sellerAppLink } = require('../../src/utils/helpers');
describe('app links and shared auth email', () => {
  const saved = { ...process.env };
  beforeEach(() => { process.env.APP_NAME='Sample <Studio>';process.env.EMAIL_FROM='onboarding@resend.dev';process.env.BUYER_APP_URL='https://shop.example.test/';process.env.SELLER_APP_URL='https://seller.example.test/studio/';delete process.env.CLASSIC_EMAIL_TEMPLATES; });
  afterAll(() => { process.env=saved; });
  test('origins and studio paths avoid duplicate slashes and /studio', () => { expect(buyerAppUrl()).toBe('https://shop.example.test');expect(sellerAppUrl()).toBe('https://seller.example.test');expect(sellerAppLink('/orders')).toBe('https://seller.example.test/studio/orders'); });
  test.each(['buyer','seller'])('verification and reset share the layout for %s', audience => {
    for(const kind of ['verify','reset']) {
      const result=authEmail({html:'classic',from:'Auqli <support@auqli.com>'}, {audience,kind,code:'1234',name:'Ada <script>'});
      expect(result.from).toBe('onboarding@resend.dev');expect(result.text).toContain('1234');expect(result.tags).toEqual([{name:'type',value:kind === 'reset' ? 'password-reset' : 'verification-code'}]);expect(result.subject).toContain('Sample <Studio>');expect(result.html).toContain('Sample &lt;Studio&gt;');expect(result.html).toContain('Ada');expect(result.html).not.toContain('<script>');expect(result.html).toContain('1234');expect(result.html).not.toContain('Auqli');expect(result.html).not.toContain('/dashboard');
      expect(result.html).toContain(audience === 'buyer' ? buyerAppUrl() : sellerAppLink());
    }
  });
  test('rollback returns old template only on explicit flag', () => { const legacy={html:'old',subject:'old'};process.env.CLASSIC_EMAIL_TEMPLATES='true';expect(authEmail(legacy,{code:'1234'})).toBe(legacy); });
  test('password link and welcome use the same layout without fake codes', () => {
    const reset=authEmail({}, {kind:'reset',audience:'seller',url:`${sellerAppUrl()}/forgot-password?token=abc&x=y`,minutes:60});expect(reset.html).toContain('token=abc&amp;x=y');expect(reset.html).toContain('60 minutes');
    const welcome=authEmail({}, {kind:'welcome',audience:'seller'});expect(welcome.html).toContain('/studio/start');expect(welcome.html).not.toContain('code expires');
  });
  test('seller code email and reset email match the studio design', () => {
    const code=authEmail({}, {kind:'verify',audience:'seller',code:'4827',name:'Tolu Adeyemi',store:'Thrift by Tolu'});
    expect(code.subject).toBe('Your Sample <Studio> code is 4827');expect(code.html).toContain("Here's your code, Tolu");expect(code.html).toContain('finish creating Thrift by Tolu');expect(code.html).not.toContain('<style');expect(code.html).not.toContain('<a href="https://seller.example.test/studio" style="display:inline-block');
    const reset=authEmail({}, {kind:'reset',audience:'seller',code:'3915',name:'Tolu',email:'tolu@example.test',minutes:60});
    expect(reset.subject).toBe('Reset your Sample <Studio> password');expect(reset.html).toContain('reset the password for tolu@example.test');expect(reset.html).toContain('3915');
    expect(reset.html).toContain('https://seller.example.test/forgot-password?email=tolu%40example.test&amp;code=3915');expect(reset.html).toContain('>Reset password</a>');expect(reset.html).not.toContain('<style');
    expect((reset.html.match(/<a /g)||[]).length).toBe(2);
  });
});
