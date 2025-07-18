const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Query = require('../src/models/Query');
require('../src/models/coreModels/Setting'); // Ensure Setting model is registered

describe('Query API', () => {
  let server;
  let queryId;
  let noteId;

  beforeAll(async () => {
    server = app.listen(4001);
    await Query.deleteMany({});
  });

  afterAll(async () => {
    await Query.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  it('should create a new query', async () => {
    const res = await request(server)
      .post('/api/queries')
      .send({
        customerName: 'Test Customer',
        description: 'Test Description',
        status: 'Open',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.customerName).toBe('Test Customer');
    queryId = res.body._id;
  });

  it('should get all queries (paginated)', async () => {
    const res = await request(server).get('/api/queries?page=1&limit=10');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should add a note to a query', async () => {
    const res = await request(server)
      .post(`/api/queries/${queryId}/notes`)
      .send({ text: 'Test Note' });
    expect(res.statusCode).toBe(201);
    expect(res.body.text).toBe('Test Note');
    noteId = res.body._id;
  });

  it('should delete a note from a query', async () => {
    const res = await request(server)
      .delete(`/api/queries/${queryId}/notes/${noteId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should update a query', async () => {
    const res = await request(server)
      .put(`/api/queries/${queryId}`)
      .send({ status: 'Closed' });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('Closed');
  });
});
