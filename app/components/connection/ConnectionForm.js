import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { isEmpty } from 'lodash';

import { emit } from 'eiphop';
import Select from 'react-select';

import Spinner from '../ui/spinner/Spinner';

import { validateConnectionConfig } from '../../driver';

export default class ConnectionForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: { value: '', error: false },
      id: '',
      driver: { value: '', error: false },
      host: { value: '', error: false },
      db: { value: '', error: false },
      user: { value: '', error: false },
      pass: { value: '', error: false },
      isSubmitting: 0,
      res: {}
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleAlertClick = this.handleAlertClick.bind(this);
  }

  handleAlertClick() {
    this.setState({
      res: {}
    });
  }

  componentDidMount() {
    const connection = {
      name: { value: '', error: false },
      id: '',
      driver: { value: '', error: false },
      host: { value: '', error: false },
      db: { value: '', error: false },
      user: { value: '', error: false },
      pass: { value: '', error: false },
      isSubmitting: 0,
      res: {}
    };

    if (this.props.connection) {
      for (let i in connection) {
        if (
          connection.hasOwnProperty(i) &&
          typeof this.props.connection[i] !== 'undefined'
        ) {
          if (i === 'id') {
            connection[i] = this.props.connection[i];
          } else {
            connection[i].value = this.props.connection[i];
          }
        }
      }
    }

    this.setState({ ...connection });
  }

  componentDidUpdate(prevProps, prevState) {}

  handleChange(key, value) {
    const stateObj = {};

    stateObj[key] = {
      value: value,
      error: value === ''
    };

    stateObj.res = {};

    this.setState(stateObj);
  }

  handleSubmit() {
    if (this.state.isSubmitting) {
      return;
    }

    const errors = {};
    const fields = ['name', 'driver', 'host', 'db', 'user', 'pass'];

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
      res: {}
    });

    const connection = {
      name: this.state.name.value,
      id: this.state.id,
      driver: this.state.driver.value,
      host: this.state.host.value,
      user: this.state.user.value,
      pass: this.state.pass.value,
      db: this.state.db.value
    };

    validateConnectionConfig(connection, err => {
      if (err) {
        this.setState({
          isSubmitting: 0,
          res: { success: false, msg: err.message }
        });
      } else {
        emit('saveConnection', connection)
          .then(res => this.setState({ res: res }))
          .catch(e =>
            this.setState({ res: { success: false, msg: e.message } })
          )
          .finally(() => this.setState({ isSubmitting: 0 }));
      }
    });
  }

  render() {
    const driverOptions = [
      {
        value: 'mysql',
        label: 'MySQL / MariaDB'
      }
    ];

    const getDriverOption = value =>
      driverOptions.filter(i => i.value === value).pop();

    const isEdit = this.state.id !== '';

    const getSpinner = () =>
      this.state.isSubmitting ? (
        <i className="tim-icons fas fa-circle-notch fa-spin" />
      ) : (
        ''
      );

    const getSubmitBtnLabel = () => (this.state.id !== '' ? 'Update' : 'Save');

    const getFormGroupClass = prop =>
      ['form-group', this.state[prop].error ? 'has-danger' : ''].join(' ');

    const getPageTitle = () =>
      isEdit ? 'Edit Connection' : 'Add New Connection';

    const getStatus = () => {
      if (isEmpty(this.state.res)) {
        return '';
      }

      const className = [
        'alert',
        'alert-' + (this.state.res.success ? 'success' : 'danger'),
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
              (this.state.res.success ? 'check-circle' : 'exclamation-triangle')
            }
          />
          {this.state.res.msg}
        </div>
      );
    };

    return (
      <div className="col-md-8">
        <h2 className="monSubmitForm-4 display-3">{getPageTitle()}</h2>

        <form className={this.state.isSubmitting ? 'loading' : ''}>
          <div className="card mb-2">
            <div className="card-body">
              <div className="form-row">
                <div className="col">
                  <div className={getFormGroupClass('name')}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Connection Name"
                      value={this.state.name.value}
                      onChange={e => this.handleChange('name', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col">
                  <div className={getFormGroupClass('driver')}>
                    <Select
                      name="driver"
                      id="driver"
                      className="react-select-container"
                      classNamePrefix="react-select"
                      options={driverOptions}
                      placeholder="Select Database Driver"
                      onChange={e => this.handleChange('driver', e.value)}
                      defaultValue={getDriverOption(this.state.driver.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="col">
                  <div className={getFormGroupClass('host')}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Database Host"
                      value={this.state.host.value}
                      onChange={e => this.handleChange('host', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="col">
                  <div className={getFormGroupClass('user')}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="User Name"
                      value={this.state.user.value}
                      onChange={e => this.handleChange('user', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col">
                  <div className={getFormGroupClass('pass')}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Password"
                      value={this.state.pass.value}
                      onChange={e => this.handleChange('pass', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="col">
                  <div className={getFormGroupClass('db')}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Database Name"
                      value={this.state.db.value}
                      onChange={e => this.handleChange('db', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {getStatus()}

          <div className="d-flex justify-content-between">
            <button
              type="button"
              onClick={this.handleSubmit}
              className="btn btn-primary"
            >
              {getSpinner()}
              {getSubmitBtnLabel()}
            </button>
            <Link to={'/connections'} className="btn btn-default">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    );
  }
}
