require('module-alias/register');
const request = require('supertest');
const app = require('../src/app'); // Your Express app
const mongoose = require('mongoose');

let queryId = '';
let noteId = '';
let body = {};
// import environmental variables from our variables.env file
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

let token;
beforeAll(async () => {
  await mongoose.connect(process.env.DATABASE);
  const loginRes = await request(app).post('/api/login').send({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  token = loginRes.body.result.token;
}, 10000);

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Query Management API', () => {
  it('should create a new query', async () => {
    const res = await request(app)
      .post('/api/query/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        client: '6807993121d13f403543c19c',
        description: 'Test query description',
        status: 'Open',
        number: 1,
      });

    expect(res.body.success).toBe(true);
    expect(res.body.result).toHaveProperty('_id');
    queryId = res.body.result._id;
    body = res.body.result;
  });

  it('should get all queries (paginated)', async () => {
    const res = await request(app)
      .get('/api/query/list?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.result)).toBe(true);
  });

  it('should get a single query by ID', async () => {
    const res = await request(app)
      .get(`/api/query/read/${queryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.success).toBe(true);
    expect(res.body.result._id).toBe(queryId);
  });

  it('should update query status and resolution', async () => {
    const res = await request(app)
      .patch(`/api/query/update/${queryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        client: body.client,
        description: body.description,
        number: body.number,
        status: 'InProgress',
        resolution: 'We are working on it',
      });

    expect(res.body.success).toBe(true);
    expect(res.body.result.status).toBe('InProgress');
  });

  it('should add a note to the query (via update)', async () => {
    const updatedNotes = [...body.notes, { text: 'Initial note' }];

    // 2. Update the query with new note added
    const updateRes = await request(app)
      .patch(`/api/query/update/${queryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        client: body.client,
        description: body.description,
        number: body.number,
        status: 'InProgress',
        notes: updatedNotes,
      });
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.result.notes.length).toBeGreaterThan(body.notes.length);

    noteId = updateRes.body.result.notes.at(-1)._id; // get the newly added note ID
  });

  it('should remove a note from the query (client-managed state)', async () => {
    // 1. Get the full query
    const getRes = await request(app)
      .get(`/api/query/read/${queryId}`)
      .set('Authorization', `Bearer ${token}`);

    const query = getRes.body.result;
    expect(query.notes.length).toBeGreaterThan(0);

    // 2. Remove the note from the notes array
    const updatedNotes = query.notes.filter((note) => note._id !== noteId);

    // 3. Send updated query back
    const updateRes = await request(app)
      .patch(`/api/query/update/${queryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        client: query.client,
        description: query.description,
        number: query.number,
        status: query.status,
        notes: updatedNotes,
      });
    console.log('updateRes', updateRes.body);

    expect(updateRes.body.success).toBe(true);
    const updated = updateRes.body.result.notes;

    // 4. Verify the note is no longer present
    const deletedNote = updated.find((n) => n._id === noteId);
    expect(deletedNote).toBeUndefined();
  });
});
