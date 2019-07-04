// @flow
import React, { Component } from 'react';
import Select from 'react-select';

import { emit } from 'eiphop';
import { isEmpty } from 'lodash';

import Manager from '../driver';
import CardSchemaDifference from './delta/CardSchemaDifference';
import CardDataDifference from './delta/CardDataDifference';
import CardAcceptedMigration from './delta/CardAcceptedMigration';

import Status from '../components/ui/Status';
import Button from '../components/ui/Button';

export default class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      source: { value: '', error: false },
      target: { value: '', error: false },
      connections: [],
      progress: [],
      res: {},
      accepted: {},
      saveResp: {}
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleActionSchema = this.handleActionSchema.bind(this);
    this.handleSelectAllSchema = this.handleSelectAllSchema.bind(this);
    this.handleSelectNoneSchema = this.handleSelectNoneSchema.bind(this);
    this.handleGenerateSqlFile = this.handleGenerateSqlFile.bind(this);
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

  async handleChange(key, value) {
    const stateObj = {};

    stateObj[key] = {
      value: value,
      error: value === ''
    };

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

    this.setState({
      isSubmitting: 1,
      res: {},
      progress: [],
      accepted: {}
    });

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

  handleActionSchema(state, key, value) {
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

  handleSelectAllSchema() {
    const accepted = {};

    const { res } = this.state;

    const schema =
      !isEmpty(res) &&
      typeof res.data !== 'undefined' &&
      typeof res.data.schema !== 'undefined'
        ? res.data.schema
        : [];

    Object.values(schema).forEach(i => {
      accepted[i.target.join('.')] = i;
    });

    this.setState({
      accepted
    });
  }
  handleSelectNoneSchema() {
    this.setState({
      accepted: {}
    });
  }

  handleSelectAllData() {}
  handleSelectNoneData() {}

  handleGenerateSqlFile() {
    const { source, target, accepted, connections } = this.state;

    const _source = connections.filter(i => i.id === source.value).pop();
    const _target = connections.filter(i => i.id === target.value).pop();

    const toSnakeCase = text =>
      String(text)
        .toLowerCase()
        .split(' ')
        .join('_');

    const fileName =
      [
        toSnakeCase(_source.name),
        toSnakeCase(_target.name),
        new Date().getTime()
      ].join('_') + '.sql';

    emit('saveSqlFile', {
      name: fileName,
      data: accepted
    })
      .then(resp => this.setState({ saveResp: resp }))
      .catch(e =>
        this.setState({ saveResp: { success: false, message: e.message } })
      );
  }

  render() {
    const {
      connections,
      isSubmitting,
      progress,
      res,
      source,
      target,
      accepted,
      saveResp
    } = this.state;

    const connectionOptions = connections.map(i => {
      return {
        label: i.name,
        value: i.id
      };
    });

    const getConnectionOption = value =>
      connectionOptions.filter(i => i.value === value).pop();

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

    const deltaSchema =
      !isEmpty(res) &&
      typeof res.data !== 'undefined' &&
      typeof res.data.schema !== 'undefined'
        ? res.data.schema
        : [];

    const deltaData =
      !isEmpty(res) &&
      typeof res.data !== 'undefined' &&
      typeof res.data.data !== 'undefined'
        ? res.data.data
        : [];

    const acceptedList = Object.keys(accepted);

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

                  <Status data={res} />

                  <div className="btn-container text-center mb-4">
                    <Button
                      classes="btn-primary"
                      id="get-delta"
                      text="Calculate Delta"
                      spin={isSubmitting}
                      handleClick={this.handleSubmit}
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>

          <CardSchemaDifference
            handleSelectAll={this.handleSelectAllSchema}
            handleSelectNone={this.handleSelectNoneSchema}
            handleAction={this.handleActionSchema}
            accepted={acceptedList}
            schema={deltaSchema}
          />

          <CardDataDifference
            handleSelectAll={this.handleSelectAllData}
            handleSelectNone={this.handleSelectNoneData}
            handleAction={this.handleActionData}
            data={deltaData}
          />

          <CardAcceptedMigration
            items={accepted}
            handleAction={this.handleGenerateSqlFile}
            status={saveResp}
          />
        </div>
      </div>
    );
  }
}
