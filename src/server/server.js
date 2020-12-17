let config = require(`./config/config.js`);
let log = require(`./utils/log.js`);
let dotenv = require(`dotenv`).config();

let express = require(`express`);
let app = express();

const fs = require(`fs`);
const User = require(`./models/user.model.js`);

let https = require(`https`);
let http = require(`http`);

let bodyParser = require(`body-parser`);
let compression = require(`compression`);
let flash = require(`connect-flash`);

let Rollbar = require(`rollbar`);
let rollbar = new Rollbar(process.env.ROLLBAR_TOKEN);

let authRouter = require(`./routes/auth`);
let indexRouter = require(`./routes/index`);

let expressSession = require(`express-session`)({
    secret: `öskdjfnspdijnfpsidjn`,
    resave: true,
    saveUninitialized: false
});


app.use(`/`, authRouter);
app.use(`/`, indexRouter);
app.use(expressSession);

app.use((req, res, next) => {
    if(req.path.includes(`/assets/img/`)){ // Caching pictures. (Maybe someone knows a better option)
        res.header(`Cache-Control`, `public, max-age=86400`);
    }
    res.header(`Access-Control-Allow-Credentials`, true);
    res.header(`Access-Control-Allow-Origin`, `*`);
    // res.header(`Access-Control-Allow-Origin`, req.headers.origin);
    res.header(`Access-Control-Allow-Methods`, `POST, GET, OPTIONS, PUT, DELETE, PATCH, HEAD`);
    res.header(`Access-Control-Allow-Headers`, `Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept`);
    req.method.toLowerCase() == `options`
        ? res.sendStatus(200)
        : next();
});

app.use(compression());
app.use(flash());

app.use(bodyParser.json({ limit: `50mb` }));
app.use(bodyParser.urlencoded({ limit: `50mb`, extended: true }));

app.set(`views`, `${__dirname}/views`);
app.set(`view engine`, `ejs`);

// serve static dir
app.use(express.static(config.staticDir));
app.use(`/ads.txt`, express.static(`ads.txt`)); // static file loader

// create https server
let server = config.mode == `dev` ? http.createServer(app): https.createServer({
         key: fs.readFileSync(config.ssl.keyPath),
         cert: fs.readFileSync(config.ssl.certPath),
         requestCert: false,
         rejectUnauthorized: false
}, app); 

if(process.env.NODE_ENV == `test-server`) global.io = require(`socket.io`)(server,{origins: `*:*`});
else global.io = require(`socket.io`)(server,{origins: `*:*`}).listen(`2000`);

// json response to /status
app.get(`/get_servers`, function (req, res) {
    res.jsonp(app.workers);
});

app.get(`/wall-of-fame`, async function (req, res) {
    let wofPlayers = await User.find({}).sort({ highscore: -1 }).limit(20);
    res.jsonp(wofPlayers);
});

app.get(`/thug_life`, function (req, res) {
    res.render(`index_thuglife.ejs`);
});

server.listen(config.port);

// Use the rollbar error handler to send exceptions to your rollbar account
app.use(rollbar.errorHandler());

// Authentication.
const mongoose = require(`mongoose`);

mongoose.connect(`mongodb://localhost:27017/localKrewDB`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log(`User authentication has connected to database.`));

const passport = require(`passport`);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.post(`/login`, (req, res, next) => {
    passport.authenticate(`local`, (err, user, info) => {
        if(err) return next(err);
        if(!user) return res.redirect(`/login`);

        req.logIn(user, err => {
            if(err) return next(err);
            return res.redirect(`/`);
        });
    })(req, res, next);
});

app.post(`/register`, (req, res, next) => {
    if(!req.username || !req.password) return;
    User.register({ username: req.username, password: req.password, active: false }, req.username);
});

// export server because socket.io needs it
exports.server = server;
exports.io = global.io;
exports.app = app;
