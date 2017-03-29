module.exports = function(io){

	var express = require('express'),
	router = express.Router();

	router.get('/', ensureAuthenticated, function(req, res){
		res.render('index');

	});

	function ensureAuthenticated(req, res, next){
		if(req.isAuthenticated()){
			return next();
		} else {
			res.redirect('/users/login');
		}
	}
	return router;
	};

