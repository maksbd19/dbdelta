import React, { Component } from 'react';

export default class DeltaColumn extends Component {
  constructor(props) {
    super(props);

    const { column } = this.props;

    this.state = {
      column
    };

    this.handleAction = this.handleAction.bind(this);
  }

  render() {
    const { column } = this.state.column;

    return (
      <tr>
        <td className="source-col-name">{column['column']}</td>
        <td className="col-delta">
          <div className="source-col-value">{column['sourceVal']}</div>
          <div className="target-col-value">{column['targetVal']}</div>
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
    );
  }
}
