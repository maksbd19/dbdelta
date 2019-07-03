import React, { Component } from 'react';

import DeltaColumn from './DeltaColumn';
import DeltaTable from './DeltaTable';

export default class Delta extends Component {
  constructor(props) {
    super(props);

    const { table, handleAction } = this.props;

    this.state = {
      table,
      handleAction
    };

    this.handleAction = this.handleAction.bind(this);
  }

  handleAction(state, key, value) {
    this.state.handleAction(state, key, value);
  }

  render() {
    const { table } = this.state;

    if (!table) {
      return <span>Loading...</span>;
    }

    const getRow = i => {
      switch (i.type) {
        case 'column':
          return <DeltaColumn column={i} handleAction={this.handleAction} />;
        case 'table':
          return <DeltaTable table={i} handleAction={this.handleAction} />;
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
