'use strict';

function StringBuilder(s) {
  this.string = s || '';
}
StringBuilder.prototype.append = function (c) {
  if ((c >= 0x0000 && c <= 0xD7FF) ||
      (c >= 0xE000 && c <= 0xFFFF)) { // U+0000..U+D7FF | U+E000..U+FFFF
    this.string += String.fromCharCode(c);
  }
  else if (c >= 0x10000 && c <= 0x10FFFF) { // U+10000..U+10FFFF
    var u = c - 0x10000;
    this.string += String.fromCharCode(0xD800 | (u >>> 10), 0xDC00 | (u & 0x3FF));
  }
  else { // invalid code point
    this.string += String.fromCharCode(0xFFFD);
  }
};
StringBuilder.prototype.appendString = function (s) {
  var cs = new StringIterator(s);
  while (!cs.isEmpty()) {
    this.append(cs.head());
    cs.step();
  }
};
StringBuilder.prototype.state = function () {
  return this.string;
};

module.exports = StringBuilder;