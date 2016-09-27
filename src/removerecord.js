'use strict';

function removeRecord(record, key) {
  for (var i = 0, n = record.length; i < n; i += 1) {
    var item = record[i];
    if (isField(item)) {
      if (item[key] !== undefined) {
        delete item[key];
        delete record[key];
        if (Object.keys(item).length === 0) {
          record.splice(i, 1);
          i -= 1;
          n -= 1;
        }
      }
      else if (equal(item.$key, key)) {
        record.splice(i, 1);
        i -= 1;
        n -= 1;
      }
    }
  }
}

module.exports = removeRecord;