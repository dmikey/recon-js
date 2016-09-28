'use strict';

var coerceValue = require('./coercevalue');
var coerceRecord = require('./coercerecord');

function coerce() {
  if (arguments.length === 1) return coerceValue(arguments[0]);
  else if (arguments.length > 1) return coerceRecord(arguments);
}

module.exports = coerce;