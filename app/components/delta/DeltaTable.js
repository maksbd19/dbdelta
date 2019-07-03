import React, { Component } from 'react';

export default class DeltaTable extends Component {
  constructor(props) {
    super(props);

    const { table, handleAction } = this.props;

    this.state = {
      table,
      handleAction,
      accepted: false,
      open: false
    };

    this.handleAction = this.handleAction.bind(this);
    this.handleCollapse = this.handleCollapse.bind(this);
  }

  handleAction() {
    const { table, handleAction, accepted } = this.state;

    this.setState({
      accepted: !accepted
    });

    const key = table.target.join('.');

    handleAction(!accepted, key, table);
  }

  handleCollapse() {
    const { open } = this.state;

    this.setState({
      open: !open
    });
  }

  render() {
    const { table, accepted, open } = this.state;

    const btnClass = `btn ${
      accepted ? 'btn-primary' : 'btn-gray'
    } btn-icon btn-round accept-action`;

    const iconClassCollapse = `fa fa-${open ? 'chevron-up' : 'chevron-down'}`;

    const showClass = open ? 'd-block' : 'd-none';

    return (
      <div className="row">
        <div className="col-6 d-flex align-items-center">
          <div className="source-table-name">{table.target[1]}</div>
        </div>
        <div className="col-6">
          <div className="col-action text-right">
            <button
              type="button"
              className="btn btn-icon btn-round accept-action mr-2"
              onClick={this.handleCollapse}
            >
              <i className={iconClassCollapse} />
            </button>
            <button
              type="button"
              className={btnClass}
              onClick={this.handleAction}
            >
              <i className="fa fa-check" />
            </button>
          </div>
        </div>
        <div className="col-12">
          <div className={showClass}>
            <div className="create-table-action mt-3">
              <div className="code-section">{table.action}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
