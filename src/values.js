'use strict';

function values(record) {
  var values = [];
  var key;
  if (isRecord(record)) {
    for (var i = 0, n = record.length; i < n; i += 1) {
      var item = record[i];
      if (isField(item)) {
        key = item.$key;
        if (key !== undefined) {
          values.push(item.$value);
        }
        else {
          for (key in item) {
            values.push(item[key]);
          }
        }
      }
      else {
        values.push(item);
      }
    }
  }
  else if (isObject(record)) {
    for (key in record) {
      values.push(record[key]);
    }
  }
  return values;
}

module.exports = values;