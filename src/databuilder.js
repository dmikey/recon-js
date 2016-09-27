'use strict';

function DataBuilder() {
  this.buffer = null;
  this.offset = 0;
  this.aliased = true;
  this.p = 0;
  this.q = 0;
  this.r = 0;
  this.s = 0;
}
DataBuilder.prototype.prepare = function (size) {
  function expand(base, size) {
    var n = Math.max(base, size) - 1;
    n |= n >> 1; n |= n >> 2; n |= n >> 4; n |= n >> 8;
    return n + 1;
  }
  if (this.aliased || size > this.buffer.length) {
    var array = new Uint8Array(expand(256, size));
    if (this.buffer) array.set(this.buffer);
    this.buffer = array;
    this.aliased = false;
  }
};
DataBuilder.prototype.appendByte = function (value) {
  this.prepare(this.offset + 1);
  this.buffer[this.offset] = value;
  this.offset += 1;
};
DataBuilder.prototype.decodeBase64Digit = function (c) {
  if (c >= 65/*'A'*/ && c <= 90/*'Z'*/) return c - 65/*'A'*/;
  else if (c >= 97/*'a'*/ && c <= 122/*'z'*/) return c - 71/*'a' - 26*/;
  else if (c >= 48/*'0'*/ && c <= 57/*'9'*/) return c + 4/*52 - '0'*/;
  else if (c === 43/*'+'*/ || c === 45/*'-'*/) return 62;
  else if (c === 47/*'/'*/ || c === 95/*'_'*/) return 63;
};
DataBuilder.prototype.decodeBase64Quantum = function () {
  var x = this.decodeBase64Digit(this.p);
  var y = this.decodeBase64Digit(this.q);
  if (this.r !== 61/*'='*/) {
    var z = this.decodeBase64Digit(this.r);
    if (this.s !== 61/*'='*/) {
      var w = this.decodeBase64Digit(this.s);
      this.appendByte((x << 2) | (y >>> 4));
      this.appendByte((y << 4) | (z >>> 2));
      this.appendByte((z << 6) | w);
    }
    else {
      this.appendByte((x << 2) | (y >>> 4));
      this.appendByte((y << 4) | (z >>> 2));
    }
  }
  else {
    if (this.s !== 61/*'='*/) throw 'incomplete base64 quantum';
    this.appendByte((x << 2) | (y >>> 4));
  }
};
DataBuilder.prototype.appendBase64Char = function (c) {
  if (this.p === 0) this.p = c;
  else if (this.q === 0) this.q = c;
  else if (this.r === 0) this.r = c;
  else {
    this.s = c;
    this.decodeBase64Quantum();
    this.s = 0;
    this.r = 0;
    this.q = 0;
    this.p = 0;
  }
};
DataBuilder.prototype.state = function (value) {
  if (!this.buffer) this.buffer = new Uint8Array(0);
  else if (this.buffer.length !== this.offset) {
    var array = new Uint8Array(this.offset);
    array.set(this.buffer.subarray(0, this.offset));
    this.buffer = array;
  }
  this.aliased = true;
  return this.buffer;
};

module.exports = DataBuilder;