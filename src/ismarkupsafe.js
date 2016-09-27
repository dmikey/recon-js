'use strict';

function isMarkupSafe(record) {
  var n = record.length;
  if (n === 0 || !isAttr(record[0])) return false;
  for (var i = 1; i < n; i += 1) {
    if (isAttr(record[i])) return false;
  }
  return true;
}

module.exports = isMarkupSafe