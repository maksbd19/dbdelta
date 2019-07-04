import React, { Component } from 'react';
import { isEmpty } from 'lodash';

export default class Status extends Component {
  render() {
    const { data } = this.props;

    if (isEmpty(data)) {
      return <React.Fragment />;
    }

    const className = [
      'alert',
      'alert-' + (data.success ? 'success' : 'danger'),
      'alert-with-icon'
    ].join(' ');

    return (
      <div className={className}>
        <span
          data-notify="icon"
          className={
            'fas fa-' + (data.success ? 'check-circle' : 'exclamation-triangle')
          }
        />
        {data.msg}
      </div>
    );
  }
}
