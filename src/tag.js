'use strict';

var isRecord = require('./isrecord');
var isField = require('./isfield');
var isObject = require('./isobject');

function tag(value) {
  if (isRecord(value)) {
    var header = value[0];
    if (isField(header)) return header.$key || Object.keys(header)[0];
  }
  else if (isObject(value)) return Object.keys(value)[0];
}

module.exports = tag;