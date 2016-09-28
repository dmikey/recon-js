'use strict';

function isPathChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c) ||
    c === 58/*':'*/ || c === 64/*'@'*/);
}

module.exports = isPathChar;