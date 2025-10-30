const express = require('express');
const { getLiveMatches, getLiveScore } = require('../controllers/liveScoreController');

const router = express.Router();

router.get('/live-matches', getLiveMatches);
router.get('/live-score/:matchId', getLiveScore);

module.exports = router;
