'use strict';

function mergePath(basePath, relativePath) {
  var segments = [];
  var head = basePath.shift();
  while (basePath.length > 0) {
    segments.push(head);
    head = basePath.shift();
  }
  if (head === '/') segments.push(head);
  for (var i = 0, n = relativePath.length; i < n; i += 1) {
    segments.push(relativePath[i]);
  }
  return segments;
}

module.exports = mergePath;