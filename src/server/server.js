/*
This is the Express app setup file. It controls what is served from the server.
Note that the app must be exported to be used by socket.io.
*/

let config = require(`./config/config.js`);
let log = require(`./utils/log.js`);

const fs = require(`fs`);
let express = require(`express`);
const User = require(`./models/user.model.js`);

let https = require(`https`);
let http = require(`http`);

let app = express();

let compression = require(`compression`);
let flash = require(`connect-flash`);

let Rollbar = require(`rollbar`);
let rollbar = new Rollbar(`fa0cd86c64f446c4bac992595be24831`);

const bodyParser = require(`body-parser`);
const dotenv = require(`dotenv`).config();
const path = require(`path`);

let authRouter = require(`./routes/auth.js`);
let indexRouter = require(`./routes/index.js`);

app.use(`/`, authRouter);
app.use(`/`, indexRouter);


app.use((req, res, next) => {
    if(req.path.includes(`/assets/img`)) res.header(`Cache-Control`, `public, max-age=86400`); // Cache images for one day.

    res.header(`Access-Control-Allow-Credentials`, true);
    res.header(`Access-Control-Allow-Origin`, `*`);
    res.header(`Access-Control-Allow-Methods`, `POST, GET, OPTIONS, PUT, DELETE, PATCH, HEAD`);
    res.header(`Access-Control-Allow-Headers`, `Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept`);

    req.method.toLowerCase() == `options` ? res.sendStatus(200): next();
});

app.use(compression());
app.use(flash());

app.use(bodyParser.json({ limit: `50mb` }));
app.use(bodyParser.urlencoded({ limit: `5mb`, extended: true }));

app.set(`views`, path.resolve(__dirname, `views`));
app.set(`view engine`, `ejs`);

// Serve static files.
app.use(express.static(`${__dirname}/../../dist`));
app.use(`/ads.txt`, express.static(`ads.txt`));

// Create server.
let server = config.port == 8080 ? http.createServer(app): https.createServer({
    key: fs.readFileSync(config.ssl.keyPath),
    cert: fs.readFileSync(config.ssl.certPath),
    requestCert: false,
    rejectUnauthorized: false
}, app);

global.io = process.env.NODE_ENV == `test-server` ? require(`socket.io`)(server, { origins: `*:*` }): require(`socket.io`)(server, { origins: `*:*` }).listen(2001);

console.log(global.io);

let httpServer = express();
httpServer.get(`*`, (req, res, next) => res.redirect(`https://${req.headers.host + req.url}`));
httpServer.listen(80);

// Get servers.
app.get(`/get_servers`, (req, res) => res.jsonp(app.workers));

app.get(`/wall-of-fame`, async(req, res) => {
    let wofPlayers = await User.find({}).sort({ highscore: -1 }).limit(20);
    res.jsonp(wofPlayers);
});

server.listen(config.port);
log(`green`, `App is listening on port ${config.port}.`);

// Use rollbar.
app.use(rollbar.errorHandler());

// Export data.

module.exports = {
    server,
    io: global.io,
    app
}
