// routes/auth.js
const express = require(`express`);
let router = express.Router();

// Authentication.
const User = require(`../models/user.model.js`);
const passport = require(`passport`);

router.post(`/register`, (req, res, next) => {
    if (req.body[`register-password`] != req.body[`register-password-confirm`]) return res.json({
        errors: `Passwords do not match`
    });

    if (!req.body[`register-username`] || !req.body[`register-email`] || !req.body[`register-password`] || !req.body[`register-password-confirm`] ||
        typeof req.body[`register-username`] != `string` || typeof req.body[`register-email`] != `string` || typeof req.body[`register-password`] != `string` || typeof req.body[`register-password-confirm`] != `string`) return res.json({
        errors: `Bad request`
    });

    console.log(`i got a request`, req.body);
    passport.authenticate(`register`, (err, user, info) => {
        if (err) return res.json({
            errors: err
        });
        if (user) return res.json({
            errors: `User already exists`
        });
    });
})

router.post(`/login`, (req, res, next) => {
    if (!req.body[`login-user`] || !req.body[`login-password`] ||
        typeof req.body[`login-user`] != `string` || typeof req.body[`login-password`] != `string`) return res.json({
        errors: `Bad request`
    });
    
    console.log(`i got a request`, req.body);
    passport.authenticate(`login`, (err, user, info) => {
        if (err) return res.json({
            errors: err
        });
        if (!user) return res.json({
            errors: `User does not exist`
        });

        req.logIn(user, err => {
            console.log(`i got here 2`);
            if (err) return res.json({
                errors: err
            });
            return res.json({
                success: `Logged in as ${user.id}`
            });
        });
    })(req, res, next);
});

router.get(`/logout`, (req, res, next) => {
    if (req.isAuthenticated()) req.logOut();
    res.redirect(`/`);
});

router.get(`/authenticated`, (req, res, next) => {
    if (req.isAuthenticated()) return res.json({
        isLoggedIn: true,
        user: req.user
    });
    else return res.json({
        isLoggedIn: false
    });
});

module.exports = router;