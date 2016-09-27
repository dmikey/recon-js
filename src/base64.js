'use strict';

function base64(string) {
  if (string === undefined) return new Uint8Array(0);
  var data = new DataBuilder();
  var cs = new StringIterator(string);
  while (!cs.isEmpty()) {
    data.appendBase64Char(cs.head());
    cs.step();
  }
  return data.state();
}

module.exports = base64;