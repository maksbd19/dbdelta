// @flow
import React, { Component } from 'react';
import Select from 'react-select';

import { emit } from 'eiphop';
import { isEmpty } from 'lodash';

import Manager from '../driver';

export default class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      source: { value: '', error: false },
      target: { value: '', error: false },
      connections: [],
      progress: [],
      res: {}
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleAlertClick = this.handleAlertClick.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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

    const source = connections.filter(i => i.id === source.value).pop();

    const target = connections.filter(i => i.id === target.value).pop();

    const manager = new Manager(source, target);

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

  render() {
    const {
      connections,
      isSubmitting,
      progress,
      res,
      source,
      target
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
              <h3 className="display-5 text-center mt-2">{title}</h3>
            </div>
            <div className="card-body">{body}</div>
          </div>
        </div>
      );
    };

    const getSchemaDifferenceCard = () => {
      if (isEmpty(res) || !res.data || !res.data.schema) {
        return '';
      }

      const schema = res.data.schema;

      return getCard(
        'Schema',
        <table className="table">
          <tbody>
            {schema.map((i, index) => (
              <tr key={index}>
                <td className="source-col-name">{i['column']}</td>
                <td className="col-delta">
                  <div className="source-col-value">{i['sourceVal']}</div>
                  <div className="target-col-value">{i['targetVal']}</div>
                </td>
                <td className="col-action">
                  <div className="accept-source">
                    <i className="fa fa-check" />
                  </div>
                  <div className="accept-target">
                    <i className="fa fa-check" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    };

    const getDataDifferenceCard = () => {
      if (isEmpty(res) || !res.data || !res.data.data) {
        return '';
      }
      return getCard('Data', JSON.stringify(res.data.data));
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
        </div>
      </div>
    );
  }
}
