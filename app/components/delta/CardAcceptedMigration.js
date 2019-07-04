import React, { Component } from 'react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Status from '../ui/Status';

export default class CardAcceptedMigration extends Component {
  render() {
    const { items, handleAction, status } = this.props;

    const sql = Object.values(items).map((i, index) => (
      <code key={index}>{prepareAction(i)}</code>
    ));

    if (sql.length === 0) {
      return <React.Fragment />;
    }

    function prepareAction(item) {
      const lines = [];

      switch (item.type) {
        case 'table':
          let action = item.action;

          const create = action.indexOf('CREATE TABLE') > -1;

          if (create) {
            action = action.replace(/` \( `/g, '` (\n  `');
            action = action.replace(/, `/g, ',\n  `');
            action = action.replace(', PRIMARY', ',\n  PRIMARY');
            action = action.replace(') ENGINE', '\n) ENGINE');
          }

          const text = create ? 'Create' : 'Drod';

          return (
            <React.Fragment>
              {'\n'}
              <span className="text-muted">
                -- {text} table : {item.target.join('.')}
              </span>
              <span className="text-highloghted">{action}</span>
            </React.Fragment>
          );
      }

      return lines.join('\n');
    }

    const cardTitle = 'Generated SQL';

    const cardBody = (
      <div className="col-12">
        <div className="code-section">{sql}</div>
      </div>
    );

    const cardFooter = (
      <div className="btn-container text-center">
        <Status data={status} />
        <Button
          classes="btn-primary"
          handleClick={handleAction}
          text="Generate Sql File"
        />
      </div>
    );

    return <Card title={cardTitle} body={cardBody} footer={cardFooter} />;
  }
}
