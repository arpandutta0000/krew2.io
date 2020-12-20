// routes/api.js

const express = require(`express`);
let router = express.Router();

// Data for Wall of Fame board.
router.get(`/wall_of_fame`, async (req, res) => {
    let wofPlayers = await User.find({}).sort({
        highscore: -1
    }).limit(20);
    res.jsonp(wofPlayers);
});

module.exports = router;