/**
 * Module dependencies & dotenv configuration
 */
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const awsJwtVerify = require('aws-jwt-verify');
const pg = require('pg');
const dotenv = require('dotenv'); 

dotenv.config(); 

/**
 * Postgresql connection
 */
const pgPool = new pg.Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
});
console.log(`Postgres listening at ${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`);

/**
 * Create the Express app
 */
const app = express();

/**
 * Prepare the Express app for cors and cookie-parser
 */
const corsOrigins = ['http://localhost', 'http://localhost:4200'];
const corsOptions = {
    origin: (origin, done) => {
        if (corsOrigins.includes(origin) || !origin) {
            done(null, true);
        } else {
            done(new Error(`Not allowed by CORS for Origin ${origin}`));
        }
    },
    credentials: true
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser());
app.use(express.json());

/**
 * Log the method, path, query, and body of each request.
 */
 app.use((req, res, next) => {
    console.log(new Date(), req.method, req.path, req.query, req.body);
    next();
 });

/**
 * Append idToken, accessToken, and publicKey to req.
 */
app.use((req, res, next) => {
    const vouchCookie = req.cookies['VouchCookie'];
    if (vouchCookie) {
        const vouchCookiePayload = JSON.parse(Buffer.from(vouchCookie.split('.')[1], 'base64').toString());
        req.idToken = vouchCookiePayload.PIdToken;
        req.accessToken = vouchCookiePayload.PAccessToken;
    }
    next();
});

/**
 * Define the Authorize middleware
 */
const authorize = (req, res, next) => {
    const verifier = awsJwtVerify.CognitoJwtVerifier.create({
        userPoolId: "us-west-1_goOf6vmgD",
        clientId: "7nt8dpajun8m3vk34a8s74ain1",
        tokenUse: "access"
    });
    verifier.verify(req.accessToken)
        .then(payload => { 
            pgPool.query('SELECT * FROM users WHERE uid = $1;', [payload['username']], (err, result) => { 
                if (err) 
                    res.status(403).json();
                if (result.rows[0].roles) 
                    next();
                else 
                    res.status(403).json(null);
            });
        })
        .catch(error => {
            res.status(403).json(null);
        });
};

/**
 * Import route handlers
 */
const userInfoHandler = require ('/handlers/user_info');
const machinesHandler = require('./handlers/machines');
const fieldsHandler = require('./handlers/fields');
const workRecordsHandler = require('/handlers/workrecords');
const plantTypesHandler = require('./handlers/plant_types');
//const LotsRte = require('./routes/Lots');

/**
 * Configure Express app with routes.
 */
app.use('/api/user_info', userInfoHandler);
app.use('/api/machines', authorize, machinesHandler);
app.use('/api/machines', fieldsHandler);
app.use('/api/workrecords', authorize, workRecordsHandler);
app.use('/api/plant_types', plantTypesHandler);
//app.use('/api/lots', authorize, lotsHandler);

/**
 * Use default error handler.
 */
app.use(function(err, req, res, next) {
    console.log(err);
    res.status(561).json();
});

/**
 * Export the configured Express app.
 */
module.exports = app;
