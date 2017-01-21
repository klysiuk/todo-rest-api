'use strict';

const config = require('../config').todo.dbConfig;
const mongoose = require('mongoose');
const shortid = require('shortid');
const uniqueValidator = require('mongoose-unique-validator');

// connect to db
const url = `mongodb://${config.host}:${config.port}/${config.dbName}`;
mongoose.connect(url, err => {
	if (err) {
		console.log('db connection error', err);
	} else {
		console.log('db connection successful');
	}
});

//------------ db definition of schemas and model
var Schema = mongoose.Schema;

var TodoSchema = new Schema({
	_id: {
		type: String,
		unique: true,
		'default': shortid.generate
	},
	name: {
		type: String,
		required: [true, 'Name of todo item is required']
	},
	status: {
		type: String,
		//enum : ['new', 'progress', 'completed'],
		default : 'new',
		lowercase: true,
		trim: true,
		validate: {
			validator: function(v) {
			 return /new|progress|completed/i.test(v);
			},
			message: 'Status {VALUE} is not valid. Choose among new, progress, completed.'
		}
	},
	priority: {
		type: String,
		//enum : ['low', 'medium', 'high'],
		default : 'low',
		lowercase: true,
		trim: true,
		validate: {
			validator: function(v) {
			 return /low|medium|high/i.test(v);
			},
			message: 'Priority {VALUE} for todo item is not valid. Choose among low, medium, high.'
		}
	}
});

var TodoListSchema = new Schema({
	_id: {
		type: String,
		unique: true,
		'default': shortid.generate
	},
	name: {
		type: String,
		required: [true, 'Name of todo list is required']
	},
	description: String,
	priority: {
		type: String,
		default : 'low',
		lowercase: true,
		trim: true,
		validate: {
			validator: function(v) {
			 return /low|medium|high/i.test(v);
			},
			message: 'Priority {VALUE} is not valid. Choose among low, medium, high.'
		}
	},
	items: {
		type: [TodoSchema],
		required: [true, 'At least one todo item should be provided']
	},
	category: {
		type: String,
		validate: {
			validator: function(v) {
			//test against existent categories
			// ? makes sense to store them in some variable
			//return true/false;
			return true;
			},
			message: 'Category {VALUE} does not exist'
		}
	},
	tags: [String],
	_creator : { type: Number, ref: 'User' },
},{
	// adds  "updatedAt", "createdAt" fields
	timestamps: true,
	id: false,
	toJSON: {
		virtuals: true
	}
});

//------------ methods

TodoListSchema.statics.findItemById = function(id) {
	return this.findById(id).exec();
}

TodoListSchema.statics.getAllSelected = function(dbQuery) {
	return this.find(dbQuery).select('name description priority items category tags updatedAt createdAt').exec();
}

TodoListSchema.statics.getOne = function(id) {
	return this.findOne({ '_id': id }).select('name description priority items category tags').exec();
}

TodoListSchema.statics.getTags = function() {
	return this.aggregate([{$unwind: '$tags'},{$group: {_id: '$tags','name': { '$first': '$tags' }, count: {$sum: 1}}}]).exec();
}

TodoListSchema.statics.addTodo = function(item, userId) {
	return this.create(item);
}

TodoListSchema.statics.updateTodo = function(id, update) {
	let options = {
		// return modified doc
		new: true,
		runValidators: true,
	}
	return this.findOneAndUpdate({ '_id': id }, update, options).exec();
}

TodoListSchema.statics.removeAll = function() {
	return this.remove({}).exec();
}

TodoListSchema.statics.removeItem = function(id) {
	return this.findByIdAndRemove(id).exec();
}


var UserSchema = new Schema({
	name: {
		type: String,
		unique: true,
		required: true,
		validate: {
			validator: function(v) {
				return v.length >= 4;
			},
			message: 'User name should contain at least 4 chars.'
		}
	},
	password: {
		type: String,
		required: true,
		validate: {
			validator: function(v) {
				return v.length >= 6;
			},
			message: 'Password should contain at least 6 chars.'
		}
	},
	todos : [{ type: Schema.Types.ObjectId, ref: 'Todo' }]
});

UserSchema.plugin(uniqueValidator);

UserSchema.statics.addUser = function(user) {
	return this.create(user);
}

UserSchema.statics.verifyUserExists = function(name) {
	return this.findOne({'name' : name}).exec();
}

UserSchema.statics.getAllSelected = function(name) {
	return this.find({}).select('name').exec();
}

UserSchema.statics.removeAll = function(name) {
	return this.remove({}).exec();
}

UserSchema.statics.dropDB = function() {
	return new Promise((resolve) => {
		mongoose.connection.db.dropDatabase((err,result) => {
			console.log('drop db');
			resolve(true);
		})
	})
}

module.exports.Todo = mongoose.model('Todo',TodoListSchema);
module.exports.User = mongoose.model('User',UserSchema);
