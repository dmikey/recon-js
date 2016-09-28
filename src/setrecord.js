'use strict';

var isField = require('./isfield');
var equal = require('./equal');

function setRecord(record, key, value) {
  var updated = false;
  var field;
  for (var i = 0, n = record.length; i < n; i += 1) {
    var item = record[i];
    if (isField(item)) {
      if (item[key] !== undefined) {
        item[key] = value;
        updated = true;
      }
      else if (equal(item.$key, key)) {
        item.$value = value;
        updated = true;
      }
    }
  }
  if (typeof key === 'string') {
    if (!updated) {
      field = {};
      field[key] = value;
      record.push(field);
    }
    record[key] = value;
  }
  else if (!updated) {
    field = {};
    field.$key = key;
    field.$value = value;
    record.push(field);
  }
}

module.exports = setRecord;