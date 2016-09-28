'use strict';

var coerceValue = require('./coercevalue');
var isRecord = require('./isrecord');
var setRecord = require('./setrecord');
var isObject = require('./isobject');
var setObject = require('./setobject');

function set(record, key, value) {
  value = coerceValue(value);
  if (isRecord(record)) setRecord(record, key, value);
  else if (isObject(record)) setObject(record, key, value);
}

module.exports = set;