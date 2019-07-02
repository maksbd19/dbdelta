import * as path from 'path';
import * as fs from 'fs';
import electron from 'electron';
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

const ipcActions = {
  getConnections,
  saveConnection,
  deleteConnection
};

export default function ipcHandlerSetup() {
  setupMainHandler(electron, { ...ipcActions }, true);
}
