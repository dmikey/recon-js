'use strict';

function equalRecord(x, y) {
  var n = x.length;
  if (n !== y.length) return false;
  for (var i = 0; i < n; i += 1) {
    if (!equal(x[i], y[i])) return false;
  }
  return true;
}

module.exports = equalRecord;