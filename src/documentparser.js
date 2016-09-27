'use strict';

function DocumentParser(value) {
  StringIteratee.call(this);
  this.value = value || new BlockParser();
}
DocumentParser.prototype = Object.create(StringIteratee.prototype);
DocumentParser.prototype.constructor = DocumentParser;
DocumentParser.prototype.feed = function (input) {
  var value = this.value;
  while ((!input.isEmpty() || input.isDone()) && value.isCont()) value = value.feed(input);
  if (value.isError()) return value;
  if (value.isDone()) {
    if (!input.isEmpty()) return new StringIteratee.Error({found: input.head()});
    else if (input.isDone()) return value;
  }
  return new DocumentParser(value);
};

module.exports = DocumentParser;
