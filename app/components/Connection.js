// @flow
import React, { Component } from 'react';
import { isEqual, isEmpty } from 'lodash';
import { emit } from 'eiphop';

import ConnectionList from './connection/ConnectionList';
import ConnectionForm from './connection/ConnectionForm';

export default class Connection extends Component {
  componentDidMount() {
    const {
      match: { params, path }
    } = this.props;

    emit('getConnections', {})
      .then(res =>
        this.setState({
          connections: res.data,

          params: params,
          path: path
        })
      )
      .catch(err => console.log(err));
  }

  componentDidUpdate() {
    const {
      match: { params, path }
    } = this.props;

    if (!this.state) {
      return;
    }

    const stateObj = {};

    if (this.state.path !== path) {
      stateObj.path = path;
    }

    if (!isEqual(this.state.params, params)) {
      stateObj.params = params;
    }

    if (!isEmpty(stateObj)) {
      this.setState(stateObj);
    }
  }

  render() {
    if (!this.state) {
      return (
        <h1>
          Loading... <i className="fa fa-spinner" />
        </h1>
      );
    }

    const params = this.state && this.state.params;
    const path = this.state && this.state.path;

    const actionComponentRendered = _path => {
      const PATHS = {
        CREATE: '/connections/create',
        EDIT: '/connections/edit/:id',
        UPDATE: 2,
        DELETE: '/connections/delete/:id'
      };

      const { connections } = this.state;

      switch (_path) {
        case PATHS.CREATE:
          return <ConnectionForm />;
        case PATHS.EDIT:
          return <ConnectionForm connection={connections[params.id]} />;
        default:
          return <ConnectionList connections={connections} />;
      }
    };

    return (
      <div>
        <div className="container-fluid">
          <div className="row mt-4 justify-content-around">
            {actionComponentRendered(path)}
          </div>
        </div>
      </div>
    );
  }
}
