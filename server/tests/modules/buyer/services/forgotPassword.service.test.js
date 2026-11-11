jest.mock('@/services/auth/passwordReset', () => ({issue: jest.fn()}));
const engine = require('@/services/auth/passwordReset');
const service = require('@modules/buyer/services/forgotPassword.service');
describe('Buyer forgotPassword uses the shared hardened engine', () => {
 beforeEach(() => jest.clearAllMocks());
 test('forwards input and preserves the plain-language reply', async () => {
  const data = {email:'ada@example.test', otp:'123456', newPassword:'secure-password-123'};
  const reply = {message:'Check your inbox.'};
  engine.issue.mockResolvedValue(reply);
  expect(await service.forgotPassword(data)).toEqual(reply);
  expect(engine.issue).toHaveBeenCalledWith('Buyer', 'ada@example.test');
 });
});
