import React, { Component } from 'react';

export default class Spin extends Component {
  render() {
    const { spin } = this.props;

    if (spin) {
      return <i className="tim-icons fas fa-circle-notch fa-spin" />;
    } else {
      return <React.Fragment />;
    }
  }
}
