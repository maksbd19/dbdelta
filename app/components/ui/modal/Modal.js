import React, { Component } from 'react';

export default class Modal extends Component {
  constructor(props) {
    super(props);

    this.handleConfirmBtnClick = this.handleConfirmBtnClick.bind(this);
    this.handleCancelBtnClick = this.handleCancelBtnClick.bind(this);
  }

  componentDidMount() {
    const { title, body, btnConfrimTitle, btnCancelTitle } = this.props;

    const stateObj = {
      title: title || '',
      body: body || '',
      btnConfrimTitle: btnConfrimTitle || '',
      btnCancelTitle: btnCancelTitle || '',
      btnConfirmCallback: () => {},
      btnCancelCallback: () => {}
    };

    this.setState(stateObj);
  }

  handleConfirmBtnClick(evt) {
    const { btnConfirmCallback } = this.state;

    if (typeof btnConfirmCallback === 'function') {
      return btnConfirmCallback(evt);
    }
  }

  handleCancelBtnClick(evt) {
    const { btnCancelCallback } = this.state;

    if (typeof btnCancelCallback === 'function') {
      return btnCancelCallback(evt);
    }
  }

  render() {
    const { title, body, btnConfrimTitle, btnCancelTitle } = this.state;
    return (
      <div className="modal" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">{body}</div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={this.handleConfirmBtnClick}
              >
                {btnConfrimTitle}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                data-dismiss="modal"
                onClick={this.handleCancelBtnClick}
              >
                {btnCancelTitle}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
