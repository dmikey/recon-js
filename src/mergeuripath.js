'use strict';

function mergeUriPath(base, relativePath) {
  if (base.authority && (!base.path || !base.path.length)) {
    var segments = relativePath.slice();
    segments.unshift('/');
    return segments;
  }
  else if (!base.path || !base.path.length) return relativePath;
  else return mergePath(base.path.slice(), relativePath);
}

module.exports = mergeUriPath;