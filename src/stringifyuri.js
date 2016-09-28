'use strict';

var UriWriter = require('./uriwriter');

function stringifyUri(uri) {
  var writer = new UriWriter();
  writer.writeUri(uri);
  return writer.state();
}

module.exports = stringifyUri;