const matchModel = require('../models/matchModel');

async function getMatches(req, res) {
  try {
    const { status } = req.query;
    const matches = await matchModel.getMatches(status);
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Failed to fetch matches' });
  }
}

async function getMatch(req, res) {
  try {
    const { id } = req.params;
    const match = await matchModel.getMatchById(id);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ message: 'Failed to fetch match' });
  }
}

async function createMatch(req, res) {
  try {
    const match = await matchModel.createMatch(req.body);
    res.status(201).json(match);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ message: 'Failed to create match' });
  }
}

async function updateMatch(req, res) {
  try {
    const { id } = req.params;
    const updatedMatch = await matchModel.updateMatch(id, req.body);

    if (!updatedMatch) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.json(updatedMatch);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ message: 'Failed to update match' });
  }
}

async function deleteMatch(req, res) {
  try {
    const { id } = req.params;
    const deleted = await matchModel.deleteMatch(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ message: 'Failed to delete match' });
  }
}

module.exports = {
  getMatches,
  getMatch,
  createMatch,
  updateMatch,
  deleteMatch
};
