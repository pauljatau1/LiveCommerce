const { isAllowedAdminEmail } = require('../src/config/admins');
const AdminV1 = require('../src/models/Admin');
const AdminV2 = require('../src/modules/adminv2/models/admin.model');
const { isAdmin } = require('../src/middlewares/authMiddleware');

describe('admin allowlist, legacy accounts and live authorization', () => {
  const previous = process.env.ADMIN_EMAILS;
  afterEach(() => {
    if (previous === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previous;
    jest.restoreAllMocks();
  });

  test('empty allowlist denies every email in both model validators', () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAllowedAdminEmail('paul@auqli.com')).toBe(false);
    for (const Model of [AdminV1, AdminV2]) {
      expect(Model.schema.path('email').validators.find((entry) => entry.type === 'user defined').validator('paul@auqli.com')).toBe(false);
    }
  });

  test('one allowlist controls registration validators across versions', () => {
    process.env.ADMIN_EMAILS = ' chosen@example.com, SECOND@example.com ';
    for (const Model of [AdminV1, AdminV2]) {
      const validate = Model.schema.path('email').validators.find((entry) => entry.type === 'user defined').validator;
      expect(validate('CHOSEN@example.com')).toBe(true);
      expect(validate('second@example.com')).toBe(true);
      expect(validate('paul@auqli.com')).toBe(false);
    }
  });

  const request = () => ({ user: { id: 'admin-id', role: 'Admin', av: 0 } });
  const response = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });
  test('removing an email blocks its next admin request', async () => {
    process.env.ADMIN_EMAILS = 'chosen@example.com';
    jest.spyOn(AdminV1, 'findById').mockResolvedValue({
      email: 'chosen@example.com', authVersion: 0,
    });
    let res = response();
    let next = jest.fn();
    await isAdmin(request(), res, next);
    expect(next).toHaveBeenCalledTimes(1);
    process.env.ADMIN_EMAILS = '';
    res = response();
    next = jest.fn();
    await isAdmin(request(), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false, message: "This account doesn't have admin access.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('logout version change invalidates an issued session', async () => {
    process.env.ADMIN_EMAILS = 'chosen@example.com';
    jest.spyOn(AdminV1, 'findById').mockResolvedValue({
      email: 'chosen@example.com', authVersion: 1,
    });
    const res = response();
    await isAdmin(request(), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
