const express = require(`express`);
const router = express.Router();
const config = require(`../config/config.js`);

const User = require(`../models/user.model.js`);

// GET Homepage.
router.get(`/`, (req, res, next) => res.render(`index.ejs`));

// GET Staff UI
// TODO: use more obscure path
router.get(`/staff`, (req, res, next) => {
    if (req.isAuthenticated() && (config.admins.includes(req.user.username) || config.mods.includes(req.user.username) || config.helpers.includes(req.user.username))) {
        User.findOne({
            username: req.user.username
        }).then(user => {
            if (!user) return res.redirect(`/`);
            else if (user.password !== req.user.password) return res.redirect(`/`);
            else res.render(`staffUI.ejs`);
        });
    } else return res.redirect(`/`)
});

// GET Funny page.
router.get(`/ramen_noodle_stimulus_package`, (req, res, next) => res.redirect(`https://secret.badfirmware.com`));

module.exports = router;