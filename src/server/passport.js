const bcrypt = require(`bcryptjs`);
const User = require(`./models/user.model.js`);

const passport = require(`passport`);
const LocalStrategy = require(`passport-local`).Strategy;

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

// Strategy.
passport.use(`login`, new LocalStrategy({
    usernameField: `login-user`,
    passwordField: `login-password`
}, (username, password, done) => {
    User.findOne({
        username
    }).then(user => {
        if (!user) {
            return done(`Incorrect username or password`, false);
        }

        // Login a user.
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return log(`red`, err);

            if (isMatch) return done(null, user);
            else return done(`Incorrect username / password`, false)
        });
    }).catch(err => {
        return done(err, false);
    });
}));

// Registration.
passport.use(`register`, new LocalStrategy({
    usernameField: `register-username`,
    passwordField: `register-password`
}, (username, password, done) => {
    User.findOne({
        username
    }).then(user => {
        if (user) return done(`User already exists`, false);
        else {
            let registerUser = new User({
                username,
                creationDate: new Date(),
                password,
                highscore: 0
            });

            bcrypt.genSalt(15, (err, salt) => bcrypt.hash(registerUser.password, salt, (err, hash) => {
                if (err) return done(err);

                registerUser.password = hash;
                registerUser.save(err => {
                    if (err) return done(err);
                    return done(null, registerUser, `success`);
                });
            }));
        }
    });
}));

module.exports = passport;