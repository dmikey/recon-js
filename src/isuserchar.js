'use strict';

var isUnreservedChar = require('./isunreservedchar');
var isSubDelimChar = require('./issubdelimchar');

function isUserChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c));
}

module.exports = isUserChar;