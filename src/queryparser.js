'use strict';

function QueryParser(key, value, query, c1, s) {
  StringIteratee.call(this);
  this.key = key || null;
  this.value = value || null;
  this.query = query || null;
  this.c1 = c1 || 0;
  this.s = s || 1;
}
QueryParser.prototype = Object.create(StringIteratee.prototype);
QueryParser.prototype.constructor = QueryParser;
QueryParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var c1 = this.c1;
  var query = this.query;
  var value = this.value;
  var key = this.key;
  var k, v, param;
  while (!input.isEmpty() || input.isDone()) {
    if (s === 1) {
      key = key || new StringBuilder();
      while (!input.isEmpty() && (c = input.head(), isParamChar(c))) {
        input.step();
        key.append(c);
      }
      if (!input.isEmpty() && c === 61/*'='*/) {
        input.step();
        s = 4;
      }
      else if (!input.isEmpty() && c === 38/*'&'*/) {
        input.step();
        query = query || [];
        query.push(key.state());
        key = null;
        s = 1;
      }
      else if (!input.isEmpty() && c === 37/*'%'*/) {
        input.step();
        s = 2;
      }
      else if (!input.isEmpty() || input.isDone()) {
        if (!query) return new StringIteratee.Done(key.state());
        else {
          query.push(key.state());
          return new StringIteratee.Done(query);
        }
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
        key.append((decodeHex(c1) << 4) + decodeHex(c));
        c1 = 0;
        s = 1;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 4) {
      value = value || new StringBuilder();
      while (!input.isEmpty() && (c = input.head(), isParamChar(c) || c === 61/*'='*/)) {
        input.step();
        value.append(c);
      }
      if (!input.isEmpty() && c === 38/*'&'*/) {
        input.step();
        k = key.state();
        v = value.state();
        param = {};
        param[k] = v;
        query = query || [];
        query.push(param);
        query[k] = v;
        key = null;
        value = null;
        s = 1;
      }
      else if (!input.isEmpty() && c === 38/*'%'*/) {
        input.step();
        s = 5;
      }
      else if (!input.isEmpty() || input.isDone()) {
        k = key.state();
        v = value.state();
        param = {};
        param[k] = v;
        query = query || [];
        query.push(param);
        query[k] = v;
        return new StringIteratee.Done(query);
      }
    }
    if (s === 5) {
      if (!input.isEmpty() && (c = input.head(), isHexChar(c))) {
        input.step();
        c1 = c;
        s = 6;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 6) {
      if (!input.isEmpty() && (c = input.head(), isHexChar(c))) {
        input.step();
        value.append((decodeHex(c1) << 4) + decodeHex(c));
        c1 = 0;
        s = 4;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
  }
  return new QueryParser(key, value, query, c1, s);
};
QueryParser.prototype.state = function () {
  if (this.query) return this.query;
};

module.exports = QueryParser;