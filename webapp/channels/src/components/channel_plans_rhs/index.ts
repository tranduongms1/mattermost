import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import type {AnyAction, Dispatch} from 'redux';

import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';

import {closeRightHandSide} from 'actions/views/rhs';
import {getIsMobileView} from 'selectors/views/browser';

import type {GlobalState} from 'types/store';

import RHS from './channel_plans_rhs';
import type {Props} from './channel_plans_rhs';

function mapStateToProps(state: GlobalState) {
    const channel = getCurrentChannel(state);
    const isMobile = getIsMobileView(state);

    return {
        channel,
        isMobile,
    } as Props;
}

function mapDispatchToProps(dispatch: Dispatch<AnyAction>) {
    return {
        actions: bindActionCreators({
            closeRightHandSide,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(RHS);
