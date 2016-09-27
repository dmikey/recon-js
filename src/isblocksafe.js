'use strict';

function isBlockSafe(record) {
  for (var i = 0, n = record.length; i < n; i += 1) {
    if (isAttr(record[i])) return false;
  }
  return true;
}

module.exports = isBlockSafe;