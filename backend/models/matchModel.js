const pool = require('../config/db');

async function getMatches(status) {
  let query = 'SELECT * FROM matches';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY match_date DESC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function getMatchById(id) {
  const [rows] = await pool.query('SELECT * FROM matches WHERE id = ?', [id]);
  return rows[0];
}

async function createMatch(matchData) {
  const {
    team1,
    team2,
    venue,
    match_date,
    status = 'upcoming',
    score_team1 = null,
    score_team2 = null,
    winner = null,
    player_of_match = null
  } = matchData;

  const [result] = await pool.query(
    `INSERT INTO matches (team1, team2, venue, match_date, status, score_team1, score_team2, winner, player_of_match)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [team1, team2, venue, match_date, status, score_team1, score_team2, winner, player_of_match]
  );

  return getMatchById(result.insertId);
}

async function updateMatch(id, matchData) {
  const allowedFields = [
    'team1',
    'team2',
    'venue',
    'match_date',
    'status',
    'score_team1',
    'score_team2',
    'winner',
    'player_of_match'
  ];

  const setClauses = [];
  const values = [];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(matchData, field)) {
      setClauses.push(`${field} = ?`);
      values.push(matchData[field]);
    }
  });

  if (!setClauses.length) {
    throw new Error('No valid fields provided for update');
  }

  values.push(id);

  const query = `UPDATE matches SET ${setClauses.join(', ')} WHERE id = ?`;

  const [result] = await pool.query(query, values);

  if (result.affectedRows === 0) {
    return null;
  }

  return getMatchById(id);
}

async function deleteMatch(id) {
  const [result] = await pool.query('DELETE FROM matches WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  getMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch
};
