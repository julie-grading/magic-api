const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const fetch = require('cross-fetch');

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

describe('backend-express-template routes', () => {
  beforeEach(() => {
    return setup(pool);
  });

  it(`#POST /api/v1/cards/addcard should add a card to the db if it does not exist
  and add the card to the junction table`, async () => {
    const [agent] = await registerAndLogin();
    const createDeck = await agent.post('/api/v1/decks/create').send(testDeck);
    expect(createDeck.status).toBe(200);
    let card = await fetch(
      'https://api.scryfall.com/cards/142c5b67-5de9-41da-b57f-7ce771457a3e'
    );
    card = await card.json();
    const response = await agent
      .post('/api/v1/cards/addCard/1')
      .send({ card, sideboard: true });
    console.log('test ----->', response.body);
    expect(response.status).toBe(200);
  });

  it('get a cards details', async () => {
    const [agent] = await registerAndLogin();
    const createDeck = await agent.post('/api/v1/decks/create').send(testDeck);
    expect(createDeck.status).toBe(200);
    let card = await fetch(
      'https://api.scryfall.com/cards/f295b713-1d6a-43fd-910d-fb35414bf58a'
    );
    card = await card.json();
    const response = await agent
      .post('/api/v1/cards/addCard/1')
      .send({ card, sideboard: true });
    expect(response.status).toBe(200);
    const getCard = await agent.get(
      '/api/v1/cards/f295b713-1d6a-43fd-910d-fb35414bf58a'
    );
    expect(getCard.status).toBe(200);
  });

  it.only('Should delete a card from a deck', async () => {
    const [agent] = await registerAndLogin();
    const createDeck = await agent.post('/api/v1/decks/create').send(testDeck);
    expect(createDeck.status).toBe(200);
    let card = await fetch(
      'https://api.scryfall.com/cards/142c5b67-5de9-41da-b57f-7ce771457a3e'
    );
    card = await card.json();
    const response = await agent
      .post('/api/v1/cards/addCard/1')
      .send({ card, sideboard: true });
    console.log(card);
    expect(response.status).toBe(200);
    const deleteFromDeck = await agent.delete(
      '/api/v1/cards/142c5b67-5de9-41da-b57f-7ce771457a3e/1'
    );
    expect(deleteFromDeck.status).toBe(200);
  });

  afterAll(() => {
    pool.end();
  });
});
