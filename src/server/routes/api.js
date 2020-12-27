// routes/api.js

const express = require(`express`);
let router = express.Router();

const User = require(`../models/user.model.js`);

// Data for Wall of Fame board.
router.get(`/wall_of_fame`, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(403);

    let playerDocs = await User.find({}).sort({
        highscore: -1
    }).limit(20);

    let wofPlayers = [];
    for (const player of playerDocs) {
        wofPlayers.push({
            playerName: player.username,
            clan: player.clan ? player.clan : ``,
            highscore: player.highscore
        });
    }
    res.jsonp(wofPlayers);
});

module.exports = router;