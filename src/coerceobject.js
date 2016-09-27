'use strict';

function coerceObject(fields) {
  var keys = Object.keys(fields);
  var n = keys.length;
  var record = new Array(n);
  for (var i = 0; i < n; i += 1) {
    var key = keys[i];
    var value = coerceValue(fields[key]);
    var field = {};
    field[key] = value;
    record[i] = field;
    record[key] = value;
  }
  return record;
}

module.exports = coerceObject;