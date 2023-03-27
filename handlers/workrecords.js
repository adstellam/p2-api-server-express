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
		const sql = 'SELECT * FROM workrecords';
		pgPool.query(sql, (err, result) => { 
			if (err) 
				next(new Error(err));
			else {
				console.log(result.rows);
				res.status(200).json(result.rows); //array
			}
		});
	}
	if (req.query) {
		const _ = req.query;
		const sql = 'SELECT * FROM workrecords WHERE oid = $1 AND grower_id = $2 AND field_id = $3 AND machine_id = $4 AND op_type = $5 AND date = $6;';
		const val = [_.oid, _.grower_id, _.field_id, _.machine_id, _.op_type, _.date];
		pgPool.query(sql, val, (err, result) => { 
			if (err)
				next(new Error(err));
			else {
				console.log(result.rows);
				res.status(200).json(result.rows); //array
			}
		});
	}
});

router.post('/', function(req, res, next) {
	const _ = req.body;
	const sql = 'INSERT INTO workrecords (id, oid, grower_id, field_id, machine_id, op_type, date, work_status, work_start_time_ms, work_stop_time_ms) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id;';
	const val = [_.id, _.oid, _.grower_id, _.field_id, _.machine_id, _.op_type, _.date, _.work_status, _.work_start_time_ms, _.work_stop_time_ms];
	pgPool.query(sql, val, (err, result) => { 
		if (err) 
			next(new Error(err));
		else {
			console.log(result.rows);
			if (result.rows.length > 0) 
				res.status(201).json(result.rows[0].id)// the value of id
			else 
				res.status(409).json(null); //409
		}
	});
});

/**
 * Route handlers for '/:id'
 */
router.get('/:id', function(req, res, next) {
	pgPool.query('SELECT * FROM workrecords WHERE id = $1;', [req.params.id], (err, result) => {
		if (err) 
			next(new Error(err));
		else {
			console.log(result.rows); //array
			if (result.rows.length > 0)
				res.status(200).json(result.rows[0]); //a WorkRecord object
			else
				res.status(200).json(null) //null
		}
	});
});

router.patch('/:id', (req, res, next) => {
	const _ = req.body;
	const sql = 'UPDATE workrecords SET work_status = $1, work_stop_time_ms =  $2 WHERE id = $3 RETURNING id;';
	const val = [_.work_status, _.work_stop_time_ms, req.params.id];
	pgPool.query(sql, val, (err, result) => { 
		if (err) 
			next(new Error(err));
		else {
			console.log(result.rows); //array
			if (result.rows.length > 0)
				res.status(201).json(result.rows[0].id); //the value of id
			else
				res.status(409).json(null); //409
		}
	});
});

router.delete('/:id', function(req, res, next) {
	
});

/**
 * Module.exports
 */
module.exports = router;