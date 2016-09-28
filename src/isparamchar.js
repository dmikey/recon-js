'use strict';

function isParamChar(c) {
  return (
    isUnreservedChar(c) ||
    c === 33/*'!'*/ || c === 36/*'$'*/ ||
    c === 40/*'('*/ || c === 41/*')'*/ ||
    c === 42/*'*'*/ || c === 43/*'+'*/ ||
    c === 44/*','*/ || c === 47/*'/'*/ ||
    c === 58/*':'*/ || c === 59/*';'*/ ||
    c === 63/*'?'*/ || c === 64/*'@'*/ ||
    c === 39/*'\''*/);
}

module.exports = isParamChar;