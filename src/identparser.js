'use strict';


function IdentParser(builder, s) {
  StringIteratee.call(this);
  this.builder = builder || null;
  this.s = s || 1;
}
IdentParser.prototype = Object.create(StringIteratee.prototype);
IdentParser.prototype.constructor = IdentParser;
IdentParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var builder = this.builder;
  if (s === 1) {
    if (!input.isEmpty() && (c = input.head(), isNameStartChar(c))) {
      builder = builder || new StringBuilder();
      input.step();
      builder.append(c);
      s = 2;
    }
    else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'identitifer', found: c});
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  if (s === 2) {
    while (!input.isEmpty() && (c = input.head(), isNameChar(c))) {
      input.step();
      builder.append(c);
    }
    if (!input.isEmpty() || input.isDone()) {
      var value = builder.state();
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      return new StringIteratee.Done(value);
    }
  }
  return new IdentParser(builder, s);
};

module.exports = IdentParser;