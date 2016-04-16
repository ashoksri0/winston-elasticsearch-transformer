'use strict';

let os = require('os');
let util = require('util');

exports.mappingTemplate = require('./index-template-mapping.json');

// List of properties that have to be moved
// from the meta property to the root
const knownProperties = [
  'tenant',
  'user',
  'source',
  'source_host',
  'source_path',
  'tags',
  'severity',
  'proc_time',
  'req_id',
  'req_method',
  'req_user_agent',
  'res_status'
];

const regexP = /^.*at([\s](.*))?([\s][\(]?(.*):[\d]+:[\d]+[\)]?)/;

// TODO: performance ?
const getSourcePath = () => {
  let err = new Error();
  // File path of logger caller is on the 10th line
  let caller_line = err.stack.split('\n')[10];
  let matches = regexP.exec(caller_line);
  if (matches) {
    return matches[4];
  }
};

/**
 * Transformer function to transform logged data into a
 * the message structure used in restore for storage in ES.
 *
 * @param {Object} logData
 * @param {Object} logData.message - the log message
 * @param {Object} logData.level - the log level
 * @param {Object} logData.meta - the log meta data
 * @returns {Object} transformed message
 */
exports.transformer = (logData) => {
  let transformed = {};
  let meta = logData.meta;

  transformed['@timestamp'] = new Date().toISOString();
  transformed.source = this.transformer.source;
  transformed.source_host = os.hostname();
  transformed.source_path = getSourcePath();
  transformed.message = logData.message;
  transformed.severity = logData.level;

  // Read top-level properties from meta if exists
  for (let prop in meta) {
    if (util.isObject(meta[prop])) {
      if (prop === '0') {
        let rid = meta[prop].rid;
        if (rid) {
          transformed.req_id = rid;
          // TODO: check whether delete origin attribute is required
//          delete meta[prop].rid;
        }
        let procTime = meta[prop].procTime;
        if (procTime) {
          transformed.proc_time = procTime;
//          delete meta[prop].procTime;
        }
      }
      if (prop === '1') {
        let method = meta[prop].method;
        if (method) {
          transformed.req_method = method;
//          delete meta[prop].method;
        }
        let headers = meta[prop].headers;
        if (headers) {
          let userAgent = headers['user-agent'];
          if (userAgent) {
            transformed.req_user_agent = userAgent;
          }
        }
        let status = meta[prop].status;
        if (status) {
          transformed.res_status = status;
//          delete meta[prop].status;
        }
        let user = meta[prop].user;
        if (user) {
          transformed.user = user.id;
        }
      }
      if (Object.keys(meta[prop]).length === 0) {
        delete meta[prop];
      }
    }
  }

  transformed.fields = logData.meta;
  // transformed.fields = {};
  return transformed;
};
