// Log utility and request.
const log = require(`../utils/log.js`);
const axios = require(`axios`);
const config = require(`../config/config.js`);
const bcrypt = require(`bcrypt`);
const sendpulse = require(`sendpulse-api`);
const crypto = require(`crypto`);

const express = require(`express`);
const router = express.Router();
const xssFilters = require(`xss-filters`);

// Authentication.
const User = require(`../models/user.model.js`);
const passport = require(`passport`);

router.post(`/register`, (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.json({
            success: `Logged in`
        });
    }

    // if (!req.body[`g-recaptcha-response`] || req.body[`g-recaptcha-response`].length === 0) return res.json({
    //     errors: `Please verify the CAPTCHA`
    // });

    if (!req.body[`register-username`] || !req.body[`register-email`] || !req.body[`register-password`] || !req.body[`register-password-confirm`] ||
        typeof req.body[`register-username`] !== `string` || typeof req.body[`register-email`] !== `string` || typeof req.body[`register-password`] !== `string` || typeof req.body[`register-password-confirm`] !== `string`) return res.json({
        errors: `Please fill out all fields`
    });

    if (!/[a-zA-Z]/.test(req.body[`register-username`])) return res.json({
        errors: `Your username must contain at least one letter`
    });

    if (req.body[`register-username`].length < 3 || req.body[`register-username`].length > 20) return res.json({
        errors: `Your username must be between 3 and 20 characters`
    });

    if (req.body[`register-username`] !== xssFilters.inHTMLData(req.body[`register-username`]) || req.body[`register-username`].split(` `).length > 1) return res.json({
        errors: `Invalid Username`
    });

    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(req.body[`register-email`])) return res.json({
        errors: `Invalid email`
    });

    if (req.body[`register-password`] !== xssFilters.inHTMLData(req.body[`register-password`])) return res.json({
        errors: `Invalid Password`
    });

    if (req.body[`register-password`] !== req.body[`register-password-confirm`]) return res.json({
        errors: `Passwords do not match`
    });

    if (req.body[`register-password`] < 7 || req.body[`register-password`] > 48) return res.json({
        errors: `Password must be between 7 and 48 characters`
    });

    User.findOne({
        email: req.body[`register-email`]
    }).then(user => {
        if (user) {
            if (!user.verified && ((new Date()) - user.creationDate) > (60 * 60 * 1e3)) {
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
                }).then(async user => {
                    if (!user) return log(`red`, err);

                    let creationIP = req.header(`x-forwarded-for`) || req.connection.remoteAddress;
                    let token = `n${crypto.randomBytes(16).toString(`hex`)}${user.username}`;

                    user.email = req.body[`register-email`];
                    user.verified = false;
                    user.verifyToken = token;
                    user.creationIP = creationIP;
                    user.lastIP = user.creationIP;
                    user.lastModified = new Date();

                    let ssl;
                    let address;
                    if (DEV_ENV) {
                        ssl = `http`;
                        address = req.headers.host;
                    } else {
                        ssl = `https`;
                        address = config.domain;
                    }
                    let emailContent = `Hello ${user.username}, please verify your Krew.io account by clicking the link: ${ssl}:\/\/${address}\/verify\/${user.verifyToken}`;

                    sendpulse.init(process.env.EMAIL_ID, process.env.EMAIL_SECRET, `./temp`, () => {});
                    let answerGetter = (data) => {
                        log(`yellow`, `Sending email to ${user.email}...`);
                        log(`yellow`, JSON.stringify(data));
                    };

                    let email = {
                        html: `<h1>Verify your Krew.io Account</h1><br><p>${emailContent}</p>`,
                        text: emailContent,
                        subject: `Verify your Krew.io Account`,
                        from: {
                            name: `Krew.io`,
                            email: `verify@krew2.io`
                        },
                        to: [
                            {
                                name: user.username,
                                email: user.email
                            }
                        ]
                    };

                    await sendpulse.smtpSendMail(answerGetter, email);

                    user.save(() => {
                        log(`yellow`, `Created account "${user.username}" with email "${user.email}"`);
                        return res.json({
                            success: `Succesfully registered! A verification email has been sent to ${user.email}.`
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
        typeof req.body[`login-username`] !== `string` || typeof req.body[`login-password`] !== `string`) return res.json({
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
            log(`yellow`, `User "${user.username}" successfully authenticated.`);
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

    if (!username || typeof username !== `string`) return res.json({
        errors: `Please fill out all fields`
    });

    if (!/[a-zA-Z]/.test(username)) return res.json({
        errors: `Your username must contain at least one letter`
    });

    if (username.length < 3 || username.length > 20) return res.json({
        errors: `Your username must be between 3 and 20 characters`
    });

    if (username !== xssFilters.inHTMLData(username) || req.body[`register-username`].split(` `).length > 1) return res.json({
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

            if (((new Date()) - user.lastModified) < (24 * 60 * 60 * 1e3)) return res.json({
                errors: `You can only change your username or email once every 24 hours`
            });

            user.username = username;
            user.lastModified = new Date();

            user.save(() => {
                log(`yellow`, `User "${currentUsername}" changed username to "${username}".`);
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
    let newEmail = req.body[`change-email-input`];

    if (!newEmail || typeof newEmail !== `string`) return res.json({
        errors: `Please fill out all fields`
    });

    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(newEmail)) return res.json({
        errors: `Invalid email`
    });

    User.findOne({
        email: newEmail
    }).then(user => {
        if (user) return res.json({
            errors: `That email is already in use`
        });

        User.findOne({
            email: currentEmail
        }).then(async user => {
            if (!user) return res.json({
                errors: `Your account is Invalid`
            });

            if (((new Date()) - user.lastModified) < (24 * 60 * 60 * 1e3)) return res.json({
                errors: `You can only change your username or email once every 24 hours`
            });

            let token = `e${crypto.randomBytes(16).toString(`hex`)}${user.username}`;

            user.email = newEmail;
            user.verified = false;
            user.verifyToken = token;
            user.lastModified = new Date();

            let ssl;
            let address;
            if (DEV_ENV) {
                ssl = `http`;
                address = req.headers.host;
            } else {
                ssl = `https`;
                address = config.domain;
            }
            let emailContent = `Hello ${user.username}, please verify your Krew.io account by clicking the link: ${ssl}:\/\/${address}\/verify\/${user.verifyToken}`;

            sendpulse.init(process.env.EMAIL_ID, process.env.EMAIL_SECRET, `./temp`, () => {});
            let answerGetter = (data) => {
                log(`yellow`, `Sending email to ${user.email}...`);
                log(`yellow`, JSON.stringify(data));
            };

            let email = {
                html: `<h1>Verify your Krew.io Account</h1><br><p>${emailContent}</p>`,
                text: emailContent,
                subject: `Verify your Krew.io Account`,
                from: {
                    name: `Krew.io`,
                    email: `verify@krew2.io`
                },
                to: [
                    {
                        name: user.username,
                        email: user.email
                    }
                ]
            };

            await sendpulse.smtpSendMail(answerGetter, email);

            user.save(() => {
                log(`yellow`, `User "${user.username}" sent a change email verification link to "${user.email}".`);
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

    if ((req.body[`account-fp-mode-button`] !== `check` && req.body[`account-fp-mode-button`] !== undefined) || !req.body[`account-fov-control`] || !req.body[`account-music-control`] || !req.body[`account-sfx-control`] || (req.body[`account-view-sails-button`] !== `check` && req.body[`account-view-sails-button`] !== undefined) || !req.body[`account-quality-list`]) return res.json({
        errors: `Please fill out all fields`
    });

    let fov = parseInt(req.body[`account-fov-control`]);
    let music = parseInt(req.body[`account-music-control`]);
    let sfx = parseInt(req.body[`account-sfx-control`]);
    let quality = parseInt(req.body[`account-quality-list`]);

    if (isNaN(fov) || isNaN(music) || isNaN(sfx) || isNaN(quality)) return res.json({
        errors: `Invalid values`
    });

    if (fov < 10 || fov > 50 || music < 0 || music > 100 || sfx < 0 || sfx > 100 || !(quality !== 1 || quality !== 2 || quality !== 3)) return res.json({
        errors: `Invalid values`
    });

    User.findOne({
        username: req.user.username
    }).then(user => {
        if (!user) return res.json({
            errors: `Your account is Invalid`
        });

        if (req.body[`account-fp-mode-button`] === `check`) user.fpMode = true;
        else user.fpMode = false;

        if (req.body[`account-view-sails-button`] === `check`) user.viewSails = true;
        else user.viewSails = false;

        user.fov = fov;
        user.musicVolume = music;
        user.sfxVolume = sfx;
        user.qualityMode = quality;

        user.save(() => {
            log(`yellow`, `User "${user.username}" updated their account's game settings.`);
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

    if (!krewName || typeof krewName !== `string`) return res.json({
        errors: `Please fill out all fields`
    });

    if (krewName.length < 1 || krewName.length > 20) return res.json({
        errors: `Your Krew name must be between 1 and 20 characters`
    });

    if (krewName !== xssFilters.inHTMLData(krewName) || /[\[\]{}()/\\]/g.test(krewName)) return res.json({
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
            log(`yellow`, `User "${user.username}" changed their default Krew name to "${krewName}".`);
            return res.json({
                success: `Succesfully changed default Krew name`
            });
        });
    });
});

router.post(`/customization`, (req, res, next) => {
    if (!req.isAuthenticated()) return res.json({
        errors: `You must be logged in to customize your character`
    });

    let playerModel = parseInt(req.body.playerModel);
    let hatModel = parseInt(req.body.hatModel);

    if (playerModel == undefined || isNaN(playerModel) || hatModel == undefined || isNaN(hatModel)) return res.json({
        errors: `Please specify a model ID`
    });

    if (playerModel < 0 || playerModel > 6 || hatModel < 0 || hatModel > 2) return res.json({
        errors: `Invalid model ID`
    });

    User.findOne({
        username: req.user.username
    }).then(user => {
        if (!user) return res.json({
            errors: `Your account is Invalid`
        });

        user.playerModel = playerModel;
        user.hatModel = hatModel;

        user.save(() => {
            log(`yellow`, `User "${user.username}" set their player model to "${playerModel}" and hat model to "${hatModel}".`);
            return res.json({
                success: `Succesfully updated player customization`
            });
        });
    });
});

router.post(`/reset_password`, (req, res, next) => {
    let email = req.body[`reset-password-email`];
    let password = req.body[`reset-password-password`];
    let confirmPassword = req.body[`reset-password-password-confirm`];

    if (!email || typeof email !== `string` || !password || typeof password !== `string` || !confirmPassword || typeof confirmPassword !== `string`) return res.json({
        errors: `Please fill out all fields`
    });

    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) return res.json({
        errors: `Invalid email`
    });

    if (password !== xssFilters.inHTMLData(password)) return res.json({
        errors: `Invalid Password`
    });

    if (password !== confirmPassword) return res.json({
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

        let token = `p${crypto.randomBytes(16).toString(`hex`)}${user.username}`;

        bcrypt.genSalt(15, (err, salt) => {
            if (err) return res.json({
                errors: err
            });

            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) return res.json({
                    errors: err
                });

                user.newPassword = hash;
                user.newPasswordToken = token;

                let ssl;
                let address;
                if (DEV_ENV) {
                    ssl = `http`;
                    address = req.headers.host;
                } else {
                    ssl = `https`;
                    address = config.domain;
                }
                let emailContent = `Hello ${user.username}, please verify that you would like to reset your password on Krew.io by clicking the link: ${ssl}:\/\/${address}\/verify\/${user.newPasswordToken}`;

                sendpulse.init(process.env.EMAIL_ID, process.env.EMAIL_SECRET, `./temp`, () => {});
                let answerGetter = (data) => {
                    log(`yellow`, `Sending email to ${user.email}...`);
                    log(`yellow`, JSON.stringify(data));
                };

                let email = {
                    html: `<h1>Reset your Krew.io password</h1><br><p>${emailContent}</p>`,
                    text: emailContent,
                    subject: `Reset your Krew.io password`,
                    from: {
                        name: `Krew.io`,
                        email: `verify@krew2.io`
                    },
                    to: [
                        {
                            name: user.username,
                            email: user.email
                        }
                    ]
                };

                await sendpulse.smtpSendMail(answerGetter, email);

                user.save(() => {
                    log(`yellow`, `User "${user.username}" sent a change password verification link to "${user.email}".`);
                    req.logOut();
                    return res.json({
                        success: `Succesfully sent confirm password email`
                    });
                });
            });
        });
    });
});

router.get(`/verify/*`, (req, res, next) => {
    let token = req.url.split(`/verify/`)[1];
    if (!token) return res.redirect(`/`);

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
                log(`yellow`, `User "${user.username}" verified email address "${user.email}".`);
                return res.redirect(`/`);
            });
        }
    });
});

router.get(`/verify_reset_password/*`, (req, res, next) => {
    let token = req.url.split(`/verify_reset_password/`)[1];
    if (!token) return;

    User.findOne({
        newPasswordToken: token
    }).then(user => {
        if (!user) return res.redirect(`/`);
        if (!user.newPassword || !user.newPasswordToken) return res.redirect(`/`);

        user.password = user.newPassword;
        user.newPassword = undefined;
        user.newPasswordToken = undefined;

        user.save(() => {
            log(`yellow`, `User "${user.username}" verified resetting their password.`);
            return res.redirect(`/`);
        });
    });
});

router.get(`/logout`, (req, res, next) => {
    if (req.isAuthenticated()) {
        log(`yellow`, `User "${req.user.username}" logged out.`);
        req.logOut();
    }
    res.redirect(`/`);
});

router.get(`/authenticated`, (req, res, next) => {
    if (req.isAuthenticated()) {
        log(`yellow`, `User "${req.user.username}" logged in.`);
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

            return res.json({
                fpMode: user.fpMode != undefined ? user.fpMode : false,
                fov: user.fov != undefined ? user.fov : 10,
                musicVolume: user.musicVolume != undefined ? user.musicVolume : 50,
                sfxVolume: user.sfxVolume != undefined ? user.sfxVolume : 50,
                viewSails: user.viewSails != undefined ? user.viewSails : false,
                qualityMode: user.qualityMode != undefined ? user.qualityMode : 2
            });
        });
    }
});

router.post(`/delete_account`, (req, res, next) => {
    if (!req.isAuthenticated()) return res.json({
        errors: `You must be logged in to delete your account`
    });

    let username = req.user.username;

    if (!req.body[`delete-account-username`] || !req.body[`delete-account-password`] ||
        typeof req.body[`delete-account-username`] !== `string` || typeof req.body[`delete-account-password`] !== `string`) return res.json({
        errors: `Please fill out all fields`
    });

    if (username !== req.body[`delete-account-username`]) return res.json({
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
    });
});

module.exports = router;
