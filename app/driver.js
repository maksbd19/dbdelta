import EventEmitter from 'events';

import DBManager from './lib/dbManager';

class DeltaEventEmitter extends EventEmitter {}

function getModule(driver) {
  switch (driver) {
    case 'mysql':
    case 'mariadb':
      return require('mysql2');
    default:
      throw new Error('Invalid driver type: ' + driver);
  }
}

function getDriver(config) {
  const module = getModule(config.driver);

  return module.createConnection({
    host: config.host,
    user: config.user,
    password: config.pass,
    database: config.db
  });
}

export function validateConnectionConfig(config, callback) {
  try {
    const module = getModule(config.driver);

    const conn = module.createConnection({
      host: config.host,
      user: config.user,
      password: config.pass,
      database: config.db
    });

    return conn.connect(err => {
      conn.end();
      return callback(err);
    });
  } catch (e) {
    return callback(e);
  }
}

export default function Manager(source, target) {
  const _sourceDriver = getDriver(source);
  const _targetDriver = getDriver(target);

  const _source = {
    config: source,
    driver: _sourceDriver
  };

  const _target = {
    config: target,
    driver: _targetDriver
  };

  const manager = new DBManager(_source, _target);
  const __ee = new DeltaEventEmitter();

  const _messages = {
    CONNECTION_STARTING: `Calculating delta source:${source.name} target: ${
      target.name
    }`,
    HOST_NAME_SAME: 'Source and target configuration must not be same',
    CONNECTING_TO_HOST: 'Connecting to source/target hosts',
    CONNECTION_TO_HOST_SUCCESSFUL:
      'Connection to source/target hosts successful',
    CONNECTION_TO_HOST_FAILED: 'Error while connecting to source/target',
    COMPARING_SCHEMA: 'Compararing schema',
    COMPARING_COLLATION: 'Comparing DB Collation',
    COMPARING_CHARSET: 'Comparing character set',
    COMPARING_TABLES: 'Comparing tables'
  };

  this.getSourceDriver = () => _sourceDriver;
  this.getTargetDriver = () => _targetDriver;

  this.on = (evt, callback) => {
    __ee.on(evt, callback);
    return null;
  };

  function _progress(msg) {
    return __ee.emit('progress', msg);
  }

  function _end(data) {
    return __ee.emit('end', data);
  }

  function _close() {
    manager.closeConnections(msg => __ee.emit('progress', msg));
  }

  /***
   * CalculateDiff
   *
   * A wrapper function to host necessary parts of the diff calculation
   */

  this.getDelta = async () => {
    let schemaDiffs = [];

    _progress(_messages.CONNECTION_STARTING);

    if (source.id === target.id) {
      _close();
      return _end(new Error(_messages.HOST_NAME_SAME));
    }

    _progress(_messages.CONNECTING_TO_HOST);

    const connectionResult = await manager.connect();

    if (connectionResult instanceof Error) {
      _close();
      return _end(connectionResult);
    }

    _progress(_messages.CONNECTION_TO_HOST_SUCCESSFUL);
    _progress(_messages.COMPARING_SCHEMA);

    _progress(_messages.COMPARING_COLLATION);

    const collation = await manager.checkDatabaseCollation();

    if (collation instanceof Error) {
      _close();
      return _end(collation);
    }

    schemaDiffs.push(collation);

    _progress(_messages.COMPARING_CHARSET);

    const charset = await manager.checkDatabaseCharset();

    if (charset instanceof Error) {
      _close();
      return _end(charset);
    }

    schemaDiffs.push(charset);

    schemaDiffs = schemaDiffs.filter(i => i);

    _progress(_messages.COMPARING_TABLES);

    const tables = await manager.compareTables();

    if (tables instanceof Error) {
      _close();
      return _end(tables);
    }

    schemaDiffs = schemaDiffs.concat(tables);

    // const _diff_in_data = await compareData(manager);

    // if (_diff_in_data instanceof Error) {
    //   return _diff_in_data;
    // }

    _close();

    const delta = {
      schema: schemaDiffs,
      data: []
    };

    _end({
      success: true,
      message: 'Database compare complete',
      data: delta
    });
  };

  return this;
}
