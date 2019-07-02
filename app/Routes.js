import React from 'react';
import { Switch, Route } from 'react-router';
import routes from './constants/routes';
import App from './containers/App';
import HomePage from './containers/HomePage';
import ConnectionPage from './containers/ConnectionPage';

export default () => (
  <App>
    <Switch>
      <Route exact path={routes.CONNECTIONS_EDIT} component={ConnectionPage} />
      <Route
        exact
        path={routes.CONNECTIONS_CREATE}
        component={ConnectionPage}
      />
      <Route exact path={routes.CONNECTIONS_LIST} component={ConnectionPage} />
      <Route path={routes.HOME} component={HomePage} />
    </Switch>
  </App>
);
