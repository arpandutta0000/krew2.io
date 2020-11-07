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
const bodyParser = require(`body-parser`);
const fs = require(`fs`);
const socketIO = require(`socket.io`);

// Use rollbar.
const Rollbar = require(`rollbar`);
let rollbar = new Rollbar(process.env.ROLLBAR_TOKEN);

// Create app.
let app = express();

// Routes.
const indexRouter = require(`./routes/index.js`);
app.use(`/`, indexRouter);

// Enable body parser.
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
app.get(`/wall-of-fame`, (req, res) => {
    let query = {}
    let fields = { _id: 0, playerName: 1, clan: 1, highscore: 1 }
    let sort = { highscore: -1 }

    mongodb.ReturnAndSort(`players`, query, fields, sort, 20, callback => res.jsonp(callback));
});

// Admin panel.
app.get(`/thug_life`, (req, res) => res.render(`index_thuglife.ejs`));

// Listen on port for incoming requests.
server.listen(config.port, () => console.log(`Server is running on port ${config.port}.`));

// Export server for use in other serverside files.
exports.server = server;
exports.io = global.io;
exports.app = app;