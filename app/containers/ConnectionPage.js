import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Connection from '../components/Connection';
import * as ConnectionActions from '../actions/connection';

function mapStateToProps(state) {
  return {
    connection: state.connection
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(ConnectionActions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Connection);
