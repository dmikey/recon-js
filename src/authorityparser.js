'use strict';

function AuthorityParser(userInfo, host, port, s) {
  StringIteratee.call(this);
  this.userInfo = userInfo || null;
  this.host = host || null;
  this.port = port || null;
  this.s = s || 1;
}
AuthorityParser.prototype = Object.create(StringIteratee.prototype);
AuthorityParser.prototype.constructor = AuthorityParser;
AuthorityParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var port = this.port;
  var host = this.host;
  var userInfo = this.userInfo;
  var authority, hostinfo, userinfo;
  if (s === 1) {
    if (!input.isEmpty()) {
      var look = input.dup();
      while (!look.isEmpty() && (c = look.head(), c !== 64/*'@'*/ && c !== 47/*'/'*/)) look.step();
      if (!look.isEmpty() && c === 64/*'@'*/) s = 2;
      else s = 3;
    }
    else if (input.isDone()) s = 3;
  }
  if (s === 2) {
    userInfo = userInfo || new UserInfoParser();
    userInfo = userInfo.feed(input);
    if (userInfo.isError()) return userInfo;
    else if (!input.isEmpty() && (c = input.head(), c === 64/*'@'*/)) {
      input.step();
      s = 3;
    }
    else if (!input.isEmpty()) return new StringIteratee.Error({expected: 64/*'@'*/, found: c});
    else if (input.isDone()) return StringIteratee.unexpectedEOF();
  }
  if (s === 3) {
    host = host || new HostParser();
    host = host.feed(input);
    if (host.isError()) return host;
    else if (!input.isEmpty() && input.head() === 58/*':'*/) {
      input.step();
      s = 4;
    }
    else if (!input.isEmpty() || input.isDone()) {
      if (host.state()) {
        authority = {};
        hostinfo = host.state();
        if (hostinfo.name !== undefined) authority.host = hostinfo.name;
        if (hostinfo.ipv4 !== undefined) authority.ipv4 = hostinfo.ipv4;
        if (hostinfo.ipv6 !== undefined) authority.ipv6 = hostinfo.ipv6;
        if (userInfo) {
          userinfo = userInfo.state();
          if (typeof userinfo === 'string') authority.userInfo = userinfo;
          else if (userinfo) {
            authority.username = userinfo.username;
            authority.password = userinfo.password;
          }
        }
        return new StringIteratee.Done(authority);
      }
      else if (userInfo) {
        authority = {};
        userinfo = userInfo.state();
        if (typeof userinfo === 'string') authority.userInfo = userinfo;
        else if (userinfo) {
          authority.username = userinfo.username;
          authority.password = userinfo.password;
        }
        return new StringIteratee.Done(authority);
      }
      return new StringIteratee.Done(undefined);
    }
  }
  if (s === 4) {
    port = port || new PortParser();
    port = port.feed(input);
    if (port.isError()) return port;
    else if (!input.isEmpty() || input.isDone()) {
      authority = {};
      hostinfo = host.state();
      if (hostinfo.name !== undefined) authority.host = hostinfo.name;
      if (hostinfo.ipv4 !== undefined) authority.ipv4 = hostinfo.ipv4;
      if (hostinfo.ipv6 !== undefined) authority.ipv6 = hostinfo.ipv6;
      authority.port = port.state();
      if (userInfo) {
        userinfo = userInfo.state();
        if (typeof userinfo === 'string') authority.userInfo = userinfo;
        else if (userinfo) {
          authority.username = userinfo.username;
          authority.password = userinfo.password;
        }
      }
      return new StringIteratee.Done(authority);
    }
  }
  return new AuthorityParser(userInfo, host, port, s);
};
AuthorityParser.prototype.state = function () {
  if (this.host && this.host.state()) {
    var authority = {};
    var hostinfo = this.host.state();
    if (hostinfo.name !== undefined) authority.host = hostinfo.name;
    if (hostinfo.ipv4 !== undefined) authority.ipv4 = hostinfo.ipv4;
    if (hostinfo.ipv6 !== undefined) authority.ipv6 = hostinfo.ipv6;
    if (this.port) authority.port = this.port.state();
    if (this.userInfo) {
      var userinfo = this.userInfo.state();
      if (typeof userinfo === 'string') authority.userInfo = userinfo;
      else if (userinfo) {
        authority.username = userinfo.username;
        authority.password = userinfo.password;
      }
    }
    return authority;
  }
};

module.exports = AuthorityParser;