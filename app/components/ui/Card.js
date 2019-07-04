import React, { Component } from 'react';

export default class Card extends Component {
  render() {
    const { title, body, footer, children } = this.props;

    const getTitle = _title =>
      !_title ? (
        ''
      ) : (
        <div className="card-title">
          <h3 className="display-2 text-center mt-4 mb-0">{_title}</h3>
        </div>
      );

    const getFooter = _footer =>
      !_footer ? '' : <div className="card-footer">{_footer}</div>;

    return (
      <div className="col-sm-12">
        <div className="card">
          {getTitle(title)}
          <div className="card-body">
            <div className="row">{body || children}</div>
          </div>
          {getFooter(footer)}
        </div>
      </div>
    );
  }
}
