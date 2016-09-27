'use strict';

function coerceRecord(items) {
  var record = [];
  var i, n;
  for (i = 0, n = items.length; i < n; i += 1) {
    record.push(items[i]);
  }
  var keys = Object.keys(items);
  for (i = 0, n = keys.length; i < n; i += 1) {
    var key = keys[i];
    if (isNaN(parseInt(key)) && key.length > 0 && key.charCodeAt(0) !== 36/*'$'*/) {
      var value = coerceValue(items[key]);
      set(record, key, value);
    }
  }
  return record;
}

module.exports = coerceRecord;