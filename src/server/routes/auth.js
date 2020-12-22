// routes/auth.js
const express = require(`express`);
let router = express.Router();

// Authentication.
const User = require(`../models/user.model.js`);
const passport = require(`passport`);

router.post(`/login`, (req, res, next) => {
    passport.authenticate(`local`, (err, user, info) => {
        if (err) return res.status(400).json({
            errors: err
        });
        if (!user) return res.status(400).json({
            errors: `No user found`
        });

        req.logIn(user, err => {
            if (err) return res.status(400).json({
                errors: err
            });
            return res.status(200).json({
                success: `Logged in as ${user.id}`
            });
        });
    })(req, res, next);
});

router.get(`/authenticated`, (req, res, next) => {
    if (req.isAuthenticated()) return res.status(200).json({
        isLoggedIn: true,
        user: req.user
    });
    else return res.status(400).json({
        isLoggedIn: false
    });
});

module.exports = router;