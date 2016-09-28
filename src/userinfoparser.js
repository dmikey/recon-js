'use strict';

var StringIteratee = require('./stringiteratee');
var StringBuilder = require('./stringbuilder');
var isUserChar = require('./isuserchar');
var isHexChar = require('./ishexchar');
var decodeHex = require('./decodehex');
var isUserInfoChar = require('./isuserinfochar');

function UserInfoParser(username, password, c1, s) {
  StringIteratee.call(this);
  this.username = username || null;
  this.password = password || null;
  this.c1 = c1 || 0;
  this.s = s || 1;
}
UserInfoParser.prototype = Object.create(StringIteratee.prototype);
UserInfoParser.prototype.constructor = UserInfoParser;
UserInfoParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var c1 = this.c1;
  var password = this.password;
  var username = this.username;
  while (!input.isEmpty() || input.isDone()) {
    if (s === 1) {
      while (!input.isEmpty() && (c = input.head(), isUserChar(c))) {
        input.step();
        username.append(c);
      }
      if (!input.isEmpty() && c === 58/*':'*/) {
        input.step();
        s = 4;
      }
      else if (!input.isEmpty() && c === 37/*'%'*/) {
        input.step();
        s = 2;
      }
      else if (!input.isEmpty() || input.isDone()) {
        return new StringIteratee.Done(username.state());
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
        username.append((decodeHex(c1) << 4) + decodeHex(c));
        c1 = 0;
        s = 1;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 4) {
      password = password || new StringBuilder();
      while (!input.isEmpty() && (c = input.head(), isUserInfoChar(c))) {
        input.step();
        password.append(c);
      }
      if (!input.isEmpty() && c === 37/*'%'*/) {
        input.step();
        s = 5;
      }
      else if (!input.isEmpty() || input.isDone()) {
        var userInfo = {username: username.state(), password: password.state()};
        return new StringIteratee.Done(userInfo);
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
        password.append((decodeHex(c1) << 4) + decodeHex(c));
        c1 = 0;
        s = 4;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
  }
  return new UserInfoParser(username, password, c1, s);
};
UserInfoParser.prototype.state = function () {
  if (this.password) return {username: this.username.state(), password: this.password.state()};
  else if (this.username) return this.username.state();
};

module.exports = UserInfoParser;