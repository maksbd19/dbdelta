const log4js = require('log4js');

log4js.configure({
  appenders: {
    dbdelta: {
      type: 'file',
      filename: 'agent.log'
    },
    out: {
      type: 'stdout'
    }
  },
  categories: {
    default: {
      appenders: ['dbdelta', 'out'],
      level: 'ALL'
    }
  }
});

const logger = log4js.getLogger('dbdelta');

module.exports = logger;
