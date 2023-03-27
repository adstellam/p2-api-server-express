/**
 * Module dependencies & dotenv configuration
 */
const express = require('express');
const pg = require('pg');
const awsJwtVerify = require('aws-jwt-verify');
const dotenv = require('dotenv'); //Not to be used in building a docker image.
 
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
 
/**
 * Express.Router initialization
 */
const router = express.Router();

router.get('/', function(req, res, next) {
    const verifier = awsJwtVerify.CognitoJwtVerifier.create({
        userPoolId: "us-west-1_goOf6vmgD",
        clientId: "7nt8dpajun8m3vk34a8s74ain1",
        tokenUse: "id"
    });
    verifier.verify(req.idToken)
        .then(payload => { 
            pgPool.query('SELECT * FROM users WHERE uid = $1;', [payload['cognito:username']], (err, result) => { 
                if (err) 
                    next(new Error(err)); 
                else {
                    console.log(result.rows);
                    if (result.rows.length > 0)
                        res.status(200).json({ uid: result.rows[0].uid, oid: result.rows[0].oid, roles: result.rows[0].roles }); //a UserInfo object
                    else 
                        res.status(403).json(null); //403
                }
            });
        })
        .catch(error => {
            console.log(error);
            res.status(403).json(null); //403
        });
    });
/**
 * Module.exports
 */
 module.exports = router;
 