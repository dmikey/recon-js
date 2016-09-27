'use strict';

function UriWriter(builder) {
  this.builder = builder || new StringBuilder();
}
UriWriter.prototype.writeUri = function (uri) {
  if (uri.scheme) {
    this.writeScheme(uri.scheme);
    this.builder.append(58/*':'*/);
  }
  if (uri.authority) {
    this.builder.append(47/*'/'*/);
    this.builder.append(47/*'/'*/);
    this.writeAuthority(uri.authority);
  }
  if (uri.path) {
    this.writePath(uri.path);
  }
  if (uri.query !== undefined) {
    this.builder.append(63/*'?'*/);
    this.writeQuery(uri.query);
  }
  if (uri.fragment !== undefined) {
    this.builder.append(35/*'#'*/);
    this.writeFragment(uri.fragment);
  }
};
UriWriter.prototype.writeScheme = function (scheme) {
  var cs = new StringIterator(scheme);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isSchemeChar(c)) this.builder.append(c);
    else throw 'Invalid URI scheme: ' + scheme;
    cs.step();
  }
};
UriWriter.prototype.writeAuthority = function (authority) {
  if (typeof authority === 'string') authority = parseAuthority(authority);
  if (authority.userInfo !== undefined) {
    this.writeUserInfo(authority.userInfo);
    this.builder.append(64/*'@'*/);
  }
  else if (authority.username !== undefined && authority.password !== undefined) {
    this.writeUser(authority.username);
    this.builder.append(58/*':'*/);
    this.writeUserInfo(authority.password);
    this.builder.append(64/*'@'*/);
  }
  if (authority.host !== undefined) {
    this.writeHost(authority.host);
  }
  else if (authority.ipv4 !== undefined) {
    this.writeHost(authority.ipv4);
  }
  else if (authority.ipv6 !== undefined) {
    this.builder.append(91/*'['*/);
    this.writeHostLiteral(authority.ipv6);
    this.builder.append(93/*']'*/);
  }
  if (authority.port) {
    this.builder.append(58/*':'*/);
    this.writePort(authority.port);
  }
};
UriWriter.prototype.writeUserInfo = function (userInfo) {
  var cs = new StringIterator(userInfo);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isUserInfoChar(c)) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writeUser = function (user) {
  var cs = new StringIterator(user);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isUserChar(c)) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writeHost = function (host) {
  var cs = new StringIterator(host);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isHostChar(c)) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writeHostLiteral = function (host) {
  var cs = new StringIterator(host);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isHostChar(c) || c === 58/*':'*/) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writePort = function (port) {
  var i = 9;
  var digits = new Array(10);
  while (port > 0) {
    digits[i] = port % 10;
    port = Math.floor(port / 10);
    i -= 1;
  }
  i += 1;
  while (i < 10) {
    this.builder.append(48/*'0'*/ + digits[i]);
    i += 1;
  }
};
UriWriter.prototype.writePath = function (path) {
  if (typeof path === 'string') path = parsePath(path);
  for (var i = 0, n = path.length; i < n; i += 1) {
    var segment = path[i];
    if (segment === '/') this.builder.append(47/*'/'*/);
    else this.writePathSegment(segment);
  }
};
UriWriter.prototype.writePathSegment = function (segment) {
  var cs = new StringIterator(segment);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isPathChar(c)) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writeQuery = function (query) {
  if (typeof query === 'string') this.writeQueryPart(query);
  else if (Array.isArray(query)) this.writeQueryArray(query);
  else if (query) this.writeQueryParams(query);
};
UriWriter.prototype.writeQueryArray = function (query) {
  for (var i = 0, n = query.length; i < n; i += 1) {
    var param = query[i];
    if (typeof param === 'string') {
      if (i > 0) this.builder.append(38/*'&'*/);
      this.writeQueryParam(param);
    }
    else this.writeQueryParams(param, i);
  }
};
UriWriter.prototype.writeQueryParams = function (params, i) {
  var keys = Object.keys(params);
  for (var j = 0, n = keys.length; j < n; i += 1, j += 1) {
    var key = keys[j];
    var value = params[key];
    if (i > 0) this.builder.append(38/*'&'*/);
    this.writeQueryParam(key);
    this.builder.append(61/*'='*/);
    this.writeQueryParam(value);
  }
};
UriWriter.prototype.writeQueryParam = function (param) {
  var cs = new StringIterator(param);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isParamChar(c)) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writeQueryPart = function (query) {
  var cs = new StringIterator(query);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isQueryChar(c)) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writeFragment = function (fragment) {
  var cs = new StringIterator(fragment);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isFragmentChar(c)) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writeEncoded = function (c) {
  if (c === 0x00) { // modified UTF-8
    this.writePctEncoded(0xC0);
    this.writePctEncoded(0x80);
  }
  else if (c >= 0x00 && c <= 0x7F) { // U+0000..U+007F
    this.writePctEncoded(c);
  }
  else if (c >= 0x80 && c <= 0x07FF) { // U+0080..U+07FF
    this.writePctEncoded(0xC0 | (c >>> 6));
    this.writePctEncoded(0x80 | (c & 0x3F));
  }
  else if (c >= 0x0800 && c <= 0xFFFF || // U+0800..U+D7FF
           c >= 0xE000 && c <= 0xFFFF) { // U+E000..U+FFFF
    this.writePctEncoded(0xE0 | (c >>> 12));
    this.writePctEncoded(0x80 | (c >>> 6 & 0x3F));
    this.writePctEncoded(0x80 | (c & 0x3F));
  }
  else if (c >= 0x10000 && c <= 0x10FFFF) { // U+10000..U+10FFFF
    this.writePctEncoded(0xF0 | (c >>> 18));
    this.writePctEncoded(0x80 | (c >>> 12 & 0x3F));
    this.writePctEncoded(0x80 | (c >>> 6 & 0x3F));
    this.writePctEncoded(0x80 | (c & 0x3F));
  }
  else { // surrogate or invalid code point
    this.writePctEncoded(0xEF);
    this.writePctEncoded(0xBF);
    this.writePctEncoded(0xBD);
  }
};
UriWriter.prototype.writePctEncoded = function (c) {
  this.builder.append(37/*'%'*/);
  this.builder.append(encodeHex(c >>> 4 & 0xF));
  this.builder.append(encodeHex(c & 0xF));
};
UriWriter.prototype.state = function () {
  return this.builder.state();
};

module.exports = UriWriter;