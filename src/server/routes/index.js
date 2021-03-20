const express = require(`express`);
const router = express.Router();
const config = require(`../config/config.js`);

const User = require(`../models/user.model.js`);

// GET Homepage.
router.get(`/`, (req, res, next) => res.render(`index.ejs`));

// GET Staff UI
// TODO: use more obscure path
router.get(`/admin`, (req, res, next) => {
    if (req.isAuthenticated() && (config.admins.includes(req.user.username) || config.mods.includes(req.user.username) || config.helpers.includes(req.user.username))) {
        User.findOne({
            username: req.user.username
        }).then((user) => {
            if (!user) return res.redirect(`../assets/video/youTried.mp4`);
            else if (user.password !== req.user.password) return res.redirect(`../assets/video/youTried.mp4`);
            else res.render(`staffUI.ejs`);
        });
    } else return res.sendStatus(418);
});

module.exports = router;
