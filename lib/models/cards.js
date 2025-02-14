const pool = require('../utils/pool');
const { buildQuery } = require('../utils/utils');

module.exports = class Card {
  // bulkInsert is a slightly more standard naming convention here
  static async bulkInsert(data) {
    const [valueString, arr] = buildQuery(data);
    const { rows } = await pool.query(
      `
      INSERT INTO decks_cards
      (uid, deck_id, sk_id, type_line, name, sideboard)
      VALUES 
      ${valueString}
      RETURNING *
      `,
      arr
    );

    if (!rows[0]) return null;
    return rows;
  }

  static async getByID(sk_id) {
    const { rows } = await pool.query(
      `
    SELECT * FROM mtg_cards
    WHERE sk_id = $1`,
      [sk_id]
    );
    if (!rows[0]) return null;
    return new Card(rows[0]);
  }

  static async getAll() {
    const { rows } = await pool.query(`
    SELECT * FROM mtg_cards`);
    if (!rows[0]) return null;
    return rows.map((row) => new Card(row));
  }

  static async addToDeck(uid, deckID, skID, isSideboard) {
    const { rows } = await pool.query(
      `INSERT INTO decks_cards (uid, deck_id, sk_id, sideboard)
        VALUES ($1, $2, $3, $4) returning *`,
      [uid, deckID, skID, isSideboard]
    );
    return rows[0];
  }

  static async deleteFromDeck(sk_id, deck_id) {
    const { rows } = await pool.query(
      `
        DELETE from decks_cards
        WHERE sk_id=$1 AND deck_id=$2 
        RETURNING *
        `,
      [sk_id, deck_id]
    );
    return rows;
  }

  static async deleteAllFromDeck(deckId) {
    const { rows } = await pool.query(
      `DELETE from decks_cards
      WHERE deck_id = $1
      RETURNING *
      `,
      [deckId]
    );
    return rows;
  }
};
