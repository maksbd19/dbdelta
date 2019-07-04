import React, { Component } from 'react';

import Delta from './Delta';

import Card from '../ui/Card';
import Button from '../ui/Button';

export default class CardSchemaDifference extends Component {
  render() {
    const {
      handleSelectAll,
      handleSelectNone,
      handleAction,
      schema,
      accepted
    } = this.props;

    if (!schema || !schema.length) {
      return <React.Fragment />;
    }

    const tables = {};

    for (let i = 0; i < schema.length; i++) {
      const item = schema[i];

      switch (item.type) {
        case 'column':
          const table = item.target[1];

          if (typeof tables[table] === 'undefined') {
            tables[table] = [];
          }

          tables[table].push(item);

          break;
        case 'table':
          tables[item.target[1]] = [item];
          break;
      }
    }

    const listArray = Object.values(tables);

    const cardTitle = 'Schema Differences';

    const cardFooter = (
      <React.Fragment>
        <div className="btn-container text-center">
          <Button
            classes="btn-primary mr-1"
            handleClick={handleSelectAll}
            text="Select All"
          />
          <Button
            classes="btn-default"
            handleClick={handleSelectNone}
            text="Select None"
          />
        </div>
      </React.Fragment>
    );

    return (
      <Card title={cardTitle} footer={cardFooter}>
        {listArray.map((list, index) => {
          const listed = list.map(i => {
            return i.target.join('.');
          });

          const acceptedFiltered = accepted.filter(i => {
            return listed.indexOf(i) > -1;
          });

          return (
            <Delta
              key={index}
              table={list}
              handleAction={handleAction}
              accepted={acceptedFiltered}
            />
          );
        })}
      </Card>
    );
  }
}
