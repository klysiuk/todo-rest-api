'use strict';

const parse = require('co-body');

var Todo = require('./models').Todo;
var helpers = require('./helpers');

// controllers
var controllers = {};

controllers.getTodosList = function * (next) {
	if ('GET' != this.method) return yield next;

	var query = this.query;
	var schema = Todo.schema.paths;
	var dbQuery = {};
	Object.keys(query).forEach((field) => {
		if (helpers.isSchemaField(field, schema)) {
			let value = query[field];
			let values = value.split(',');
			if (values.length > 1) {
				dbQuery[field] = { $in: values };
			} else {
				dbQuery[field] = value;
			}
		}
	});
	this.body = yield Todo.getAllSelected(dbQuery);
}

controllers.getTodo = function * (id, next) {
	if ('GET' != this.method) return yield next;
	var result = yield Todo.getOne(id);
	if (!result) {
		this.throw(404, 'Requested item not found');
	}
	this.body = result;
}

controllers.addTodo = function * (next) {
	if ('POST' != this.method) return yield next;
	// 100kb in config ???
	// can we avoid catch here?
	try {
		var item = yield parse.json(this, {
			limit: '100kb',
			strict: true
		});
	}
	catch(e) {
		this.throw(400, 'Invalid json. Check if it is correct and does not exceed 100kb');
	}

	let errors = helpers.validateInput(item, Todo.schema.paths);
	if (errors) {
		this.throw(errors.status, errors.message);
	}

	let added = yield Todo.addTodo(item);
	if (!added) {
		this.throw(400, 'Todo couldn\'t be created');
	}

	this.status = 201;
	this.body = added;
}

controllers.updateTodo = function * (id, next) {
	if ('PUT' != this.method) return yield next;

	try {
		var item = yield parse.json(this, {
			limit: '100kb',
			strict: true
		});
	} catch(e) {
		this.throw(400, 'Invalid json. Check if it is correct and does not exceed 100kb');
	}

	let found = yield Todo.findItemById(id);
	if (!found) {
		this.throw(404, 'item with specified id does not exist');
	}

	let updated = yield Todo.updateTodo(id, item);
	if (!updated) {
		this.throw(405, 'Unable to update');
	} else {
		this.body = updated;
	}
}

controllers.removeAllTodos = function * (next) {
	if ('DELETE' != this.method) return yield next;
	var removed = yield Todo.removeAll();
	if (!removed) {
		this.throw(405, 'Unable to delete');
	} else {
		this.body = 'Done';
	}
}
// somehow merge with upper one?
controllers.removeTodo = function * (id, next) {
	if ('DELETE' != this.method) return yield next;

	let found = yield Todo.findItemById(id);
	if (!found) {
		this.throw(404, 'item with specified id does not exist');
	}

	let removed = yield Todo.removeItem(id);
	if (!removed) {
		this.throw(405, 'Unable to delete');
	} else {
		this.body = 'Done';
	}
}

controllers.getTags = function * (next) {
	if ('GET' != this.method) return yield next;

	var tags = yield Todo.getTags();
	if (!tags) {
		this.throw(405, 'Unable to get tags');
	} else {
		this.body = tags;
	}
}

controllers.unsupportedOperation = function (params) {
	return function * (next) {
		this.throw(params.status, params.text);
	}
}

module.exports = controllers;
