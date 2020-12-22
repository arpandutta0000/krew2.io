// routes/index.js

let express = require('express');
let router = express.Router();

// GET homepage.
router.get(`/`, (req, res, next) => {
    if (process.env.NODE_ENV == `prod` || process.env.NODE_ENV == `test-server`) return res.render(`index_dist.ejs`);
    else res.render(`index.ejs`);
});

// GET admin page.
router.get(`/admin`, (req, res, next) => {
    if(!req.user) return res.redirect(`/`);
    
    let name = req.user.username;
    if(!thuglife.admins.includes(name) || !thuglife.mods.includes(name) || !thuglife.devs.includes(name)) return res.redirect(`/`);
    
    res.render(`admin.ejs`);
});

// GET leaderboard page.
router.get(`/leaderboard`, (req, res, next) => res.render(`leaderboard.ejs`));

module.exports = router;