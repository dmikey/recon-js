'use strict';

function removeDotSegments(path) {
  var segments = [];
  while (path.length > 0) {
    var head = path[0];
    if (head === '.' || head === '..') {
      path = path.slice(path.length > 1 ? 2 : 1);
    }
    else if (head === '/') {
      if (path.length > 1) {
        var next = path[1];
        if (next === '.') {
          path = path.length > 2 ? path.slice(2) : ['/'];
        }
        else if (next === '..') {
          path = path.length > 2 ? path.slice(2) : ['/'];
          if (segments.length > 1 && segments[segments.length - 1] !== '/') {
            segments = segments.slice(0, segments.length - 2);
          }
          else if (segments.length > 0) {
            segments = segments.slice(0, segments.length - 1);
          }
        }
        else {
          segments.push(head);
          segments.push(next);
          path = path.slice(2);
        }
      }
      else {
        segments.push('/');
        path.shift();
      }
    }
    else {
      segments.push(head);
      path.shift();
    }
  }
  return segments;
}

module.exports = removeDotSegments;