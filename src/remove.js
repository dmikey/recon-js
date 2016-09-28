'use strict';

var isRecord = require('./isrecord');
var isObject = require('./isobject');
var removeRecord = require('./removerecord');
var removeObject = require('./removeobject');

function remove(record, key) {
  if (isRecord(record)) removeRecord(record, key);
  else if (isObject(record)) removeObject(record, key);
}

module.exports = remove;