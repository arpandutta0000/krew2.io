/*
This is the Express app setup file. It controls what is served from the server.
Note that the app must be exported to be used by socket.io.
*/

// Configuration
const config = require(`./config/config.js`);
const dotenv = require(`dotenv`).config();

// Dependencies
const express = require(`express`);
const http = require(`http`);
const https = require(`https`);

const compression = require(`compression`);
const flash = require(`connect-flash`);
const bodyParser = require(`body-parser`);

const fs = require(`fs`);
const socketIO = require(`socket.io`);

const User = require(`./models/user.model.js`);
const log = require(`./utils/log.js`);

const Rollbar = require(`rollbar`);
const rollbar = new Rollbar(`fa0cd86c64f446c4bac992595be24831`);


// Create app.
let app = express();

// Routes.
const indexRouter = require(`./routes/index.js`);
app.use(`/`, indexRouter);

// Enable middleware.
app.use(compression());
app.use(flash());

app.use(bodyParser.json({ limit: `50mb` }));
app.use(bodyParser.urlencoded({ limit: `50mb`, extended: true }));

// Set the compiler.
app.set(`views`, `${__dirname}/views`);
app.set(`view engine`, `ejs`);

// Serve assets.
app.use(express.static(`${__dirname}/../../dist`));

// Cache images.
app.use((req, res, next) => {
    if(req.path.includes(`/assets/img/`)) res.header(`Cache-Control`, `public, max-age=86400`);

    // For embedded iframes.
    res.header(`Access-Control-Allow-Credentials`, true);
    res.header(`Access-Control-Allow-Origin`, `*`);
    res.header(`Access-Control-Allow-Methods`, `POST, GET, OPTIONS, PUT, DELETE, PATCH, HEAD`);
    res.header(`Acess-Control-Allow-Headers`, `Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept`);

    // Set HTTP status / forward page.
    req.method.toLowerCase() == `options` ? res.sendStatus(200): next();
});

// Set up the application server to listen on ports.
let server = config.port == 8080 ? http.createServer(app): https.createServer({
    key: fs.existsSync(config.ssl.key) ? fs.readFileSync(config.ssl.key): null,
    cert: fs.existsSync(config.ssl.cert) ? fs.readFileSync(config.ssl.cert): null,
    requestCert: false,
    rejectUnauthorized: false
});

// If not running in dev mode, create HTTP redirect.
if(config.port != 8080) {
    let forwarder = express();
    forwarder.get(`*`, (req, res) => res.redirect(`https://${req.url}`));
    forwarder.listen(80);
}

// Create Socket.IO service.
let io = config.port == 8080 ? socketIO(server, { origins: `*:*` }).listen(2000): socketIO(server, { origins: `*:*` }).listen(2000);

// Server info.
app.get(`/get_servers`, (req, res) => res.jsonp(app.workers));

// Wall of fame data.
app.get(`/wall-of-fame`, async(req, res) => {
    let wofPlayers = await User.find({}).sort({ highscore: -1 }).limit(20);
    res.jsonp(wofPlayers);
});

// Rollbar handler for errors in production.
app.use(rollbar.errorHandler());

// Listen on port for incoming requests.
server.listen(config.port, () => log(`green`, `Server is running on port ${config.port}.`));

// Export server for use in other serverside files.
module.exports = {
    server,
    io: global.io,
    app
}