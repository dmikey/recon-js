'use strict';

function get(record, key) {
  var i, n, item, value;
  if (typeof key === 'string') {
    value = record[key];
    if (value !== undefined) return value;
    for (i = 0, n = record.length; i < n; i += 1) {
      item = record[i];
      if (isField(item)) {
        if (item[key] !== undefined) return item[key];
        else if (equal(item.$key, key)) return item.$value;
      }
    }
  }
  else {
    for (i = 0, n = record.length; i < n; i += 1) {
      item = record[i];
      if (isField(item)) {
        if (equal(item.$key, key)) return item.$value;
      }
    }
  }
}

module.exports = get;