const express = require(`express`);
const router = express.Router();

const User = require(`../models/user.model.js`);

// Data for Wall of Fame board.
router.get(`/wall_of_fame`, async (req, res) => {
    if (!req.isAuthenticated()) {
        let loginArray = [
            {
                playerName: `Log in to view wall of fame`,
                clan: ``,
                highscore: ``
            }
        ];
        return res.jsonp(loginArray);
    }

    let playerDocs = await User.find({}).sort({
        highscore: -1
    }).limit(50);

    let wofPlayers = [];
    for (const player of playerDocs) {
        wofPlayers.push({
            playerName: player.username,
            clan: player.clan ? player.clan : ``,
            highscore: player.highscore
        });
    }
    return res.jsonp(wofPlayers);
});

module.exports = router;
