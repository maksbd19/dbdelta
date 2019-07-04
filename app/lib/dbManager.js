import { isEmpty } from 'lodash';

const MAX_CONNECTION_ATTEMPT = 3;

/***
 * DB Manager
 *
 * Connect and manage the DB connections to source
 * and remote
 */

// Object.prototype.length = () => Object.keys(this).length;

import log from './logger';

export default function(source, target) {
  const connections = {};
  const _events = {};

  const sourceConfig = { ...source.config, key: 'source' };
  const targetConfig = { ...target.config, key: 'target' };

  const _sourceDriver = source.driver;
  const _targetDriver = target.driver;

  const _connect = async (_opts, _connection) => {
    return new Promise(async (resolve, reject) => {
      _connection.connect(async err => {
        if (err) {
          return reject(err);
        }

        connections[_opts.key] = new Connection(_connection, _opts.key, _opts);

        return resolve(true);
      });
    });
  };

  const getConnection = key => {
    if (typeof connections[key] !== 'undefined') {
      return connections[key];
    }

    return false;
  };

  const getDBVar = async (key, _var) => {
    const conn = getConnection(key);

    if (!conn) {
      return new Error('Unable to get connection for key: ' + key);
    }

    return await conn.getVar(_var);
  };

  this.testConnection = async _param => {
    return new Promise((resolve, reject) => {
      const pool = _module.createPool({
        connectionLimit: 10,
        host: _param.host,
        user: _param.user,
        password: _param.pass,
        database: _param.db,
        waitForConnections: true,
        queueLimit: 0
      });

      pool.query('SELECT 1 + 1 AS solution', function(err, results, fields) {
        if (err) {
          return reject(err);
        }
        return resolve(true);
      });
    });
  };

  /**
   * Connect to source and target hosts
   */
  this.connect = async () => {
    try {
      await _connect(sourceConfig, _sourceDriver);
      await _connect(targetConfig, _targetDriver);

      return true;
    } catch (e) {
      return e;
    }
  };

  /**
   * close source and target connections
   */
  this.closeConnections = callback => {
    for (let i in connections) {
      if (connections.hasOwnProperty(i)) {
        connections[i].close(callback);
        delete connections[i];
      }
    }
  };

  this.checkDatabaseCollation = async () => {
    const source = await getDBVar('source', 'collation_database');
    const target = await getDBVar('target', 'collation_database');

    if (source instanceof Error) {
      return source;
    }

    if (target instanceof Error) {
      return target;
    }

    if (source === target) {
      return null;
    }

    return {
      type: 'database_collation',
      target: getConnection('target').getDatabaseName(),
      targetVal: target,
      sourceVal: source
    };
  };

  /**
   * query in source and target hosts and compare for database
   * character sets
   */
  this.checkDatabaseCharset = async () => {
    const source = await getDBVar('source', 'character_set_database');
    const target = await getDBVar('target', 'character_set_database');

    if (source === target) {
      return null;
    }

    return {
      type: 'character_set_database',
      target: getConnection('target').getDatabaseName(),
      targetVal: target,
      sourceVal: source
    };
  };

  /**
   * query for tables in the source and target hosts and
   * compare tables in them
   */
  this.compareTables = async (excludeInSource, excludeInTarget) => {
    const _DB = getConnection('target').getDatabaseName();

    const _source = getConnection('source');
    const _target = getConnection('target');

    excludeInSource = excludeInSource || [];
    excludeInTarget = excludeInTarget || [];

    const source = (await _source.getTables()).filter(
      _i => !excludeInSource.includes(_i)
    );
    const target = (await _target.getTables()).filter(
      _i => !excludeInTarget.includes(_i)
    );

    let inSource = [];
    let inTarget = [];

    let commons = [];

    for (let i = 0; i < target.length; i++) {
      let targetTable = target[i];

      if (source.indexOf(targetTable) > -1) {
        source.splice(source.indexOf(targetTable), 1);
        commons.push(targetTable);
      } else {
        inTarget.push(targetTable);
      }
    }

    const _diffs = [];

    if (commons.length > 0) {
      this.emit('progress', [
        `Found ${commons.length} common tables, comparing table schema`
      ]);

      for (let i = 0; i < commons.length; i++) {
        const table = commons[i];

        const sourceTableSchema = await _source.getTableSchema(table);
        const targetTableSchema = await _target.getTableSchema(table);

        //  check engine

        const sourceTableEngine = sourceTableSchema.engine;
        const targetTableEngine = targetTableSchema.engine;

        if (sourceTableEngine !== targetTableEngine) {
          _diffs.push({
            type: 'engine',
            target: [_DB, table],
            sourceVal: sourceTableSchema.engine,
            targetVal: targetTableSchema.engine
          });
        }

        //  check collation

        const sourceTableCollation = sourceTableSchema.collation;
        const targetTableCollation = targetTableSchema.collation;

        if (sourceTableCollation !== targetTableCollation) {
          _diffs.push({
            type: 'collation',
            target: [_DB, table],
            sourceVal: sourceTableSchema.collation,
            targetVal: targetTableSchema.collation
          });
        }

        //  check columns

        const sourceTableColumns = sourceTableSchema.columns;
        const targetTableColumns = targetTableSchema.columns;

        for (const col in sourceTableColumns) {
          if (typeof targetTableColumns[col] !== 'undefined') {
            if (sourceTableColumns[col] !== targetTableColumns[col]) {
              _diffs.push({
                type: 'column',
                target: [_DB, table],
                column: col,
                sourceVal: sourceTableColumns[col],
                targetVal: targetTableColumns[col],
                action: _getAlterColumnScript(
                  _DB,
                  table,
                  sourceTableColumns[col]
                )
              });
            }

            delete targetTableColumns[col];
          } else {
            _diffs.push({
              type: 'column',
              target: [_DB, table],
              column: col,
              targetVal: null,
              sourceVal: sourceTableColumns[col],
              action: _getAddColumnScript(_DB, table, sourceTableColumns[col])
            });
          }
        }

        for (const i in targetTableColumns) {
          if (!targetTableColumns.hasOwnProperty(i) || !targetTableColumns[i]) {
            continue;
          }

          _diffs.push({
            type: 'column',
            target: [_DB, table],
            column: i,
            sourceVal: sourceTableColumns[i],
            targetVal: targetTableColumns[i],
            action: _getDropColumnScript(_DB, table, i)
          });
        }
      }
    }

    if (source.length > 0) {
      inSource = inSource.concat(source);
    }

    if (!_diffs.length && !inSource.length && !inTarget.length) {
      return null;
    }

    if (inSource.length > 0) {
      for (let i = 0; i < inSource.length; i++) {
        const table = inSource[i];

        _diffs.push({
          type: 'table',
          target: [_DB, table],
          targetVal: null,
          sourceVal: null,
          action: await _source.getTableCreateSchema(table)
        });
      }
    }

    if (inTarget.length > 0) {
      for (let i = 0; i < inTarget.length; i++) {
        const table = inTarget[i];

        _diffs.push({
          type: 'table',
          target: [_DB, table],
          targetVal: null,
          sourceVal: null,
          action: _getTableDropSchema(_DB, table)
        });
      }
    }

    return _diffs;
  };

  function _getAddColumnScript(database, table, data) {
    return 'ALTER TABLE `' + database + '`.`' + table + '` ADD ' + data + ';';
  }

  function _getAlterColumnScript(database, table, data) {
    return (
      'ALTER TABLE `' +
      database +
      '`.`' +
      table +
      '` MODIFY COLUMN ' +
      data +
      ';'
    );
  }

  function _getDropColumnScript(database, table, column) {
    return (
      'ALTER TABLE `' +
      database +
      '`.`' +
      table +
      '` DROP COLUMN `' +
      column +
      '`;'
    );
  }

  function _getTableDropSchema(database, table) {
    return 'DROP TABLE `' + database + '`.`' + table + '`;';
  }

  this.on = (type, callback) => {
    if (!_events[type]) {
      _events[type] = [];
    }

    _events[type].push(callback);
  };

  this.emit = (type, args) => {
    if (!_events[type]) {
      return;
    }

    for (let i = 0; i < _events[type].length; i++) {
      const callback = _events[type][i];
      callback(...args);
    }
  };
}

function Connection(conn, key, opts) {
  const _connection = conn;
  const _key = key;
  const _opts = opts;

  const _getTableStatus = table =>
    new Promise(resolve =>
      _connection.query('SHOW TABLE STATUS LIKE ?', [table], (err, data) => {
        if (err) {
          log.error(err);
          return resolve(null);
        }

        return resolve({
          name: data[0].Name,
          engine: data[0].Engine,
          collation: data[0].Collation
        });
      })
    );

  const _getTableColumnData = table =>
    new Promise(resolve =>
      _connection.query(`SHOW CREATE TABLE ${table}`, (err, data) => {
        if (err) {
          log.error(err);
          return resolve(null);
        }

        const schema = data[0]['Create Table'];

        const lines = schema.split('\n').map(i => String(i).trim());

        const columns = {};
        const keys = {};
        const constraints = {};

        for (let i = 0; i < lines.length - 1; i++) {
          let line = lines[i];
          const matches = line.match(/`([^`]+)`/);
          const name = matches[1];

          line = line.replace(/^[\s\,]|[\s\,]$/, '');

          if (line.indexOf('`') === 0) {
            // column
            columns[name] = line;
          } else if (line.indexOf('CONSTRAINT') === 0) {
            // constraint
            constraints[name] = line;
          } else {
            // keys
            keys[name] = line;
          }
        }

        return resolve({
          columns,
          keys,
          constraints
        });
      })
    );

  this.close = callback =>
    _connection.close(err => {
      if (err) {
        return callback(err.message);
      }
      callback('Connection to ' + key + ' is closed.');
    });

  this.is = checkKey => _key === checkKey;

  this.getDatabaseName = () => _opts.db;

  this.getVar = _var =>
    new Promise(resolve =>
      _connection.query('SHOW VARIABLES LIKE ?', [_var], (err, data) => {
        if (err) {
          log.error(err);
          resolve(null);
        }

        return resolve(data[0].Value);
      })
    );

  this.getTables = () =>
    new Promise(resolve =>
      _connection.query('SHOW TABLES', (err, data) => {
        if (err) {
          log.error(err);
          return resolve(null);
        }

        let tables = [];

        for (const i in data) {
          if (data.hasOwnProperty(i)) {
            tables = tables.concat(Object.values(data[i]));
          }
        }

        tables = tables.sort();

        return resolve(tables);
      })
    );

  this.getTableSchema = async table => {
    const tableStatus = await _getTableStatus(table);
    const columnsData = await _getTableColumnData(table);

    return {
      ...tableStatus,
      ...columnsData
    };
  };

  this.getTableCreateSchema = async table =>
    new Promise(resolve =>
      _connection.query(`SHOW CREATE TABLE ${table}`, (err, data) => {
        if (err) {
          log.error(err);
          return resolve(null);
        }

        const schema = data[0]['Create Table'];

        const lines =
          schema
            .split('\n')
            .map(i => String(i).trim())
            .join(' ') + ';';

        return resolve(lines);
      })
    );
}

Connection.prototype.getDropColumnScript = function(database, table, column) {
  return `ALTER TABLE ``${database}``.``${table}`` DROP COLUMN ${column}`;
};

Connection.prototype.getTableDropSchema = function(database, table) {
  return `DROP TABLE ``${database}``.``${table}```;
};
