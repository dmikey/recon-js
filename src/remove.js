'use strict';

function remove(record, key) {
  if (isRecord(record)) removeRecord(record, key);
  else if (isObject(record)) removeObject(record, key);
}

module.exports = remove;