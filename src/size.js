'use strict';

var isObject = require('./isobject');
var isRecord = require('./isrecord');

function size(value) {
  if (isRecord(value)) return value.length;
  else if (isObject(value)) return Object.keys(value).length;
  else return 0;
}

module.exports = size;