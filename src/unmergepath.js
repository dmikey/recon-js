'use strict';

function unmergePath(basePath, relativePath, absolutePath) {
  if (basePath.length === 0) {
    if (relativePath.length > 1) relativePath.shift();
    return relativePath;
  }
  else if (basePath[0] !== '/') {
    return relativePath;
  }
  else if (relativePath.length === 0 || relativePath[0] !== '/') {
    relativePath.unshift('/');
    return relativePath;
  }
  else {
    basePath.shift();
    relativePath.shift();
    if (basePath.length > 0 && relativePath.length === 0) return ['/'];
    else if (basePath.length === 0 || relativePath.length === 0 || basePath[0] !== relativePath[0]) {
      return relativePath;
    }
    else {
      basePath.shift();
      relativePath.shift();
      if (basePath.length > 0 && relativePath.length === 0) return absolutePath;
      else return unmergePath(basePath, relativePath, absolutePath);
    }
  }
}

module.exports = unmergePath;