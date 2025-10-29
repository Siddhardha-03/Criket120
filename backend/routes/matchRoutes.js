const express = require('express');
const matchController = require('../controllers/matchController');

const router = express.Router();

router.get('/', matchController.getMatches);
router.get('/:id', matchController.getMatch);
router.post('/', matchController.createMatch);
router.put('/:id', matchController.updateMatch);
router.delete('/:id', matchController.deleteMatch);

module.exports = router;
