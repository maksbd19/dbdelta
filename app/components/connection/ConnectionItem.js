import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ConnectionItem extends Component {
  constructor(props) {
    super(props);

    this.handleDeleteClick = this.handleDeleteClick.bind(this);
  }

  componentDidMount() {
    const { connection } = this.props;
    const { name, id } = connection;

    const stateObj = {
      connection: connection,
      name: name,
      id: id,
      handleDeleteClick: (() =>
        typeof this.props['open-modal'] === 'function'
          ? this.props['open-modal']
          : () => {})()
    };

    this.setState(stateObj);
  }

  handleDeleteClick(evt, conenction) {
    return this.state.handleDeleteClick(evt, conenction);
  }

  render() {
    if (!this.state) {
      return <h1>Loading</h1>;
    }

    const { name, id, connection } = this.state;

    const _editRoute = _id => `/connections/edit/${_id}`;

    return (
      <React.Fragment>
        <div className="list-group-item">
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-gray-50">{name}</span>
            <div className="-btn-group">
              <Link
                to={_editRoute(id)}
                className="btn btn-default btn-neutral btn-fab btn-icon btn-round btn-sm"
              >
                <i className="fa fa-pencil-alt" />
              </Link>
              <button
                type="button"
                onClick={e => this.handleDeleteClick(e, connection)}
                className="btn btn-default btn-neutral btn-fab btn-icon btn-round btn-sm"
              >
                <i className="fa fa-trash-alt" />
              </button>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
