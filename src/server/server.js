// Configuration.
const config = require(`./config/config.js`);
const dotenv = require(`dotenv`).config();

// Utilities.
const log = require(`./utils/log.js`);
const fs = require(`fs`);

// HTTP / HTTPS transport protocols.
const https = require(`https`);
const http = require(`http`);

// Express app.
const express = require(`express`);
const app = express();

// Express middleware.
const session = require(`express-session`);
const bodyParser = require(`body-parser`);
const compression = require(`compression`);
const flash = require(`connect-flash`);

// Passport.
const passport = require(`./passport.js`);

// Database connection.
const MongoStore = require(`connect-mongo`)(session);
const mongoose = require(`mongoose`);
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => log(`green`, `User authentication has connected to database.`));

// Define express routes.
let apiRouter = require(`./routes/api`);
let authRouter = require(`./routes/auth`);
let indexRouter = require(`./routes/index`);

// Set headers.
app.use((req, res, next) => {
    if (req.path.includes(`/assets/img/`)) { // Caching pictures. (Maybe someone knows a better option)
        res.header(`Cache-Control`, `public, max-age=86400`);
    }
    res.header(`Access-Control-Allow-Credentials`, true);
    res.header(`Access-Control-Allow-Origin`, `*`);
    res.header(`Access-Control-Allow-Methods`, `POST, GET, OPTIONS, PUT, DELETE, PATCH, HEAD`);
    res.header(`Access-Control-Allow-Headers`, `Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept`);
    req.method.toLowerCase() == `options` ?
        res.sendStatus(200) :
        next();
});

// Express session.
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

// Passport middleware.
app.use(passport.initialize());
app.use(passport.session());

// Express middleware.
app.use(compression());
app.use(flash());
app.use(bodyParser.json({
    limit: `50mb`
}));
app.use(bodyParser.urlencoded({
    limit: `50mb`,
    extended: true
}));

// Set view engine.
app.set(`views`, `${__dirname}/views`);
app.set(`view engine`, `ejs`);

// Serve the static directory.
app.use(express.static(config.staticDir));
app.use(`/ads.txt`, express.static(`ads.txt`)); // Static ad loader.

// Use routes.
app.use(`/api`, apiRouter);
app.use(`/`, authRouter);
app.use(`/`, indexRouter);

// Data for server selection list.
app.get(`/get_servers`, (req, res) => res.jsonp(app.workers));

// Create the webfront.
let server = config.mode == `dev` ? http.createServer(app) : https.createServer({
    key: fs.readFileSync(config.ssl.keyPath),
    cert: fs.readFileSync(config.ssl.certPath),
    requestCert: false,
    rejectUnauthorized: false
}, app);

// Define socket.io for admins.
if (process.env.NODE_ENV == `test-server`) global.io = require(`socket.io`)(server, {
    origins: `*:*`
});
else global.io = require(`socket.io`)(server, {
    origins: `*:*`
}).listen(`2000`);

// Bind the webfront to defined port.
server.listen(config.port);
log(`green`, `Webfront bound to port ${config.port}.`);

// Export the server for socket.io.
module.exports = {
    server,
    io: global.io,
    app
}