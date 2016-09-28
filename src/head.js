'use strict';

var isRecord = require('./isrecord');
var isField = require('./isfield');
var isObject = require('./isobject');

function head(value) {
  if (isRecord(value)) {
    var header = value[0];
    if (isField(header)) {
      if (header.$key) return header.$value;
      else return header[Object.keys(header)[0]];
    }
    else return header;
  }
  else if (isObject(value)) return value[Object.keys(value)[0]];
  else return value;
}

module.exports = head;