'use strict';

var compareData = require('./comparedata');
var compareRecord = require('./comparerecord');
var compareFields = require('./comparefields');

function compare(x, y) {
  if (x === true) x = 'true';
  else if (x === false) x = 'false';
  if (y === true) y = 'true';
  else if (y === false) y = 'false';

  if (x === undefined) {
    if (y === undefined) return 0;
    else return 1;
  }
  else if (x === null) {
    if (y === undefined) return -1;
    else if (y === null) return 0;
    else return 1;
  }
  else if (typeof x === 'number') {
    if (y === undefined || y === null) return -1;
    else if (typeof y === 'number') return x < y ? -1 : x > y ? 1 : 0;
    else return 1;
  }
  else if (typeof x === 'string') {
    if (y === undefined || y === null || typeof y === 'number') return -1;
    else if (typeof y === 'string') return x < y ? -1 : x > y ? 1 : 0;
    else return 1;
  }
  else if (x instanceof Uint8Array) {
    if (y === undefined || y === null || typeof y === 'number' || typeof y === 'string') return -1;
    else if (y instanceof Uint8Array) return compareData(x, y);
    else return 1;
  }
  else if (Array.isArray(x)) {
    if (y === undefined || y === null || typeof y === 'number' || typeof y === 'string' ||
        y instanceof Uint8Array) return -1;
    else if (Array.isArray(y)) return compareRecord(x, y);
    else return 1;
  }
  else {
    if (y === undefined || y === null || typeof y === 'number' || typeof y === 'string' ||
        y instanceof Uint8Array || Array.isArray(y)) return -1;
    else return compareFields(x, y);
  }
}

module.exports = compare;