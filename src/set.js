'use strict';

function set(record, key, value) {
  value = coerceValue(value);
  if (isRecord(record)) setRecord(record, key, value);
  else if (isObject(record)) setObject(record, key, value);
}

module.exports = set;