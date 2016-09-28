'use strict';

var StringIteratee = require('./stringiteratee');
var isSchemeChar = require('./isschemechar');
var SchemeParser = require('./schemeparser');
var PathParser = require('./pathparser');
var AuthorityParser = require('./authorityparser');
var QueryParser = require('./queryparser');
var FragmentParser = require('./fragmentparser');

function UriParser(scheme, authority, path, query, fragment, s) {
  StringIteratee.call(this);
  this.scheme = scheme || null;
  this.authority = authority || null;
  this.path = path || null;
  this.query = query || null;
  this.fragment = fragment || null;
  this.s = s || 1;
}
UriParser.prototype = Object.create(StringIteratee.prototype);
UriParser.prototype.constructor = UriParser;
UriParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var fragment = this.fragment;
  var query = this.query;
  var path = this.path;
  var authority = this.authority;
  var scheme = this.scheme;
  var uri;
  if (s === 1) {
    if (!input.isEmpty()) {
      var look = input.dup();
      while (!look.isEmpty() && (c = look.head(), isSchemeChar(c))) look.step();
      if (!look.isEmpty() && c === 58/*':'*/) s = 2;
      else s = 3;
    }
    else if (input.isDone()) s = 3;
  }
  if (s === 2) {
    scheme = scheme || new SchemeParser();
    scheme = scheme.feed(input);
    if (scheme.isError()) return scheme;
    else if (!input.isEmpty() && (c = input.head(), c === 58/*':'*/)) {
      input.step();
      s = 3;
    }
    else if (!input.isEmpty()) return new StringIteratee.Error({expected: '\':\'', found: c});
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  if (s === 3) {
    if (!input.isEmpty()) {
      c = input.head();
      if (c === 47/*'/'*/) {
        input.step();
        s = 4;
      }
      else if (c === 63/*'?'*/) {
        input.step();
        s = 7;
      }
      else if (c === 35/*'#'*/) {
        input.step();
        s = 8;
      }
      else s = 6;
    }
    else if (input.isDone()) {
      uri = {};
      if (scheme) uri.scheme = scheme.state();
      return new StringIteratee.Done(uri);
    }
  }
  if (s === 4) {
    if (!input.isEmpty() && (c = input.head(), c === 47/*'/'*/)) {
      input.step();
      s = 5;
    }
    else if (!input.isEmpty()) {
      path = new PathParser(['/']);
      s = 6;
    }
    else if (input.isDone()) {
      uri = {};
      if (scheme) uri.scheme = scheme.state();
      uri.path = ['/'];
      return new StringIteratee.Done(uri);
    }
  }
  if (s === 5) {
    authority = authority || new AuthorityParser();
    authority = authority.feed(input);
    if (authority.isError()) return authority;
    else if (!input.isEmpty()) {
      c = input.head();
      if (c === 63/*'?'*/) {
        input.step();
        s = 7;
      }
      else if (c === 35/*'#'*/) {
        input.step();
        s = 8;
      }
      else s = 6;
    }
    else if (input.isDone()) {
      uri = {};
      if (scheme) uri.scheme = scheme.state();
      if (authority.state()) uri.authority = authority.state();
      return new StringIteratee.Done(uri);
    }
  }
  if (s === 6) {
    path = path || new PathParser();
    path = path.feed(input);
    if (path.isError()) return path;
    else if (!input.isEmpty()) {
      c = input.head();
      if (c === 63/*'?'*/) {
        input.step();
        s = 7;
      }
      else if (c === 35/*'#'*/) {
        input.step();
        s = 8;
      }
      else {
        uri = {};
        if (scheme) uri.scheme = scheme.state();
        if (authority) uri.authority = authority.state();
        uri.path = path.state();
        return new StringIteratee.Done(uri);
      }
    }
    else if (input.isDone()) {
      uri = {};
      if (scheme) uri.scheme = scheme.state();
      if (authority) uri.authority = authority.state();
      uri.path = path.state();
      return new StringIteratee.Done(uri);
    }
  }
  if (s === 7) {
    query = query || new QueryParser();
    query = query.feed(input);
    if (query.isError()) return query;
    else if (!input.isEmpty()) {
      c = input.head();
      if (c === 35/*'#'*/) {
        input.step();
        s = 8;
      }
      else {
        uri = {};
        if (scheme) uri.scheme = scheme.state();
        if (authority) uri.authority = authority.state();
        uri.path = path.state();
        uri.query = query.state();
        return new StringIteratee.Done(uri);
      }
    }
    else if (input.isDone()) {
      uri = {};
      if (scheme) uri.scheme = scheme.state();
      if (authority) uri.authority = authority.state();
      if (path) uri.path = path.state();
      uri.query = query.state();
      return new StringIteratee.Done(uri);
    }
  }
  if (s === 8) {
    fragment = fragment || new FragmentParser();
    fragment = fragment.feed(input);
    if (fragment.isError()) return fragment;
    else if (input.isDone()) {
      uri = {};
      if (scheme) uri.scheme = scheme.state();
      if (authority) uri.authority = authority.state();
      if (path) uri.path = path.state();
      if (query) uri.query = query.state();
      uri.fragment = fragment.state();
      return new StringIteratee.Done(uri);
    }
  }
  return new UriParser(scheme, authority, path, query, fragment, s);
};
UriParser.prototype.state = function () {
  var scheme = this.scheme.state();
  var authority = this.authority.state();
  var path = this.path.state();
  var query = this.query.state();
  var fragment = this.fragment.state();
  var uri = {};
  if (scheme !== undefined) uri.scheme = scheme;
  if (authority) uri.authority = authority;
  if (path) uri.path = path;
  if (query) uri.query = query;
  if (fragment !== undefined) uri.fragment = fragment;
  return uri;
};

module.exports = UriParser;