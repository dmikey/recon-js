'use strict';

function isSubDelimChar(c) {
  return (
    c === 33/*'!'*/ || c === 36/*'$'*/ ||
    c === 38/*'&'*/ || c === 40/*'('*/ ||
    c === 41/*')'*/ || c === 42/*'*'*/ ||
    c === 43/*'+'*/ || c === 44/*','*/ ||
    c === 59/*';'*/ || c === 61/*'='*/ ||
    c === 39/*'\''*/);
}

module.export = isSubDelimChar;