'use strict';

function FragmentParser(builder, c1, s) {
  StringIteratee.call(this);
  this.builder = builder || null;
  this.c1 = c1 || 0;
  this.s = s || 1;
}
FragmentParser.prototype = Object.create(StringIteratee.prototype);
FragmentParser.prototype.constructor = FragmentParser;
FragmentParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var c1 = this.c1;
  var builder = this.builder || new StringBuilder();
  while (!input.isEmpty() || input.isDone()) {
    if (s === 1) {
      while (!input.isEmpty() && (c = input.head(), isFragmentChar(c))) {
        input.step();
        builder.append(c);
      }
      if (!input.isEmpty() && c === 37/*'%'*/) {
        input.step();
        s = 2;
      }
      else if (!input.isEmpty() || input.isDone()) {
        return new StringIteratee.Done(builder.state());
      }
    }
    if (s === 2) {
      if (!input.isEmpty() && (c = input.head(), isHexChar(c))) {
        input.step();
        c1 = c;
        s = 3;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 3) {
      if (!input.isEmpty() && (c = input.head(), isHexChar(c))) {
        input.step();
        builder.append((decodeHex(c1) << 4) + decodeHex(c));
        c1 = 0;
        s = 1;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
  }
  return new FragmentParser(builder, c1, s);
};
FragmentParser.prototype.state = function () {
  if (this.builder) return this.builder.state();
};

module.exports = FragmentParser;