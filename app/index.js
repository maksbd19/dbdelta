import electron from 'electron';
import { setupFrontendListener } from 'eiphop';
import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
import './app.global.css';
import routes from './constants/routes';

setupFrontendListener(electron);

const ipc = electron.ipcRenderer;

ipc.on('goto-route', (sender, page) => {
  switch (page) {
    case 'add-new-connection':
      if (history.location.pathname !== routes.CONNECTIONS_CREATE) {
        history.push(routes.CONNECTIONS_CREATE);
      }
      break;
    case 'view-all-connections':
      if (history.location.pathname !== routes.CONNECTIONS_LIST) {
        history.push(routes.CONNECTIONS_LIST);
      }
      break;
    case 'view-delta':
      if (history.location.pathname !== routes.HOME) {
        history.push(routes.HOME);
      }
      break;
    default:
      break;
  }
});

const store = configureStore();

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    // eslint-disable-next-line global-require
    const NextRoot = require('./containers/Root').default;
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
