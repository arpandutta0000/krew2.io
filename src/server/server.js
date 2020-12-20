let config = require(`./config/config.js`);
let log = require(`./utils/log.js`);
let dotenv = require(`dotenv`).config();

let express = require(`express`);
let app = express();

const mongoose = require(`mongoose`);
mongoose.connect(`mongodb://localhost:27017/localKrewDB`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => log(`green`, `User authentication has connected to database.`));

const fs = require(`fs`);
const User = require(`./models/user.model.js`);

let https = require(`https`);
let http = require(`http`);

let bodyParser = require(`body-parser`);
let compression = require(`compression`);
let flash = require(`connect-flash`);

let Rollbar = require(`rollbar`);
let rollbar = new Rollbar(process.env.ROLLBAR_TOKEN);

let apiRouter = require(`./routes/api`);
let authRouter = require(`./routes/auth`);
let indexRouter = require(`./routes/index`);

let expressSession = require(`express-session`)({
    secret: `öskdjfnspdijnfpsidjn`,
    resave: true,
    saveUninitialized: false
});


app.use(`/`, apiRouter);
app.use(`/`, authRouter);
app.use(`/`, indexRouter);
app.use(expressSession);

// Authentication for global app.
const passport = require(`passport`);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

// Serve the static directory.
app.use(express.static(config.staticDir));
app.use(`/ads.txt`, express.static(`ads.txt`)); // Static ad loader.

// Data for server selection list.
app.get(`/get_servers`, (req, res) => res.jsonp(app.workers));

// Create the webfront server.
let server = config.mode == `dev` ? http.createServer(app): https.createServer({
    key: fs.readFileSync(config.ssl.keyPath),
    cert: fs.readFileSync(config.ssl.certPath),
    requestCert: false,
    rejectUnauthorized: false
}, app); 

// Direct socket.io for admins.
if(process.env.NODE_ENV == `test-server`) global.io = require(`socket.io`)(server, { origins: `*:*` });
else global.io = require(`socket.io`)(server, { origins: `*:*` }).listen(`2000`);


// Use the rollbar error handler to send exceptions to your rollbar account
app.use(rollbar.errorHandler());

// Bind the webfront.
server.listen(config.port);
log(`green`, `Webfront bound to port ${config.port}.`);

// export server because socket.io needs it
module.exports = {
    server,
    io: global.io,
    app
}
