const request = require("supertest");
const app = require("../src/server");
const mongoose = require("mongoose");

describe("Query Management API - Pagination Tests", () => {
  beforeAll(async () => {
    // Connect to a test database
    await mongoose.connect("mongodb://localhost:27017/testdb", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close(); // Close the DB connection after tests
  });

  test("GET /query?page=1&limit=2 - Should return only 2 queries", async () => {
    const res = await request(app).get("/query?page=1&limit=2");
    
    expect(res.status).toBe(200);
    expect(res.body.queries).toBeInstanceOf(Array);
    expect(res.body.queries.length).toBeLessThanOrEqual(2); // Should return max 2 records
  });

  test("GET /query?page=2&limit=2 - Should return next set of results", async () => {
    const res = await request(app).get("/query?page=2&limit=2");

    expect(res.status).toBe(200);
    expect(res.body.queries).toBeInstanceOf(Array);
    expect(res.body.queries.length).toBeLessThanOrEqual(2);
  });

  test("GET /query?page=100&limit=2 - Should return empty array when no data", async () => {
    const res = await request(app).get("/query?page=100&limit=2");

    expect(res.status).toBe(200);
    expect(res.body.queries.length).toBe(0);
  });
});
