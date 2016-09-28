'use strict';

var isRecord = require('./isrecord');
var coerceRecord = require('./coercerecord');
var isObject = require('./isobject');
var coerceObject = require('./coerceobject');

function coerceValue(value) {
  if (isRecord(value)) return coerceRecord(value);
  else if (isObject(value)) return coerceObject(value);
  else return value;
}

module.exports = coerceValue;