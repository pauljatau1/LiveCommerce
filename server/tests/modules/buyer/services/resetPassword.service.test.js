jest.mock('@/services/auth/passwordReset', () => ({reset: jest.fn()}));
const engine = require('@/services/auth/passwordReset');
const service = require('@modules/buyer/services/resetPassword.service');
describe('Buyer resetPassword uses the shared hardened engine', () => {
 beforeEach(() => jest.clearAllMocks());
 test('forwards input and preserves the plain-language reply', async () => {
  const data = {email:'ada@example.test', otp:'123456', newPassword:'secure-password-123'};
  const reply = {message:'Check your inbox.'};
  engine.reset.mockResolvedValue(reply);
  expect(await service.resetPassword(data)).toEqual(reply);
  expect(engine.reset).toHaveBeenCalledWith('Buyer', data);
 });
});
