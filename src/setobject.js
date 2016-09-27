'use strict';

function setObject(record, key, value) {
  if (typeof key === 'string') {
    record[key] = value;
  }
}

module.exports = setObject;