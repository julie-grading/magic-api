const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');

const mockUser = {
  email: 'test@example.com',
  password: '123456',
};

const testDeck = {
  rule_set: 'standard',
  name: 'SAMURAI DECK',
  legal: true,
};

const registerAndLogin = async (props = {}) => {
  const testUser = {
    ...mockUser,
    ...props,
  };

  const agent = request.agent(app);
  const response = await agent.post('/api/v1/users').send(testUser);
  const user = response.body;

  return [agent, user];
};

describe('backend deck route tests', () => {
  beforeEach(() => {
    return setup(pool);
  });

  it('#POST /api/v1/decks/create should create a new deck for a user', async () => {
    const [agent, user] = await registerAndLogin();
    const response = await agent.post('/api/v1/decks/create').send(testDeck);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: expect.any(String),
      uid: user.id,
      ...testDeck,
    });
  });

  it('#POST /api/v1/decks/create should return 401 if not signed in', async () => {
    const response = await request(app)
      .post('/api/v1/decks/create')
      .send(testDeck);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 401,
      message: 'You must be signed in to continue',
    });
  });

  it(`#GET /api/v1/decks/user-decks should return a list of decks for the user
    if they are signed in`, async () => {
    const [agent, user] = await registerAndLogin();
    await Promise.all([
      agent.post('/api/v1/decks/create').send(testDeck),
      agent
        .post('/api/v1/decks/create')
        .send({ ...testDeck, name: 'super deck' }),
      agent
        .post('/api/v1/decks/create')
        .send({ ...testDeck, name: 'SUPER SAMURAI DECK' }),
    ]);
    const response = await agent.get('/api/v1/decks/user-decks');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    expect(response.body[0]).toEqual({
      id: expect.any(String),
      uid: user.id,
      name: expect.any(String),
      rule_set: 'standard',
      legal: true,
    });
  });

  it('#GET /api/v1/decks/user-decks should return 401 if not signed in', async () => {
    const response = await request(app).get('/api/v1/decks/user-decks');
    expect(response.body).toEqual({
      status: 401,
      message: 'You must be signed in to continue',
    });
  });

  it('#GET /api/v1/decks should return all decks', async () => {
    const [agent] = await registerAndLogin();
    await agent.post('/api/v1/decks/create').send(testDeck);

    const response = await request(app).get('/api/v1/decks');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
  });

  it('#GET /api/v1/decks/:id should return a specific deck', async () => {
    const [agent] = await registerAndLogin();
    await agent.post('/api/v1/decks/create').send(testDeck);

    const response = await request(app).get('/api/v1/decks/1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ...testDeck,
      id: '1',
      uid: expect.any(String),
    });
  });

  it('#PUT /api/v1/decks/:id updates a users deck', async () => {
    const [agent] = await registerAndLogin();
    const sendDeck = await agent.post('/api/v1/decks/create').send(testDeck);
    expect(sendDeck.status).toBe(200);

    const response = await agent
      .put(`/api/v1/decks/${sendDeck.body.id}`)
      .send({ name: 'Ninja Deck' });
    console.log('test ------>', response.body);
    expect(response.status).toBe(200);
    expect(response.body.name).toEqual('Ninja Deck');
  });

  it.only('#DELETE /api/v1/decks/:id deletes a users deck', async () => {
    const [agent] = await registerAndLogin();
    const sendDeck = await agent.post('/api/v1/decks/create').send(testDeck);
    expect(sendDeck.status).toBe(200);

    let response = await agent.delete(`/api/v1/decks/${sendDeck.body.id}`);
    expect(response.status).toBe(200);
    console.log('line 131', response.body);
    response = await agent.get(`/api/v1/decks/${sendDeck.body.id}`);
    console.log('line 133', response.body);
    expect(response.status).toBe(404);
  });

  afterAll(() => {
    pool.end();
  });
});
