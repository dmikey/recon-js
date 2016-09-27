'use strict';

function compareRecord(x, y) {
  var p = x.length;
  var q = y.length;
  for (var i = 0, n = Math.min(p, q), order = 0; i < n && order === 0; i += 1) {
    order = compare(x[i], y[i]);
  }
  return order !== 0 ? order : p > q ? 1 : p < q ? -1 : 0;
}

module.exports = compareRecord;