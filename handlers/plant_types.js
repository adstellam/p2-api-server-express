/**
 * Module dependencies & dotenv configuration
 */
const express = require('express');
const pg = require('pg');
const dotenv = require('dotenv'); //Not to be used in building a docker image.

/**
 * Postgresql connection
 */
dotenv.config();

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

/**
 * Route handlers for '/'
 */
router.get('/', function(req, res, next) {
	pgPool.query('SELECT * FROM plant_types;', (err, result) => { 
		if (err) 
			next(new Error(err));
		else {
			console.log(result.rows);
			res.status(200).json(result.rows); //array
		}
	});
});

/**
 * Module.exports
 */
module.exports = router;