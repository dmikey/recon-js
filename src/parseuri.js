'use strict';

function parseUri(string) {
  var input = new StringIterator(string);
  var result = new UriParser().run(input);
  return result.state();
}

module.exports = parseUri;