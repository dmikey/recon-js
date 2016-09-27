'use strict';

function removeObject(record, key) {
  if (typeof key === 'string') {
    delete record[key];
  }
}

module.exports = removeObject;