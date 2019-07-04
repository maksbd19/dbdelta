import React, { Component } from 'react';

import { isEqual, sortBy } from 'lodash';

import DeltaColumn from './DeltaColumn';
import DeltaTable from './DeltaTable';

export default class Delta extends Component {
  constructor(props) {
    super(props);

    const { table, handleAction, accepted } = this.props;

    this.state = {
      table,
      handleAction,
      accepted
    };

    this.handleAction = this.handleAction.bind(this);
  }

  componentDidUpdate(prevProps) {
    const thisAccepted = this.props.accepted;
    const prevAccepted = prevProps.accepted;

    if (!isEqual(sortBy(thisAccepted), sortBy(prevAccepted))) {
      this.setState({
        accepted: thisAccepted
      });
    }
  }

  handleAction(state, key, value) {
    this.state.handleAction(state, key, value);
  }

  render() {
    const { table, accepted } = this.state;

    if (!table) {
      return <span>Loading...</span>;
    }

    const getRow = i => {
      const itemIsAccepted = accepted.indexOf(i.target.join('.')) > -1;

      switch (i.type) {
        case 'column':
          return (
            <DeltaColumn
              column={i}
              handleAction={this.handleAction}
              accepted={itemIsAccepted}
            />
          );
        case 'table':
          return (
            <DeltaTable
              table={i}
              handleAction={this.handleAction}
              accepted={itemIsAccepted}
            />
          );
      }
    };

    return (
      <div className="col-md-6">
        <table className="table delta-table">
          <tbody>
            {table.map((i, index) => (
              <tr key={index}>
                <td>{getRow(i)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
