'use strict';

function compareData(x, y) {
  var p = x.length;
  var q = y.length;
  for (var i = 0, n = Math.min(p, q), order = 0; i < n && order === 0; i += 1) {
    order = x[i] - y[i];
  }
  return order > 0 ? 1 : order < 0 ? -1 : p > q ? 1 : p < q ? -1 : 0;
}

module.exports = compareData;