'use strict';


function StringIterator(string, index, more) {
  this.string = string || '';
  this.index = index || 0;
  this.more = more || false;
}
StringIterator.prototype.isDone = function () {
  return this.isEmpty() && !this.more;
};
StringIterator.prototype.isEmpty = function () {
  return this.index >= this.string.length;
};
StringIterator.prototype.head = function () {
  var c1 = this.string.charCodeAt(this.index);
  if (c1 <= 0xD7FF || c1 >= 0xE000) return c1; // U+0000..U+D7FF | U+E000..U+FFFF
  else if (c1 <= 0xDBFF && this.index + 1 < this.string.length) { // c1 >= 0xD800
    var c2 = this.string.charCodeAt(this.index + 1);
    if (c2 >= 0xDC00 && c2 <= 0xDFFF) // U+10000..U+10FFFF
      return (((c1 & 0x3FF) << 10) | (c2 & 0x3FF)) + 0x10000;
    else return 0xFFFD;
  }
  else return 0xFFFD;
};
StringIterator.prototype.step = function () {
  var c1 = this.string.charCodeAt(this.index);
  if (c1 <= 0xD7FF || c1 >= 0xE000) // U+0000..U+D7FF | U+E000..U+FFFF
    this.index += 1;
  else if (c1 <= 0xDBFF && this.index + 1 < this.string.length) { // c1 >= 0xD800
    var c2 = this.string.charCodeAt(this.index + 1);
    if (c2 >= 0xDC00 && c2 <= 0xDFFF) // U+10000..U+10FFFF
      this.index += 2;
    else this.index += 1;
  }
  else this.index += 1;
};
StringIterator.prototype.dup = function () {
  return new StringIterator(this.string, this.index, this.more);
};

StringIterator.Done = {
  isDone: function () {
    return true;
  },
  isEmpty: function () {
    return true;
  },
  head: function () {
    throw 'head of empty iterator';
  },
  step: function () {
    throw 'empty iterator step';
  }
};
StringIterator.Done.prototype = Object.create(StringIterator.prototype);

module.exports = StringIterator;