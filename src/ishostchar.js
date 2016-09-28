'use strict';

var isUnreservedChar = require('./isunreservedchar');
var isSubDelimChar = require('./issubdelimchar');

function isHostChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c));
}

module.exports = isHostChar;