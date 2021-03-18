const express = require(`express`);
const router = express.Router();

const User = require(`../models/user.model.js`);
const Clan = require(`../models/clan.model.js`);

// Data for Wall of Fame board.
router.get(`/wall_of_fame`, async (req, res) => {

    /*
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
    */

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

// Data for Wall of Fame of clans board.
router.get(`/wall_of_fame_clans`, async (req, res) => {

    /*
    if (!req.isAuthenticated()) {
        let loginArray = [
            {
                name: `Log in to view wall of fame of clans`,
                totalScore: ``,
                owner: ``
            }
        ];
        return res.jsonp(loginArray);
    }
    */

    let clanDocs = await Clan.find({}).sort({
        totalScore: -1
    }).limit(50);

    let wofClans = [];
    for (const clan of clanDocs) {
        wofClans.push({
            name: clan.name,
            totalScore: clan.totalScore,
	    owner: clan.owner,
        });
    }
    return res.jsonp(wofClans);
});

module.exports = router;
