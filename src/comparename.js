'use strict';

function compareName(x, y) {
  var p = x.length;
  var q = y.length;
  if (p > 0 && q > 0) {
    var x0 = x.charCodeAt(0);
    var y0 = y.charCodeAt(0);
    if (x0 === 64/*'@'*/ && y0 !== 64/*'@'*/) return -1;
    else if (x0 !== 64/*'@'*/ && y0 === 64/*'@'*/) return 1;
    else return x < y ? -1 : x > y ? 1 : 0;
  }
  else if (p > 0) return 1;
  else if (q > 0) return -1;
  else return 0;
}

module.exports = compareName;