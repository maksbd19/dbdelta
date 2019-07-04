import React, { Component } from 'react';

import Spin from './Spin';

export default class Button extends Component {
  render() {
    const { classes, id, handleClick, text, spin } = this.props;

    return (
      <button
        type="button"
        className={'btn ' + classes}
        id={id}
        onClick={handleClick}
      >
        <Spin spin={spin} />
        {text}
      </button>
    );
  }
}
