'use strict';

const parse = require('co-body');
const jwt = require('jsonwebtoken');

var User = require('./models').User;
var helpers = require('./helpers');

// controllers
var controllers = {};

controllers.signup = function * (next) {
	if ('POST' != this.method) return yield next;
	// 100kb in config ???
	// can we avoid catch here?
	try {
		var user = yield parse.json(this, {
			limit: '100kb',
			strict: true
		});
	}
	catch(e) {
		this.throw(400, 'Invalid json. Check if it is correct and does not exceed 100kb');
	}

	let errors = helpers.validateInput(user, User.schema.paths);
	if (errors) {
		this.throw(errors.status, errors.message);
	}

	var userCreated = yield User.addUser(user);
	if (!userCreated) {
		this.throw(400, 'User couldn\'t sign up');
	}

	this.status = 201;
	this.body = 'Done';
}

controllers.signin = function * (next) {
	if ('POST' != this.method) return yield next;
	// 100kb in config ???
	// can we avoid catch here?
	try {
		var user = yield parse.json(this, {
			limit: '100kb',
			strict: true
		});
	}
	catch(e) {
		this.throw(400, 'Invalid json. Check if it is correct and does not exceed 100kb');
	}

	let errors = helpers.validateInput(user, User.schema.paths);
	if (errors) {
		this.throw(errors.status, errors.message);
	}

	let foundUser = yield User.verifyUserExists(user.name);
	if (!foundUser || foundUser.password !== user.password) {
		// 200?
		this.throw(400, 'Wrong user name or password');
	} else {
		// send token
		let token = jwt.sign({id:foundUser.id}, this.secret, {
			expiresIn: '24h' // expires in 24 hours
		});
		if (token) {
			this.status = 200;
			this.body = {
				status: 'success',
				token: token
			};
		}
	}
}

controllers.getUsersList = function * (next) {
	if ('GET' != this.method) return yield next;
	this.body = yield User.getAllSelected();
}

controllers.removeAllUsers = function * (next) {
	if ('DELETE' != this.method) return yield next;
	var removed = yield User.removeAll();
	if (!removed) {
		this.throw(400, 'Not possible to delete users')
	}
	this.body = 'Done';
}

controllers.dropDB = function * (next) {
	if ('DELETE' != this.method) return yield next;
	var removed = yield User.dropDB();
	if (!removed) {
		this.throw(400, 'Not possible to drop DB')
	}
	this.body = 'Done';
}

module.exports = controllers;
