'use strict';

var isRecord = require('./isrecord');
var isField = require('./isfield');
var isObject = require('./isobject');

function forEach(record, callback, thisArg) {
  var key, value;
  if (isRecord(record)) {
    for (var i = 0, n = record.length; i < n; i += 1) {
      var item = record[i];
      if (isField(item)) {
        key = item.$key;
        if (key !== undefined) {
          value = item.$value;
          callback.call(thisArg, value, key, record);
        }
        else {
          for (key in item) {
            value = item[key];
            callback.call(thisArg, value, key, record);
          }
        }
      }
      else {
        callback.call(thisArg, item, undefined, record);
      }
    }
  }
  else if (isObject(record)) {
    for (key in record) {
      value = record[key];
      callback.call(thisArg, value, key, record);
    }
  }
}

module.exports = forEach;