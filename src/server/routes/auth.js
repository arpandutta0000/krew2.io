// routes/auth.js

// Log utility and request.
const log = require(`../utils/log.js`);
const axios = require(`axios`);
const config = require(`../config/config.js`);
const bcrypt = require(`bcrypt`);
const nodemailer = require(`nodemailer`);
const crypto = require(`crypto`);

const express = require(`express`);
let router = express.Router();
const xssFilters = require(`xss-filters`);

// Authentication.
const User = require(`../models/user.model.js`);
const passport = require(`passport`);

router.post(`/register`, (req, res, next) => {
    if (!req.body[`register-username`] || !req.body[`register-email`] || !req.body[`register-password`] || !req.body[`register-password-confirm`] ||
        typeof req.body[`register-username`] != `string` || typeof req.body[`register-email`] != `string` || typeof req.body[`register-password`] != `string` || typeof req.body[`register-password-confirm`] != `string`) return res.json({
        errors: `Please fill out all fields`
    });

    if (!/[a-zA-Z]/.test(req.body[`register-username`])) return res.json({
        errors: `Your username must contain at least one letter`
    });

    if (req.body[`register-username`].length < 3 || req.body[`register-username`].length > 20) return res.json({
        errors: `Your username be between 3 and 20 characters`
    });

    if (req.body[`register-username`] != xssFilters.inHTMLData(req.body[`register-username`]) || /[^\w\s]/.test(req.body[`register-username`]) || req.body[`register-username`].indexOf(config.whitespaceCharacters) > -1) return res.json({
        errors: `Invalid Username`
    });

    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(req.body[`register-email`])) return res.json({
        errors: `Invalid email`
    });

    if (req.body[`register-password`] != xssFilters.inHTMLData(req.body[`register-password`])) return res.json({
        errors: `Invalid Password`
    });

    if (req.body[`register-password`] != req.body[`register-password-confirm`]) return res.json({
        errors: `Passwords do not match`
    });

    if (req.body[`register-password`] < 7 || req.body[`register-password`] > 48) return res.json({
        errors: `Password must be between 7 and 48 characters`
    });

    let email = req.body[`register-email`];

    User.findOne({
        email
    }).then(user => {
        if (user) return res.json({
            errors: `That email is already in use`
        });

        passport.authenticate(`register`, (err, user, info) => {
            if (err) return res.json({
                errors: err
            });

            let username = user.username ? user.username : ``;

            if (info) {
                User.findOne({
                    username
                }).then(user => {
                    if (!user) return log(`red`, err);

                    let creationIP = req.header(`x-forwarded-for`) || req.connection.remoteAddress;
                    let token = crypto.randomBytes(16).toString('hex') + user.username;

                    user.email = email;
                    user.verified = false;
                    user.verifyToken = token;
                    user.creationIP = creationIP;
                    user.lastIP = user.creationIP;

                    User.findOne({
                        creationIP
                    }).then(cUser => {
                        if (cUser) {
                            user.delete();
                            return res.json({
                                errors: `You can only create one account`
                            });
                        }

                        User.findOne({
                            lastIP: creationIP
                        }).then(lUser => {
                            if (lUser) {
                                user.delete();
                                return res.json({
                                    errors: `You can only create one account`
                                });
                            }

                            axios.get(`https://check.getipintel.net/check.php?ip=${creationIP}&contact=dzony@gmx.de&flags=f&format=json`).then(vpnData => {
                                if (!vpnData) {
                                    log(`red`, `There was an error while performing the VPN check request.`);
                                    user.delete();
                                    return res.json({
                                        errors: `There was an error in creating your account`
                                    });
                                }

                                if (vpnData.data && vpnData.data.status == `success` && parseInt(vpnData.data.result) == 1) {
                                    log(`cyan`, `VPN connection. Preventing account creation by IP: ${creationIP}.`);
                                    user.delete();
                                    return res.json({
                                        errors: `Disable VPN to create an account`
                                    });
                                } else {
                                    let transporter = nodemailer.createTransport({
                                        service: "Gmail",
                                        auth: {
                                            user: process.env.EMAIL_USERNAME,
                                            pass: process.env.EMAIL_PASSWORD
                                        }
                                    });

                                    let ssl;
                                    if (DEV_ENV) {
                                        ssl = `http`;
                                    } else {
                                        ssl = `https`;
                                    }

                                    let mailOptions = {
                                        from: 'noreply@krew.io',
                                        to: user.email,
                                        subject: 'Verify your Krew.io Account',
                                        text: `Hello ${user.username},\n\nPlease verify your Krew.io account by clicking the link: \n${ssl}:\/\/${req.headers.host}\/verify\/${user.verifyToken}\n`
                                    }

                                    transporter.sendMail(mailOptions, function (err) {
                                        if (err) {
                                            user.delete();
                                            return res.json({
                                                error: `Error sending to the specified email address.`
                                            });
                                        }
                                    });
                                    user.save();
                                    return res.json({
                                        success: `Succesfully registered! A verification email has been sent to ${user.email}.`
                                    });;
                                }
                            });
                        });
                    });
                });
            }
        })(req, res, next);
    });
});

router.post(`/login`, (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.json({
            success: `Logged in`
        });
    }
    if (!req.body[`login-username`] || !req.body[`login-password`] ||
        typeof req.body[`login-username`] != `string` || typeof req.body[`login-password`] != `string`) return res.json({
        errors: `Please fill out all fields`
    });

    passport.authenticate(`login`, (err, user, info) => {
        if (err) {
            log(`red`, err);
            return res.json({
                errors: err
            });
        }

        if (!user) return res.json({
            errors: `User does not exist`
        });

        req.logIn(user, err => {
            if (err) return res.json({
                errors: err
            });
            return res.json({
                success: `Logged in`
            });
        });
    })(req, res, next);
});

router.post(`/change_username`, (req, res, next) => {
    if (!req.isAuthenticated()) return res.json({
        errors: `You must be logged in to change your username`
    });

    let currentUsername = req.user.username;
    let username = req.body[`change-username-input`];

    if (!username || typeof username != `string`) return res.json({
        errors: `Please fill out all fields`
    });

    if (!/[a-zA-Z]/.test(username)) return res.json({
        errors: `Your username must contain at least one letter`
    });

    if (username.length < 3 || username.length > 20) return res.json({
        errors: `Your username be between 3 and 20 characters`
    });

    if (username != xssFilters.inHTMLData(username) || /[^\w\s]/.test(username) || username.indexOf(config.whitespaceCharacters) > -1) return res.json({
        errors: `Invalid Username`
    });

    User.findOne({
        username
    }).then(user => {
        if (user) return res.json({
            errors: `That username is already in use`
        });

        User.findOne({
            username: currentUsername
        }).then(user => {
            if (!user) return res.json({
                errors: `Your account is Invalid`
            });

            user.username = username;

            user.save();
            req.logOut();
            return res.json({
                success: `Succesfully changed username`
            });
        });
    });
});

router.post(`/change_email`, (req, res, next) => {
    if (!req.isAuthenticated()) return res.json({
        errors: `You must be logged in to change your email`
    });

    let currentEmail = req.user.email;
    let email = req.body[`change-email-input`];

    if (!email || typeof email != `string`) return res.json({
        errors: `Please fill out all fields`
    });

    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) return res.json({
        errors: `Invalid email`
    });

    User.findOne({
        email
    }).then(user => {
        if (user) return res.json({
            errors: `That email is already in use`
        });

        User.findOne({
            email: currentEmail
        }).then(user => {
            if (!user) return res.json({
                errors: `Your account is Invalid`
            });

            let token = crypto.randomBytes(16).toString('hex') + user.username;

            user.email = email;
            user.verified = false
            user.verifyToken = token;

            let transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });

            let ssl;
            if (DEV_ENV) {
                ssl = `http`;
            } else {
                ssl = `https`;
            }

            let mailOptions = {
                from: 'noreply@krew.io',
                to: user.email,
                subject: 'Verify your Krew.io Account',
                text: `Hello ${user.username},\n\nPlease verify your Krew.io account by clicking the link: \n${ssl}:\/\/${req.headers.host}\/verify\/${user.verifyToken}\n`
            }

            transporter.sendMail(mailOptions, function (err) {
                if (err) {
                    user.delete();
                    return res.json({
                        error: `Error sending to the specified email address.`
                    });
                }
            });
            user.save();
            req.logOut();
            return res.json({
                success: `Succesfully changed email`
            });
        });
    });
});

router.get(`/verify/*`, (req, res, next) => {
    let token = req.url.split(`/verify/`)[1];
    if (!token) return;

    User.findOne({
        verifyToken: token
    }).then(user => {
        if (!user) return;

        if (!user.verified) user.verified = true;
        user.save();
        return res.redirect(`/`);
    })
})

router.get(`/logout`, (req, res, next) => {
    if (req.isAuthenticated()) req.logOut();
    res.redirect(`/`);
});

router.get(`/authenticated`, (req, res, next) => {
    if (req.isAuthenticated()) return res.json({
        isLoggedIn: true,
        username: req.user.username,
        password: req.user.password
    });
    else return res.json({
        isLoggedIn: false
    });
});

router.post(`/delete_account`, (req, res, next) => {
    if (!req.isAuthenticated()) return res.json({
        errors: `You must be logged in to delete your account`
    });

    let username = req.user.username;

    if (!req.body[`delete-account-username`] || !req.body[`delete-account-password`] ||
        typeof req.body[`delete-account-username`] != `string` || typeof req.body[`delete-account-password`] != `string`) return res.json({
        errors: `Please fill out all fields`
    });

    if (username != req.body[`delete-account-username`]) return res.json({
        errors: `Wrong Username`
    });

    User.findOne({
        username
    }).then(user => {
        if (!user) return res.json({
            errors: `Invalid Username`
        });

        bcrypt.compare(req.body[`delete-account-password`], user.password, (err, isMatch) => {
            if (err) return log(`red`, err);

            if (isMatch) {
                req.logOut();
                user.delete();
                return res.json({
                    success: `Username and Passwords match, deleted account`
                });
            } else {
                return res.json({
                    errors: `Wrong Password`
                });
            }
        });
    })
});

module.exports = router;