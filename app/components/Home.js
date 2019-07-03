// @flow
import React, { Component } from 'react';
import Select from 'react-select';

import { emit } from 'eiphop';
import { isEmpty } from 'lodash';

import Manager from '../driver';
import Delta from './delta/Delta';

export default class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      source: { value: '', error: false },
      target: { value: '', error: false },
      connections: [],
      progress: [],
      res: {},
      accepted: {}
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleAlertClick = this.handleAlertClick.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleAction = this.handleAction.bind(this);
  }

  componentDidMount() {
    emit('getConnections', {})
      .then(res =>
        this.setState({
          connections: Object.values(res.data)
        })
      )
      .catch(err => console.log(err));
  }

  handleAlertClick() {
    this.setState({
      res: {},
      progress: []
    });
  }

  async handleChange(key, value) {
    const stateObj = {};

    stateObj[key] = {
      value: value,
      error: value === ''
    };

    stateObj.res = {};

    this.setState(stateObj);
  }

  async handleSubmit() {
    if (this.state.isSubmitting) {
      return;
    }

    const errors = {};
    const fields = ['source', 'target'];

    for (let i in this.state) {
      if (fields.indexOf(i) > -1) {
        const ii = this.state[i];
        if (ii.error || ii.value === '') {
          ii.error = true;
          errors[i] = ii;
        }
      }
    }

    if (Object.values(errors).length) {
      this.setState(errors);
      return;
    }

    this.setState({ isSubmitting: 1, res: {}, progress: [] });

    const { connections, source, target } = this.state;

    const _source = connections.filter(i => i.id === source.value).pop();

    const _target = connections.filter(i => i.id === target.value).pop();

    const manager = new Manager(_source, _target);

    const stateProgress = [];

    manager.on('progress', progress => {
      stateProgress.push(progress);

      this.setState({ progress: stateProgress });
    });

    manager.on('end', result => {
      const res = {
        success: !(result instanceof Error),
        msg: result.message,
        data: result.data || {}
      };
      this.setState({ isSubmitting: 0, res: res });
    });

    manager.getDelta();
  }

  handleAction(state, key, value) {
    const { accepted } = this.state;

    if (state) {
      accepted[key] = value;
    } else {
      delete accepted[key];
    }

    this.setState({
      accepted
    });
  }

  render() {
    const {
      connections,
      isSubmitting,
      progress,
      res,
      source,
      target,
      accepted
    } = this.state;

    const connectionOptions = connections.map(i => {
      return {
        label: i.name,
        value: i.id
      };
    });

    const getConnectionOption = value =>
      connectionOptions.filter(i => i.value === value).pop();

    const getSpinner = () =>
      isSubmitting ? (
        <i className="tim-icons fas fa-circle-notch fa-spin" />
      ) : (
        ''
      );

    const getFormGroupClass = prop =>
      ['form-group', this.state[prop].error ? 'has-danger' : ''].join(' ');

    const getProgress = () => {
      if (!progress.length) {
        return '';
      }

      return (
        <div className="verbose">
          {progress.map((value, i) => (
            <p key={i}>{value}</p>
          ))}
        </div>
      );
    };

    const getStatus = () => {
      if (isEmpty(res)) {
        return '';
      }

      const className = [
        'alert',
        'alert-' + (res.success ? 'success' : 'danger'),
        'alert-with-icon'
      ].join(' ');

      return (
        <div className={className}>
          <button
            type="button"
            aria-hidden="true"
            className="close"
            data-dismiss="alert"
            aria-label="Close"
            onClick={this.handleAlertClick}
          >
            <i className="fas fa-times" />
          </button>
          <span
            data-notify="icon"
            className={
              'fas fa-' +
              (res.success ? 'check-circle' : 'exclamation-triangle')
            }
          />
          {res.msg}
        </div>
      );
    };

    const getCard = (title, body) => {
      return (
        <div className="col-sm-12">
          <div className="card">
            <div className="card-title">
              <h3 className="display-2 text-center mt-4 mb-0">{title}</h3>
            </div>
            <div className="card-body">
              <div className="row display-flex">{body}</div>
            </div>
          </div>
        </div>
      );
    };

    const getSchemaDifferenceCard = () => {
      if (
        isEmpty(res) ||
        !res.data ||
        !res.data.schema ||
        !res.data.schema.length
      ) {
        return '';
      }

      const schema = res.data.schema;
      const tables = {};

      for (let i = 0; i < schema.length; i++) {
        const item = schema[i];

        switch (item.type) {
          case 'column':
            const table = item.target[1];

            if (typeof tables[table] === 'undefined') {
              tables[table] = [];
            }

            tables[table].push(item);

            break;
          case 'table':
            tables[item.target[1]] = [item];
            break;
        }
      }

      const tableArray = Object.values(tables);

      return getCard(
        'Schema',
        tableArray.map((table, index) => (
          <Delta key={index} table={table} handleAction={this.handleAction} />
        ))
      );
    };

    const getDataDifferenceCard = () => {
      if (
        isEmpty(res) ||
        !res.data ||
        !res.data.data ||
        !res.data.data.length
      ) {
        return '';
      }

      return getCard('Data', JSON.stringify(res.data.data));
    };

    const getAcceptedMigration = () => {
      const sql = Object.values(accepted)
        .map(i => i.action)
        .join('\n');

      if (sql === '') {
        return '';
      }

      return getCard(
        'Generated SQL',
        <div className="code-section">{sql}</div>
      );
    };

    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-12">
            <h2 className="display-2 text-center">Calculate Delta</h2>
            <div className="card">
              <div className="card-body">
                <form id="connection-form" className="form">
                  <div className="row">
                    <div className="col-sm-6">
                      <h2 className="text-info mb-2">Source</h2>

                      <div className={getFormGroupClass('source')}>
                        <Select
                          name="conn-source"
                          id="conn-source"
                          className="react-select-container"
                          classNamePrefix="react-select"
                          options={connectionOptions}
                          placeholder="Select Source Connection"
                          onChange={e => this.handleChange('source', e.value)}
                          defaultValue={getConnectionOption(source.value)}
                        />
                      </div>
                    </div>

                    <div className="col-sm-6">
                      <h2 className="text-danger text-right  mb-2">Target</h2>

                      <div className={getFormGroupClass('target')}>
                        <Select
                          name="conn-target"
                          id="conn-target"
                          className="react-select-container"
                          classNamePrefix="react-select"
                          options={connectionOptions}
                          placeholder="Select Target Connection"
                          onChange={e => this.handleChange('target', e.value)}
                          defaultValue={getConnectionOption(target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {getProgress()}
                  {getStatus()}

                  <div className="btn-container text-center mb-4">
                    <button
                      type="button"
                      className="btn btn-primary"
                      id="get-delta"
                      onClick={this.handleSubmit}
                    >
                      {getSpinner()}
                      Calculate Delta
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {getSchemaDifferenceCard()}
          {getDataDifferenceCard()}
          {getAcceptedMigration()}
        </div>
      </div>
    );
  }
}
