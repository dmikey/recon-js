'use strict';

var isRecord = require('./isrecord');
var isField = require('./isfield');
var isObject = require('./isobject');

function keys(record) {
  if (isRecord(record)) {
    var keys = [];
    for (var i = 0, n = record.length; i < n; i += 1) {
      var item = record[i];
      if (isField(item)) {
        var key = item.$key;
        if (key !== undefined) keys.push(key);
        else Array.prototype.push.apply(keys, Object.keys(item));
      }
    }
    return keys;
  }
  else if (isObject(record)) {
    return Object.keys(record);
  }
  else {
    return [];
  }
}

module.exports = keys;