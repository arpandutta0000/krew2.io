/*
This is the Express app setup file. It controls what is served from the server.
Note that the app must be exported to be used by socket.io.
*/

// Configuration
const { config } = require(`./config.js`);
const dotenv = require(`dotenv`).config();

// Dependencies
const express = require(`express`);
const http = require(`http`);
const https = require(`https`);
const flash = require(`connect-flash`);
const compression = require(`compression`);
const bodyParser = require(`body-parser`);
const fs = require(`fs`);
const socketIO = require(`socket.io`);

// Create app.
let app = express();

// Routes.
const authRouter = require(`./routes/auth.js`);
const indexRouter = require(`./routes/index.js`);

// Load passport.
const passport = require(`passport`);
const Auth0Strategy = require(`passport-auth0`);

const { auth } = require(`express-openid-connect`);

// Auth0 configuration.
const auth0Config = {
    authRequired: false,
    auth0Logout: true,
    secret: undefined,
    baseURL: `https://${config.domain}`,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: `https://${process.env.AUTH0_CUSTOM_DOMAIN}`
}

// Configure express session.
const expressSession = require(`express-session`);
let session = {
    secret: process.env.AUTH0_SESSION_SECRET,
    cookie: {
        path: `/`,
        _expires: null,
        originalMaxAge: null,
        httpOnly: true
    },
    resave: false,
    saveUnitialized: false
}
app.use(expressSession(session));

// Configure passport for Auth0.
let strategy = new Auth0Strategy({
    domain: process.env.AUTH0_CUSTOM_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL || `https://${config.domain}/callback`
});

// Middleware.
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

app.get(`/get_servers`, (req, res) => res.jsonp(app.workers));

app.listen(config.port, () => console.log(`Server is running on port ${config.port}.`));