// Log utility and request.
const log = require(`../utils/log.js`);
const axios = require(`axios`);
const config = require(`../config/config.js`);
const bcrypt = require(`bcrypt`);
const nodemailer = require(`nodemailer`);
const crypto = require(`crypto`);

const express = require(`express`);
const router = express.Router();
const xssFilters = require(`xss-filters`);

// Authentication.
const User = require(`../models/user.model.js`);
const passport = require(`passport`);

router.post(`/register`, (req, res, next) => {
    if (req.body[`g-recaptcha-response`].length == 0 || !req.body[`g-recaptcha-response`]) return res.json({
        errors: `Please verify the CAPTCHA`
    });

    let captchaVerificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRET}&response=${req.body['g-recaptcha-response']}&remoteip=${req.connection.remoteAddress}`
    axios.get(captchaVerificationUrl).then(cRes => {
        if (!cRes.data) return res.json({
            errors: `Error validating CAPTCHA response`
        });

        if (!cRes.data.success || cRes.data.success == undefined) return res.json({
            errors: `Please correctly verify the CAPTCHA`
        });

        if (!req.body[`register-username`] || !req.body[`register-email`] || !req.body[`register-password`] || !req.body[`register-password-confirm`] ||
            typeof req.body[`register-username`] != `string` || typeof req.body[`register-email`] != `string` || typeof req.body[`register-password`] != `string` || typeof req.body[`register-password-confirm`] != `string`) return res.json({
            errors: `Please fill out all fields`
        });

        if (!/[a-zA-Z]/.test(req.body[`register-username`])) return res.json({
            errors: `Your username must contain at least one letter`
        });

        if (req.body[`register-username`].length < 3 || req.body[`register-username`].length > 20) return res.json({
            errors: `Your username must be between 3 and 20 characters`
        });

        if (req.body[`register-username`] != xssFilters.inHTMLData(req.body[`register-username`]) || /[^\w\s]/.test(req.body[`register-username`]) || config.whitespaceRegex.test(req.body[`register-username`])) return res.json({
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
            if (user) {
                if (!user.verified && ((new Date) - user.creationDate) > (60 * 60 * 1e3)) {
                    user.delete();
                } else {
                    return res.json({
                        errors: `That email is already in use`
                    });
                }
            }

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
                        let token = `n` + crypto.randomBytes(16).toString('hex') + user.username;

                        user.email = email;
                        user.verified = false;
                        user.verifyToken = token;
                        user.creationIP = creationIP;
                        user.lastIP = user.creationIP;
                        user.lastModified = new Date();

                        User.findOne({
                            creationIP
                        }).then(cUser => {
                            if (cUser) {
                                // user.delete();
                                // return res.json({
                                //     errors: `You can only create one account`
                                // });
                            }

                            User.findOne({
                                lastIP: creationIP
                            }).then(lUser => {
                                if (lUser) {
                                    // user.delete();
                                    // return res.json({
                                    //     errors: `You can only create one account`
                                    // });
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
                                        let address;
                                        if (DEV_ENV) {
                                            ssl = `http`;
                                            address = req.headers.host;
                                        } else {
                                            ssl = `https`;
                                            address = config.domain;
                                        }

                                        let mailOptions = {
                                            from: 'noreply@krew.io',
                                            to: user.email,
                                            subject: 'Verify your Krew.io Account',
                                            text: `Hello ${user.username},\n\nPlease verify your Krew.io account by clicking the link: \n${ssl}:\/\/${address}\/verify\/${user.verifyToken}\n`
                                        }

                                        transporter.sendMail(mailOptions, function (err) {
                                            if (err) {
                                                user.delete();
                                                return res.json({
                                                    error: `Error sending to the specified email address.`
                                                });
                                            }
                                        });
                                        user.save(() => {
                                            log(`magenta`, `Created account "${user.username}" with email "${user.email}"`);
                                            return res.json({
                                                success: `Succesfully registered! A verification email has been sent to ${user.email}.`
                                            });
                                        });
                                    }
                                });
                            });
                        });
                    });
                }
            })(req, res, next);
        });
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
            log(`magenta`, `User "${user.username}" successfully authenticated`);
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
        errors: `Your username must be between 3 and 20 characters`
    });

    if (username != xssFilters.inHTMLData(username) || /[^\w\s]/.test(username) || config.whitespaceRegex.test(username)) return res.json({
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

            if (((new Date) - user.lastModified) < (24 * 60 * 60 * 1e3)) return res.json({
                errors: `You can only change your username or email once every 24 hours`
            });

            user.username = username;
            user.lastModified = new Date();

            user.save(() => {
                log(`magenta`, `User "${currentUsername}" changed username to "${username}"`);
                req.logOut();
                return res.json({
                    success: `Succesfully changed username`
                });
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

            if (((new Date) - user.lastModified) < (24 * 60 * 60 * 1e3)) return res.json({
                errors: `You can only change your username or email once every 24 hours`
            });

            let token = `e` + crypto.randomBytes(16).toString('hex') + user.username;

            user.email = email;
            user.verified = false
            user.verifyToken = token;
            user.lastModified = new Date();

            let transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });

            let ssl;
            let address;
            if (DEV_ENV) {
                ssl = `http`;
                address = req.headers.host;
            } else {
                ssl = `https`;
                address = config.domain;
            }

            let mailOptions = {
                from: 'noreply@krew.io',
                to: user.email,
                subject: 'Confirm changing your Krew.io email',
                text: `Hello ${user.username},\n\nPlease verify your Krew.io account by clicking the link: \n${ssl}:\/\/${address}\/verify\/${user.verifyToken}\n`
            }

            transporter.sendMail(mailOptions, function (err) {
                if (err) {
                    return res.json({
                        error: `Error sending to the specified email address.`
                    });
                }
            });
            user.save(() => {
                log(`magenta`, `User "${user.username}" sent a change email verification link to "${user.email}"`);
                req.logOut();
                return res.json({
                    success: `Succesfully changed email`
                });
            });
        });
    });
});

router.post(`/change_account_game_settings`, (req, res, next) => {
    if (!req.isAuthenticated()) return res.json({
        errors: `You must be logged in to change your account's game settings`
    });

    if ((req.body[`account-fp-mode-button`] !== `check` && req.body[`account-fp-mode-button`] != undefined) || !req.body[`account-music-control`] || !req.body[`account-sfx-control`] || !req.body[`account-quality-list`]) res.json({
        errors: `Please fill out all fields`
    });

    let music = parseInt(req.body[`account-music-control`]);
    let sfx = parseInt(req.body[`account-sfx-control`]);
    let quality = parseInt(req.body[`account-quality-list`]);

    if (isNaN(music) || isNaN(sfx) || isNaN(quality)) res.json({
        errors: `Invalid values`
    });

    if (music < 0 || music > 100 || sfx < 0 || sfx > 100 || !(quality !== 1 || quality !== 2 || quality !== 3)) res.json({
        errors: `Invalid values`
    });

    User.findOne({
        username: req.user.username
    }).then(user => {
        if (!user) return res.json({
            errors: `Your account is Invalid`
        });

        if (req.body[`account-fp-mode-button`] === `check`) {
            user.fpMode = true;
        } else {
            user.fpMode = false;
        }

        user.musicVolume = music;
        user.sfxVolume = sfx;
        user.qualityMode = quality;

        user.save(() => {
            log(`magenta`, `User "${user.username}" updated their account's game settings`);
            return res.json({
                success: `Succesfully changed account game settings`
            });
        });
    });
});

router.post(`/change_default_krew_name`, (req, res, next) => {
    if (!req.isAuthenticated()) return res.json({
        errors: `You must be logged in to change your default Krew name`
    });

    krewName = req.body[`change-default-krew-name-input`];

    if (!krewName || typeof krewName != `string`) return res.json({
        errors: `Please fill out all fields`
    });

    if (krewName.length < 1 || krewName.length > 20) return res.json({
        errors: `Your Krew name must be between 1 and 20 characters`
    });

    if (krewName != xssFilters.inHTMLData(krewName) || /[\[\]{}()/\\]/g.test(krewName)) return res.json({
        errors: `Invalid Krew name`
    });

    User.findOne({
        username: req.user.username
    }).then(user => {
        if (!user) return res.json({
            errors: `Your account is Invalid`
        });

        user.defaultKrewName = krewName;

        user.save(() => {
            log(`magenta`, `User "${user.username}" changed their default Krew name to "${krewName}"`);
            return res.json({
                success: `Succesfully changed default Krew name`
            });
        });
    });
});

router.post(`/reset_password`, (req, res, next) => {
    let email = req.body[`reset-password-email`]
    let password = req.body[`reset-password-password`];
    let confirmPassword = req.body[`reset-password-password-confirm`];

    if (!email || typeof email != `string` || !password || typeof password != `string` || !confirmPassword || typeof confirmPassword != `string`) return res.json({
        errors: `Please fill out all fields`
    });

    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) return res.json({
        errors: `Invalid email`
    });

    if (password != xssFilters.inHTMLData(password)) return res.json({
        errors: `Invalid Password`
    });

    if (password != confirmPassword) return res.json({
        errors: `Passwords do not match`
    });

    if (password < 7 || password > 48) return res.json({
        errors: `Password must be between 7 and 48 characters`
    });

    User.findOne({
        email
    }).then(user => {
        if (!user) return res.json({
            errors: `That email is not registered.`
        });

        if (!user.verified) return res.json({
            errors: `You must verify your email to change your password.`
        });

        let token = `p` + crypto.randomBytes(16).toString('hex') + user.username;

        bcrypt.genSalt(15, (err, salt) => bcrypt.hash(password, salt, (err, hash) => {
            if (err) return res.json({
                errors: err
            });

            user.newPassword = hash;
            user.newPasswordToken = token;

            let transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });

            let ssl;
            let address;
            if (DEV_ENV) {
                ssl = `http`;
                address = req.headers.host;
            } else {
                ssl = `https`;
                address = config.domain;
            }

            let mailOptions = {
                from: 'noreply@krew.io',
                to: user.email,
                subject: 'Reset your Krew.io password',
                text: `Hello ${user.username},\n\nPlease verify that you would like to reset your password on Krew.io by clicking the link: \n${ssl}:\/\/${address}\/verify_reset_password\/${user.newPasswordToken}\n`
            }

            transporter.sendMail(mailOptions, function (err) {
                if (err) {
                    user.delete();
                    return res.json({
                        error: `Error sending to the specified email address.`
                    });
                }
            });
            user.save(() => {
                log(`magenta`, `User "${user.username}" sent a change password verification link to "${user.email}"`);
                req.logOut();
                return res.json({
                    success: `Succesfully sent confirm password email`
                });
            });
        }));
    });
});

router.get(`/verify/*`, (req, res, next) => {
    let token = req.url.split(`/verify/`)[1];
    if (!token) return res.redirect(`/`);;

    User.findOne({
        verifyToken: token
    }).then(user => {
        if (!user) return res.redirect(`/`);

        if (user.verified) {
            return res.redirect(`/`);
        } else {
            user.verified = true;
            user.verifyToken = undefined;

            user.save(() => {
                log(`magenta`, `User "${user.username}" verified email address "${user.email}"`);
                return res.redirect(`/`);
            });
        }
    });
})

router.get(`/verify_reset_password/*`, (req, res, next) => {
    let token = req.url.split(`/verify_reset_password/`)[1];
    if (!token) return;

    User.findOne({
        newPasswordToken: token
    }).then(user => {
        if (!user) return res.redirect(`/`);;
        if (!user.newPassword || !user.newPasswordToken) return res.redirect(`/`);;

        user.password = user.newPassword;
        user.newPassword = undefined;
        user.newPasswordToken = undefined;

        user.save(() => {
            log(`magenta`, `User "${user.username}" verified resetting their password`);
            return res.redirect(`/`);
        });
    });
});

router.get(`/logout`, (req, res, next) => {
    if (req.isAuthenticated()) {
        log(`magenta`, `User "${req.user.username}" logged out`);
        req.logOut();
    }
    res.redirect(`/`);
});

router.get(`/authenticated`, (req, res, next) => {
    if (req.isAuthenticated()) {
        log(`magenta`, `User "${req.user.username}" logged in`);
        return res.json({
            isLoggedIn: true,
            username: req.user.username,
            password: req.user.password
        });
    } else return res.json({
        isLoggedIn: false
    });
});

router.get(`/account_game_settings`, (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.json({
            errors: `Unauthorized`
        });

    } else {
        User.findOne({
            username: req.user.username
        }).then(user => {
            if (!user) return res.json({
                errors: `Unauthorized`
            });

            if (user.fpMode == undefined || user.musicVolume == undefined || user.sfxVolume == undefined || user.qualityMode == undefined) return res.json({
                errors: `User does not have valid data stored`
            });

            return res.json({
                fpMode: user.fpMode,
                musicVolume: user.musicVolume,
                sfxVolume: user.sfxVolume,
                qualityMode: user.qualityMode
            });
        })
    }
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
                log(`yellow`, `User ${user.username} deleted their account`);
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