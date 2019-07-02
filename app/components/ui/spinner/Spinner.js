import React from 'react';

function Spinner(props) {
  const { spinning } = props;

  const spinnerClass = [
    spinning ? 'd-block' : 'd-none',
    ' spinner-container'
  ].join();

  return (
    <div className={spinnerClass}>
      <i className="fa fa-spinner" />
    </div>
  );
}

export default Spinner;
