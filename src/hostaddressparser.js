'use strict';

function HostAddressParser(builder, c1, x, s) {
  StringIteratee.call(this);
  this.builder = builder || null;
  this.c1 = c1 || 0;
  this.x = x || 0;
  this.s = s || 1;
}
HostAddressParser.prototype = Object.create(StringIteratee.prototype);
HostAddressParser.prototype.constructor = HostAddressParser;
HostAddressParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var x = this.x;
  var c1 = this.c1;
  var builder = this.builder;
  var host;
  while (s <= 4 && (!input.isEmpty() || input.isDone())) {
    builder = builder || new StringBuilder();
    while (!input.isEmpty() && (c = input.head(), isDigit(c))) {
      input.step();
      builder.append(c);
      x = 10 * x + decodeDigit(c);
    }
    if (!input.isEmpty()) {
      if (c === 46/*'.'*/ && s < 4 && x <= 255) {
        input.step();
        builder.append(c);
        x = 0;
        s += 1;
      }
      else if (!isHostChar(c) && c !== 37/*'%'*/ && s === 4 && x <= 255) {
        host = {ipv4: builder.state()};
        return new StringIteratee.Done(host);
      }
      else {
        x = 0;
        s = 5;
      }
    }
    else if (input.isDone()) {
      if (s === 4 && x <= 255) {
        host = {ipv4: builder.state()};
        return new StringIteratee.Done(host);
      }
      else {
        host = {name: builder.state()};
        return new StringIteratee.Done(host);
      }
    }
  }
  while (!input.isEmpty() || input.isDone()) {
    if (s === 5) {
      while (!input.isEmpty() && (c = input.head(), isHostChar(c))) {
        input.step();
        builder.append(toLowerCase(c));
      }
      if (!input.isEmpty() && c === 37/*'%'*/) {
        input.step();
        s = 6;
      }
      else if (!input.isEmpty() || input.isDone()) {
        host = {name: builder.state()};
        return new StringIteratee.Done(host);
      }
    }
    if (s === 6) {
      if (!input.isEmpty() && (c = input.head(), isHexChar(c))) {
        input.step();
        c1 = c;
        s = 7;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 7) {
      if (!input.isEmpty() && (c = input.head(), isHexChar(c))) {
        input.step();
        builder.append((decodeHex(c1) << 4) + decodeHex(c));
        c1 = 0;
        s = 5;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
  }
  return new HostAddressParser(builder, c1, x, s);
};
HostAddressParser.prototype.state = function () {
  if (this.builder) {
    if (this.s === 4 && this.x <= 255) return {ipv4: this.builder.state()};
    else return {name: this.builder.state()};
  }
};

module.exports = HostAddressParser;