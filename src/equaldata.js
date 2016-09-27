'use strict';

function equalData(x, y) {
  var n = x.length;
  if (n !== y.length) return false;
  for (var i = 0; i < n; i += 1) {
    if (x[i] !== y[i]) return false;
  }
  return true;
}

module.exports = equalData;