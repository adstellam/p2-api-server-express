/**
 * Module dependencies & dotenv configuration
 */
const express = require('express');
const pg = require('pg');
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

/**
 * Route handlers for '/'
 */
router.get('/', function(req, res, next) {
	if (!req.query) {
		pgPool.query('SELECT * FROM cultivators;', (err, result) => { 
			if (err) 
				next(new Error(err));
			else {
				console.log(result.rows);
				res.status(200).json(result.rows); //array
			}
		});
	} 
	if (req.query.oid) {
		pgPool.query('SELECT * FROM cultivators WHERE oid = $1;', [req.query.oid], (err, result) => { 
			if (err) 
				next(new Error(err));
			else {
				console.log(result.rows);
				res.status(200).json(result.rows); //array
			}
		});
	}
	
});

/**
 * Route handlers for '/:mid'
 */
router.get('/:mid', function(req, res, next) {
	pgPool.query('SELECT * FROM cultivators WHERE cid = $1;', [req.params.mid], (err, result) => {
		if (err) 
			next(new Error(err));
		else {
			console.log(result.rows); //array
			if (result.rows.length > 0)
				res.status(200).json(result.rows[0]); //a Machine object
			else
				res.status(200).json(null) //null
		}
	});
});

router.post('/:mid', (req, res, next) => {
	
});

router.put('/:mid', (req, res, next) => {
	
});

router.patch('/:mid', function(req, res, next) {
	
});

router.delete('/:mid', function(req, res, next) {
	
});

/**
 * Route handlers for '/:mid/trace'
 */
router.get('/:mid/trace', function(req, res, next) {
	if (!req.query)
		// Result for the current hour
		pgPool.query('SELECT s_concat_trace($1, $2, $3)', [req.params.mid, new Date().toISOString(), new Date().toISOString()], (err, result) => {
			if (err) 
				next(new Error(err));
			else {
				console.log(result.rows); //[{ s_concat_trace: {type: val, coordinates: val[]} }, . . ] | []
				if (result.rows.length > 0 && result.rows[0].s_concat_trace) 
					res.status(200).json(result.rows[0].s_concat_trace.coordinates); //array
				else
					res.status(200).json([]); //array
			}
		});
	if (req.query.ts_begin) {
		// Result for the period from ts_begin to ts_end
		pgPool.query('SELECT s_concat_trace($1, $2, $3)', [req.params.mid, req.query.ts_begin, req.query.ts_end ? req.query.ts_end : new Date().toISOString()], (err, result) => {
			if (err) 
				next(new Error(err));
			else {
				console.log(result.rows); //[{ s_concat_trace: {type: val, coordinates: val[]} }, . . ] | []
				if (result.rows.length > 0 && result.rows[0].s_concat_trace) {
					res.status(200).json(result.rows[0].s_concat_trace.coordinates); //array
				} else 
					res.status(200).json([]); //array
			} 
		});
	}
});

/**
 * Route handlers for '/:mid/distance'
 */
router.get('/:mid/distance', function(req, res, next) {
	if (req.query.ts_begin) {
		pgPool.query('SELECT s_calc_distance($1, $2, $3)', [req.params.mid, req.query.ts_begin, req.query.ts_end ? req.query.ts_end : new Date().toISOString()], (err, result) => {
			if (err) 
				next(new Error(err));
			else {
				console.log(result.rows); //[{ s_calc_distance: val }, . . ] | []
				if (result.rows.length > 0 && result.rows[0].s_calc_distance) 
					res.status(200).json(result.rows[0].s_calc_distance); //scalar
				else 
					res.status(200).json(null); //null
			} 
		});
	}
});

/**
 * Route handlers for '/:mid/avg_distance'
 */
 router.get('/:mid/avg_distance', function(req, res, next) {
	//req.params.mid == 'all'
	pgPool.query('SELECT s_calc_avg_distance($1, $2)', [req.query.ts_begin, req.query.ts_end ? req.body.ts_end : new Date().toISOString()], (err, result) => {
		if (err) 
			next(new Error(err));
		else {
			console.log(result.rows); //[{ s_calc_avg_distance: val }, . . ] | [] 
			if (result.rows.length > 0 && result.rows[0].s_calc_avg_distance) 
				res.status(200).json(result.rows[0].s_calc_avg_distance); //scalar
			else 
				res.status(200).json(null); //null
		}
	});
});

/**
 * Route handlers for '/:mid/pos'
 */
router.get('/:mid/pos', function(req, res, next) {
	pgPool.query('SELECT pos FROM cultivators WHERE cid = $1', [req.params.mid], (err, result) => {
		if (err)
			next(new Error(err));
		else {
			console.log(result.rows); //[{ pos: {lon: val, lat: val, ts: val} }, . . ] | []
			if (result.rows.length > 0)
				res.status(200).json(result.rows[0].pos); //a MachinePos object
			else
				res.status(200).json(null); //null
		} 
	});
});

/**
 * Module.exports
 */
module.exports = router;