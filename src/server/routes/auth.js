const dotenv = require(`dotenv`).config();
const express = require(`express`);

let router = express.Router();
let passport = require(`passport`);
let util = require(`util`);
let url = require(`url`);
let queryString = require(`querystring`);

// Perform user login.
router.get(`/login`, passport.authenticate(`auth0`, {
    scope: `openid email profile`,
    prompt: `login`
}), (req, res) => res.redirect(`/callback`));

router.get(`/callback`, (req, res, next) => {
    passport.authenticate(`auth0`, (err, user, info) => {
        if(err) return next(err);
        if(!user) return res.redirect(`/login`);
        req.logIn(user, err => {
            if(err) return next(err);
            const returnTo = req.session.returnTo;
            delete req.session.returnTo;
            res.redirect(returnTo || `/`);
        });
    })(req, res, next);
});

router.get(`/logout`, (req, res) => {
    req.logout();

    let returnTo = `${req.protocol}://${req.hostname}`;
    let port = req.connection.localPort;
    if(port != undefined && port != 80 && port != 443) returnTo += `:${port}`;

    let logoutURL = new url.URL(util.format(`https://%s/v2/logout?returnTo=https://krew.io&client_id=tiCWA6x92kAVR6XUxiHCHczFAsoMveuG`), process.env.AUTH0_DOMAIN);
    logoutURL.search = querystring.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        returnTo
    });
    res.redirect(logoutURL);
});

module.exports = router;