'use strict';

var parseUri = require('./parseuri');
var removeDotSegments = require('./removedotsegments');
var mergeUriPath = require('./mergeuripath');

function resolveUri(base, relative) {
  if (typeof base === 'string') base = parseUri(base);
  if (typeof relative === 'string') relative = parseUri(relative);
  var absolute = {};
  if (relative.scheme) {
    absolute.scheme = relative.scheme;
    if (relative.authority) absolute.authority = relative.authority;
    if (relative.path) absolute.path = removeDotSegments(relative.path);
    if (relative.query !== undefined) absolute.query = relative.query;
    if (relative.fragment !== undefined) absolute.fragment = relative.fragment;
  }
  else if (relative.authority) {
    if (base.scheme) absolute.scheme = base.scheme;
    absolute.authority = relative.authority;
    if (relative.path) absolute.path = removeDotSegments(relative.path);
    if (relative.query !== undefined) absolute.query = relative.query;
    if (relative.fragment !== undefined) absolute.fragment = relative.fragment;
  }
  else if (!relative.path || !relative.path.length) {
    if (base.scheme) absolute.scheme = base.scheme;
    if (base.authority) absolute.authority = base.authority;
    if (base.path) absolute.path = base.path;
    if (relative.query !== undefined) absolute.query = relative.query;
    else if (base.query !== undefined) absolute.query = base.query;
    if (relative.fragment !== undefined) absolute.fragment = relative.fragment;
  }
  else if (relative.path[0] === '/') {
    if (base.scheme) absolute.scheme = base.scheme;
    if (base.authority) absolute.authority = base.authority;
    if (relative.path) absolute.path = removeDotSegments(relative.path);
    if (relative.query !== undefined) absolute.query = relative.query;
    if (relative.fragment !== undefined) absolute.fragment = relative.fragment;
  }
  else {
    if (base.scheme) absolute.scheme = base.scheme;
    if (base.authority) absolute.authority = base.authority;
    absolute.path = removeDotSegments(mergeUriPath(base, relative.path));
    if (relative.query !== undefined) absolute.query = relative.query;
    if (relative.fragment !== undefined) absolute.fragment = relative.fragment;
  }
  return absolute;
}

module.exports = resolveUri;