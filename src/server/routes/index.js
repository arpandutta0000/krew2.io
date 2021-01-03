const express = require(`express`);
const router = express.Router();

let config = require(`../config/config.js`);

// GET homepage.
router.get(`/`, (req, res, next) => res.render(`index.ejs`));

// GET admin page.
router.get(`/admin`, (req, res, next) => {
    if (!req.isAuthenticated()) return res.redirect(`/`);

    let name = req.user.username;
    if (!config.admins.includes(name) && !config.mods.includes(name) && !config.devs.includes(name)) return res.redirect(`/`);

    res.send(`Nothing to see here...`);
    // res.render(`admin.ejs`);
});

// GET leaderboard page.
router.get(`/leaderboard`, (req, res, next) => res.send(`Nothing to see here...`));

router.get(`/ramen_noodle_stimulus_package`, (req, res, next) => res.redirect(`https://secret.badfirmware.com`));

module.exports = router;