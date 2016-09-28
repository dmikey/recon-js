'use strict';

var StringIterator = require('./stringiterator');

function StringIteratee() {}
StringIteratee.prototype.isCont = function () {
  return true;
};
StringIteratee.prototype.isDone = function () {
  return false;
};
StringIteratee.prototype.isError = function () {
  return false;
};
StringIteratee.prototype.feed = function (input) {
  return this;
};
StringIteratee.prototype.run = function (input) {
  var next = this;
  do next = next.feed(input);
  while (!input.isEmpty() && next.isCont());
  if (input.isEmpty() && !input.isDone() && next.isCont()) {
    next = next.feed(StringIterator.Done);
  }
  return next;
};
StringIteratee.prototype.state = function () {};

StringIteratee.Done = function (value) {
  StringIteratee.call(this);
  this.value = value;
};
StringIteratee.Done.prototype = Object.create(StringIteratee.prototype);
StringIteratee.Done.prototype.constructor = StringIteratee.Done;
StringIteratee.Done.prototype.isCont = function () {
  return false;
};
StringIteratee.Done.prototype.isDone = function () {
  return true;
};
StringIteratee.Done.prototype.feed = function (input) {
  return this;
};
StringIteratee.Done.prototype.state = function () {
  return this.value;
};

StringIteratee.Error = function (error) {
  StringIteratee.call(this);
  if (typeof error.found === 'number') error.found = String.fromCharCode(error.found);
  this.error = error;
};
StringIteratee.Error.prototype = Object.create(StringIteratee.prototype);
StringIteratee.Error.prototype.constructor = StringIteratee.Error;
StringIteratee.Error.prototype.isCont = function () {
  return false;
};
StringIteratee.Error.prototype.isError = function () {
  return true;
};
StringIteratee.Error.prototype.feed = function (input) {
  return this;
};
StringIteratee.Error.prototype.state = function () {
  throw this.error;
};

StringIteratee.unexpectedEOF = new StringIteratee.Error('unexpected end of input');

module.exports = StringIteratee;