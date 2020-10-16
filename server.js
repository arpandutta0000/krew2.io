// Require dependencies.
const express = require(`express`);
const bodyParser = require(`body-parser`);
const compression = require(`compression`);
const flash = require(`connect-flash`);
const fs = require(`fs`);
const http = require(`http`);
const https = require(`https`);
const socketIO =  require(`socket.io`);
const axios = require(`axios`);

// Configuration
let config = require(`./config`);

// Prepare to serve page
app.use((req, res, next) => {
    // Cache images
    if(req.path.includes(`/assets/img`)) res.header('Cache-Control', 'public, max-age=84600');

    // Set HTTP headers
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Acess-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE, PATCH, HEAD');
    res.header('Acess-Control-Allow-Headers', 'Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');

    // Default option data to status OK
    req.method.toLowerCase() === `options` ? res.sendStatus(200): next();
});

// Middleware
app.use(compression());
app.use(flash());

// Engines
app.use(bodyParser.json({ limit: `50mb` }));
app.use(bodyParser.urlencoded({ limit: `50mb`, extended: true }));

// Static files
app.use(express.static(`${__dirname}/src/client/assets`));

// Create HTTP server
let server = config.port == `8080` ? http.createServer(app): https.createServer({
    key: fs.readFileSync(config.ssl.key),
    cert: fs.readFileSync(config.ssl.cert),
    requestCert: false,
    rejectUnauthorized: false
});

let logged = {}

// Launch Socket.IO
if(process.env.NODE_ENV == `test-server`) global.io = socketIO(server, { origins: `*:*` });
else global.io = socketIO(server, { origins: `*:*` }).listen(`2000`);

// HTTP redirect to HTTPS
let httpServer = express();
httpServer.get(`*`, (req, res, next) => req.protocol === `http` ? res.redirect(`https://${req.headers.host + req.url}`): next());
httpServer.listen(80);

// Login
app.post(`/login`, (req, res, next) => {
    // Insert login handling here. Request has been replaced with axios in favor of promise support.
});

