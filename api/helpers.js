'use strict';

module.exports.isSchemaField = function isSchemaField(field, schema) {
	return schema[field] !== undefined;
}

module.exports.validateInput = function validateInput(input, schema) {
	let extraFields = [];
	Object.keys(input).forEach((field)=>{
		if (schema[field] === undefined) {
			extraFields.push(field);
		}
	});
	if (extraFields.length) {
		return {
			status: 400,
			message: `Unrecognized field(s): ${extraFields.toString()}`
		}
	}
}
