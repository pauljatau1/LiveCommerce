const request = require('supertest');
const { app } = require('@/app');

describe('GET /api/v2/orders/states and /cities', () => {
  it('lists all 37 Nigerian states without calling a delivery provider', async () => {
    const res = await request(app).get('/api/v2/orders/states');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(37);
    expect(res.body.data).toContainEqual(expect.objectContaining({ name: 'Lagos', isoCode: 'LA', countryCode: 'NG' }));
  });

  it('lists Lagos areas sellers use, sorted', async () => {
    const res = await request(app).get('/api/v2/orders/cities/LA');
    expect(res.status).toBe(200);
    const names = res.body.data.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(['Ikeja', 'Lekki', 'Yaba', 'Surulere']));
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(new Set(names).size).toBe(names.length);
  });

  it('returns an empty list for an unknown state', async () => {
    const res = await request(app).get('/api/v2/orders/cities/ZZ');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
