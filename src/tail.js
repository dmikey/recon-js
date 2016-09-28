'use strict';

var isRecord = require('./isrecord');
var isObject = require('./isobject');
var RecordBuilder = require('./recordbuilder');

function tail(value) {
  var i, n, builder;
  if (isRecord(value)) {
    builder = new RecordBuilder();
    for (i = 1, n = value.length; i < n; i += 1) {
      builder.appendItem(value[i]);
    }
    return builder.state();
  }
  else if (isObject(value)) {
    var keys = Object.keys(value);
    for (i = 1, n = keys.length; i < n; i += 1) {
      var key = keys[i];
      builder.appendField(key, value[key]);
    }
    return builder.state();
  }
}

module.exports = tail;