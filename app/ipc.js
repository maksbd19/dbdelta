import * as path from 'path';
import * as fs from 'fs';
import electron, { dialog, app, BrowserWindow } from 'electron';
import { setupMainHandler } from 'eiphop';
import shortid from 'shortid';
import log from './lib/logger';

const configFilePath = path.join(__dirname, './data/config.json');

if (!fs.existsSync(configFilePath)) {
  fs.writeFileSync(configFilePath, JSON.stringify({}), 'utf-8');
}

function getParams() {
  let data = {};

  try {
    const raw = fs.readFileSync(configFilePath);
    data = JSON.parse(raw);
  } catch (e) {
    log.error(e);
  }

  return data;
}

function uuid() {
  return shortid.generate();
}

const getConnections = (req, res) => {
  let data = {};

  try {
    const raw = fs.readFileSync(configFilePath);
    data = JSON.parse(raw);
  } catch (e) {
    log.error(e);
  }

  res.send({ msg: 'connection list fetch successful', data });
};

const saveConnection = async (req, res) => {
  const { payload } = req;

  const parsed = {
    name: '',
    id: '',
    driver: '',
    host: '',
    user: '',
    pass: '',
    db: ''
  };

  for (const i in payload) {
    if (payload.hasOwnProperty(i) && typeof parsed[i] !== 'undefined') {
      parsed[i] = payload[i];
    }
  }

  if (parsed.id === '') {
    parsed.id = uuid();
  }

  try {
    const data = getParams();

    data[parsed.id] = parsed;

    fs.writeFileSync(configFilePath, JSON.stringify(data), 'utf-8');

    res.send({
      msg: 'Connection configuration saved successfully.',
      success: true
    });
  } catch (ee) {
    res.send({
      msg: ee.message || 'Invalid connection configuration',
      success: false
    });
  }
};

const deleteConnection = async (req, res) => {
  const { payload } = req;

  let data = getParams();

  delete data[payload.id];

  fs.writeFileSync(configFilePath, JSON.stringify(data), 'utf-8');

  res.send({
    msg: 'Connection configuration deleted successfully.',
    success: true
  });
};

const saveSqlFile = async (req, res) => {
  const { name, data } = req.payload;

  const processAction = item => {
    switch (item.type) {
      case 'table':
        let action = item.action;

        const create = action.indexOf('CREATE TABLE') > -1;

        if (create) {
          action = action.replace(/` \( `/g, '` (\n  `');
          action = action.replace(/, `/g, ',\n  `');
          action = action.replace(/, PRIMARY/g, ',\n  PRIMARY');
          action = action.replace(/\) ENGINE/g, '\n) ENGINE');
        }

        const comment = `-- ${
          create ? 'Create new' : 'Drop'
        } Table ${item.target.join('.')}`;

        return [comment, action].join('\n');
      default:
        return '';
    }
  };

  const sql = Object.values(data)
    .map(i => processAction(i))
    .join('\n\n');

  const options = {
    title: 'Save current page as a pdf',
    defaultPath: app.getPath('documents') + '/' + name
  };

  dialog.showSaveDialog(BrowserWindow, options, path => {
    fs.writeFile(path, sql, 'utf-8', err => {
      if (err) {
        res.send({
          msg: e.message,
          success: false
        });
      }
      res.send({
        msg: 'File saved successfully',
        success: true
      });
    });
  });
};

const ipcActions = {
  getConnections,
  saveConnection,
  deleteConnection,
  saveSqlFile
};

export default function ipcHandlerSetup() {
  setupMainHandler(electron, { ...ipcActions }, true);
}
