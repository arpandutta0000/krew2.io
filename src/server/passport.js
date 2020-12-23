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
    console.log(`bro i read this`);
    console.log(username, password);
    User.findOne({
        username
    }).then((err, user) => {
        if (err) return done(err);
        if (!user) {
            console.log(`this user dont exist bro`)
            return done(null, false, {
                message: `Incorrect username or password`
            });
        }

        // Login a user.
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return log(`red`, err);

            if (isMatch) return done(null, user);
            else return done(null, false, {
                message: `Incorrect username / password`
            })
        });
    }).catch(err => {
        return done(null, false, {
            message: err
        });
    });
}));

// Registration.
passport.use(`register`, new LocalStrategy({
    usernameField: `register-username`,
    passwordField: `register-password`,
},(username, password, done) => {
    User.findOne({
        username
    }).then((err, user) => {
        if (err) return done(err);
        if (user) console.log(`got here`); 
        // return done(null, false, {
        //     message: `User already exists`
        // });
        else {
            let registerUser = new User({
                username,
                creationIP: null,
                lastIP: null,
                creationDate: new Date(),
                password,
                highscore: 0,
                clan: null,
                clanRequest: null
            });
            console.log(`got here`);
            bcrypt.genSalt(15, (err, salt) => bcrypt.hash(registerUser.password, salt, (err, hash) => {
                if (err) return done(err);
                registerUser.password = hash;
                registerUser.save().then(user => () => {
                    return done(null, user);
                }).catch(err => {
                    return done(err);
                });
            }))
        }
    });
}));

module.exports = passport;