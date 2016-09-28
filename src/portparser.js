'use strict';

var StringIteratee = require('./stringiteratee');
var isDigit = require('./isdigit');
var decodeDigit = require('./decodedigit');

function PortParser(port) {
  StringIteratee.call(this);
  this.port = port || 0;
}
PortParser.prototype = Object.create(StringIteratee.prototype);
PortParser.prototype.constructor = PortParser;
PortParser.prototype.feed = function (input) {
  var c = 0;
  var port = this.port;
  while (!input.isEmpty() && (c = input.head(), isDigit(c))) {
    input.step();
    port = 10 * port + decodeDigit(c);
  }
  if (!input.isEmpty() || input.isDone()) return new StringIteratee.Done(port);
  return new PortParser(port);
};
PortParser.prototype.state = function () {
  if (this.port !== 0) return this.port;
};

module.exports = PortParser;