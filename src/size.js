'use strict';

function size(value) {
  if (isRecord(value)) return value.length;
  else if (isObject(value)) return Object.keys(value).length;
  else return 0;
}

module.exports = size;