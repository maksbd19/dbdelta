import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Modal from 'react-modal';
import { emit } from 'eiphop';
import { isEmpty } from 'lodash';

import ConnectionItem from './ConnectionItem';

Modal.setAppElement(document.getElementById('root'));

export default class ConenctionList extends Component {
  constructor(props) {
    super(props);

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleDeleteConnection = this.handleDeleteConnection.bind(this);
    this.handleAlertClick = this.handleAlertClick.bind(this);
  }

  componentDidMount() {
    const { connections } = this.props;

    const stateObj = {
      showModal: false,
      connections: Object.values(connections),
      toDelete: {
        name: ''
      }
    };

    this.setState(stateObj);
  }

  handleAlertClick() {
    this.setState({
      res: {}
    });
  }

  handleDeleteConnection() {
    if (this.state.isSubmitting) {
      return;
    }

    this.setState({
      isSubmitting: 1,
      res: {}
    });

    const { connections, toDelete } = this.state;

    emit('deleteConnection', toDelete)
      .then(res => this.setState({ res: res, showModal: false }))
      .catch(e => this.setState({ res: { success: false, msg: e.message } }))
      .finally(() =>
        this.setState({
          isSubmitting: 0,
          toDelete: { name: '' },
          connections: connections.filter(i => i.id !== toDelete.id)
        })
      );
  }

  handleOpenModal(evt, connection) {
    this.setState({
      showModal: true,
      toDelete: connection
    });
  }

  handleCloseModal() {
    this.setState({
      showModal: false,
      toDelete: {
        name: ''
      }
    });
  }

  render() {
    if (!this.state) {
      return <h1>Loading</h1>;
    }

    const { showModal, toDelete, res } = this.state;

    const getConnectionItemComponent = () => {
      if (this.state.connections.length) {
        return this.state.connections.map(item => (
          <ConnectionItem
            key={item.id}
            connection={item}
            open-modal={this.handleOpenModal}
          />
        ));
      }

      return <h1>No connection found</h1>;
    };

    const customStyles = {
      content: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999
      }
    };

    const getStatus = () => {
      if (isEmpty(res)) {
        return '';
      }

      const className = [
        'alert',
        'alert-' + (res ? 'success' : 'danger'),
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

    return (
      <div className="col-md-6">
        <h2 className="mb-4 display-3">Available Connections</h2>
        <div className="connections">
          {getStatus()}
          <div className="list-group compact compact-icons">
            {getConnectionItemComponent()}
          </div>
        </div>
        <Modal
          isOpen={showModal}
          className="ReactModal__Content"
          aria={{
            labelledby: 'heading',
            describedby: 'full_description'
          }}
          style={customStyles}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Delete Connection</h2>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                  onClick={this.handleCloseModal}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>
                  You are about to delete{' '}
                  <span className="text-primary">{toDelete.name}</span>{' '}
                  connection configuration.
                </p>
                <p>Please confirm that you are sure before proceeding.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={this.handleDeleteConnection}
                >
                  Confrim
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={this.handleCloseModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Modal>
        <div className="mt-4">
          <Link to="/connections/create" className="btn-block btn btn-primary">
            <i className="fa fa-plus" /> Add New Connection
          </Link>
        </div>
      </div>
    );
  }
}
