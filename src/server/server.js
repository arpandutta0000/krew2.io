/*
This is the Express app setup file. It controls what is served from the server.
Note that the app must be exported to be used by socket.io.
*/

// Configuration
const config = require(`../config.js`);

// Dependencies
const express = require(`express`);
const http = require(`http`);
const https = require(`https`);
const flash = require(`connect-flash`);
const compression = require(`compression`);
const bodyParser = require(`body-parser`);
const axios = require(`axios`);
const fs = require(`fs`);
const socketIO = require(`socket.io`);

// Create app.
let app = express();

// Enable compressor to reduce load times.
app.use(compression);
app.use(flash);

// Enable body parser.
app.use(bodyParser.json({ limit: `50mb` }));
app.use(bodyParser.urlencoded({ limit: `50mb`, extended: true }));

// Set the compiler.
app.set(`views`, `${__dirname}/views`);
app.set(`view engine`, `ejs`);

// Serve assets.
app.use(express.static(`${__dirname}/../client/assets`));

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
]
// Set up the application server to listen on ports.
let server = config.port == 8080 ? http.createServer(app): https.createServer({
    key: fs.existsSync(config.ssl.keyPath) ? fs.readFileSync(config.ssl.keyPath): null,
    cert: fs.existsSync(config.ssl.certPath) ? fs.readFileSync(config.ssl.certPath): null,
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
let io = config.port == 8080 ? socketIO(server, { origins: `*:*` }): socketIO(server, { origins: `*:*` }).listen(2000);

app.get(`/get_servers`, (req, res) => res.jsonp(app.workers));
