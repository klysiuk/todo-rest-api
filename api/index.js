'use strict';

const koa = require('koa');
const logger = require('koa-logger');
const route = require('koa-route');
const jwt = require('jsonwebtoken');

const config = require('../config').todo
const controllers = require('./todos');
const userManagement = require('./user-management');

var app = module.exports = koa();

app.use(function * (next) {
	// clear user name
	delete this.app.context.userId;
	try {
		let ContentType = this.get('Content-Type');
		if (!ContentType || ContentType == 'application/json') {
			yield next;
		} else {
			this.throw(400, 'API supports application-json format');
		}
	} catch(e) {
		// check if mongoose validation failed
		if (e.name == 'ValidationError') {
			e.statusCode = 400;
			e.reason = e.errors;
		}
		this.app.emit('error', e, this);
	}
});
app.use(function * (next) {
	// allow access to /user/* routes without token
	if (this.url.match(/\/user\/(.*)/i)) {
		yield next;
	} else {
		// token verification
		let token = this.get('X-Access-Token');
		if (!token) {
			this.throw(403, 'Not authorized. Provide token.')
		}
		let verifiedToken = yield new Promise((resolve) => {
			jwt.verify(token, this.secret, (err, decoded) => {
				if (err) {
					resolve(false)
				} else {
					resolve(decoded);
				}
			});
		});

		if (verifiedToken) {
			this.app.context.userId = verifiedToken.id;
			yield next;
		} else {
			this.throw(403, 'Wrong token');
		}
	}
});
// user management
app.use(route.post('/user/signup', userManagement.signup));
app.use(route.post('/user/signin', userManagement.signin));
// temp
//app.use(route.delete('/user', userManagement.removeAllUsers));
//app.use(route.delete('/user/db', userManagement.dropDB ));
//app.use(route.get('/user', userManagement.getUsersList));

// api prefixes
app.use(route.get('/todos',controllers.getTodosList));
app.use(route.post('/todos',controllers.addTodo));
app.use(route.put('/todos',controllers.unsupportedOperation({
	status: 400,
	text: 'Not possible to PUT the todo list. You can update todo by concrete id'
})));
app.use(route.delete('/todos',controllers.removeAllTodos));
app.use(route.get('/todos/:id', controllers.getTodo));
app.use(route.post('/todos/:id', controllers.unsupportedOperation({
	status: 400,
	text: 'Not possible to POST to existent todo. If you want to update it use PUT method'
})));
app.use(route.put('/todos/:id', controllers.updateTodo));
app.use(route.delete('/todos/:id',controllers.removeTodo));
app.use(route.get('/tags', controllers.getTags));


// // global error handling
// app.on('error', function(err, app){
// 	var reason = [];
// 	// collect concrete errors from DB validation
// 	// make this more universal
// 	if (err.reason) {
// 		Object.keys(err.reason).forEach(field => {
// 			let message = err.reason[field].message;
// 			reason.push(message);
// 		})
// 	}
// 	var response = {
// 		status: 'error',
// 		name: err.name || '',
// 		message: err.message || 'error happened',
// 		reason: reason
// 	};
// 	app.status = err.statusCode || 500;
// 	// show all errors with full desciption on dev env and only not 500 on production
// 	if (this.env == 'development' || app.status !== 500) {
// 		app.body = response;
// 	}
// 	else {
// 		app.body = {
// 			status: 'error',
// 			name: 'Internal Server Error',
// 			message: 'Internal Server Error'
// 		};
// 	}
// });
