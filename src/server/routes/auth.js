// routes/auth.js
const express = require(`express`);
let router = express.Router();

// Authentication.
const User = require(`../models/user.model.js`);

router.post(`/login`, (req, res, next) => {
    passport.authenticate(`local`, (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.redirect(`/`);

        req.logIn(user, err => {
            if (err) return next(err);
            return res.redirect(`/`);
        });
    })(req, res, next);
});

router.post(`/register`, (req, res, next) => {
    if (!req.username || !req.password) return;
    User.register({
        username: req.username, 
        password: req.password,
        active: false
    }, req.username);
});

module.exports = router;