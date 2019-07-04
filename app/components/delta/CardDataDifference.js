import React, { Component } from 'react';

import Card from '../ui/Card';
import Button from '../ui/Button';

export default class CardDataDifference extends Component {
  render() {
    const { handleAction, data } = this.props;

    if (!data || !data.length) {
      return <React.Fragment />;
    }

    const cardTitle = 'Data Difference';

    const cardBody = (
      <div className="col-12">
        <div className="code-section">{JSON.stringify(data)}</div>
      </div>
    );

    return <Card title={cardTitle} body={cardBody} />;
  }
}
