// routes/auth.js
const express = require(`express`);
let router = express.Router();

// Authentication.
const User = require(`../models/user.model.js`);
const passport = require(`passport`);

router.post(`/register`, (req, res, next) => {
    passport.authenticate(`register`, (err, user, info) => {
        if(err) return res.status(400).json({
            errors: err
        });
        if(user) return res.status(400).json({
            errors: `User already exists`
        });
                
    });
})

router.post(`/login`, (req, res, next) => {
    passport.authenticate(`login`, (err, user, info) => {
        if (err) return res.status(400).json({
            errors: err
        });
        if (!user) return res.status(400).json({
            errors: `User does not exist`
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

router.get(`/logout`, (req, res, next) => {
    if(req.isAuthenticated()) req.logOut();
    res.redirect(`/`);
});

router.get(`/authenticated`, (req, res, next) => {
    if (req.isAuthenticated()) return res.status(200).json({
        isLoggedIn: true,
        user: req.user
    });
    else return res.status(200).json({
        isLoggedIn: false
    });
});

module.exports = router;