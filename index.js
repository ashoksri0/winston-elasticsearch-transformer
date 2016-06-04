'use strict';

const os = require('os');
const util = require('util');

exports.mappingTemplate = require('./lib/index-template-mapping.json');

// List of properties that have to be moved
// from the meta property to the root
// const knownProperties = [
//   'tenant',
//   'user',
//   'source',
//   'source_host',
//   'source_path',
//   'tags',
//   'severity',
//   'proc_time',
//   'req_id',
//   'req_method',
//   'req_user_agent',
//   'res_status'
// ];

const regexP = /^.*at([\s](.*))?([\s][\(]?(.*):[\d]+:[\d]+[\)]?)/;

// TODO: performance ?
const getSourcePath = () => {
  const err = new Error();
  // File path of logger caller is on the 10th line
  const callerLine = err.stack.split('\n')[10];
  const matches = regexP.exec(callerLine);
  if (matches) {
    return matches[4];
  }
  return null;
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
  const transformed = {};
  const meta = logData.meta;

  transformed['@timestamp'] = new Date().toISOString();
  transformed.source = this.transformer.source;
  transformed.source_host = os.hostname();
  transformed.source_path = getSourcePath();
  transformed.message = logData.message;
  transformed.severity = logData.level;

  // Read top-level properties from meta if exists
  Object.keys(meta).forEach(prop => {
    if (util.isObject(meta[prop])) {
      if (prop === '0') {
        const rid = meta[prop].rid;
        if (rid) {
          transformed.req_id = rid;
        }
        const procTime = meta[prop].procTime;
        if (procTime) {
          transformed.proc_time = procTime;
        }
      }
      if (prop === '1') {
        const method = meta[prop].method;
        if (method) {
          transformed.req_method = method;
        }
        const headers = meta[prop].headers;
        if (headers) {
          const userAgent = headers['user-agent'];
          if (userAgent) {
            transformed.req_user_agent = userAgent;
          }
        }
        const status = meta[prop].status;
        if (status) {
          transformed.res_status = status;
        }
        const user = meta[prop].user;
        if (user) {
          transformed.user = user.id;
        }
      }
      if (Object.keys(meta[prop]).length === 0) {
        delete meta[prop];
      }
    }
  });

  transformed.fields = logData.meta;
  return transformed;
};
