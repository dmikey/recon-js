'use strict';

var parseUri = require('./parseuri');
var equal = require('./equal');
var parsePath = require('./parsepath');
var unmergePath = require('./unmergepath');

function unresolveUri(base, absolute) {
  if (typeof base === 'string') base = parseUri(base);
  if (typeof absolute === 'string') absolute = parseUri(absolute);
  if (base.scheme !== absolute.scheme || !equal(base.authority, absolute.authority)) return absolute;
  var relative = {};
  var basePath = base.path;
  if (typeof basePath === 'string') basePath = parsePath(basePath);
  else if (!basePath) basePath = [];
  else basePath = basePath.slice();
  var absolutePath = absolute.path;
  if (typeof absolutePath === 'string') absolutePath = parsePath(absolutePath);
  else if (!absolutePath) absolutePath = [];
  var relativePath = unmergePath(basePath, absolutePath.slice(), absolutePath);
  if (relativePath.length > 0) relative.path = relativePath;
  if (absolute.query !== undefined) relative.query = absolute.query;
  if (absolute.fragment !== undefined) relative.fragment = absolute.fragment;
  return relative;
}

module.exports = unresolveUri;