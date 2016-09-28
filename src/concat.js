'use strict';

var RecordBuilder = require('./recordbuilder');
var isRecord = require('./isrecord');
var isObject = require('./isobject');

function concat(x, y) {
  var builder = new RecordBuilder();
  if (isRecord(x)) builder.appendRecord(x);
  else if (isObject(x)) builder.appendFields(x);
  else if (x !== undefined) builder.appendItem(x);
  if (isRecord(y)) builder.appendRecord(y);
  else if (isObject(y)) builder.appendFields(y);
  else if (y !== undefined) builder.appendItem(y);
  return builder.state();
}

module.exports = concat;