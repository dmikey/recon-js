'use strict';

var isUnreservedChar = require('./isunreservedchar');
var isSubDelimChar = require('./issubdelimchar');

function isPathChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c) ||
    c === 58/*':'*/ || c === 64/*'@'*/);
}

module.exports = isPathChar;