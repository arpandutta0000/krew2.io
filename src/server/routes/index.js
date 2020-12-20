// routes/index.js

var express = require('express');
var router = express.Router();

const loginChecker = require(`connect-ensure-login`);

// GET homepage.
router.get(`/`, (req, res, next) => {
    if (process.env.NODE_ENV == `prod` || process.env.NODE_ENV == `test-server`) return res.render(`index_dist.ejs`);
    else res.render(`index.ejs`);
});

// GET admin page.
router.get(`/admin`, loginChecker.ensureLoggedIn(), (req, res, next) => res.render(`admin.ejs`));

// GET leaderboard page.
router.get(`/leaderboard`, (req, res, next) => res.render(`leaderboard.ejs`));

module.exports = router;