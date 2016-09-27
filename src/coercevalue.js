'use strict';

function coerceValue(value) {
  if (isRecord(value)) return coerceRecord(value);
  else if (isObject(value)) return coerceObject(value);
  else return value;
}

module.exports = coerceValue;