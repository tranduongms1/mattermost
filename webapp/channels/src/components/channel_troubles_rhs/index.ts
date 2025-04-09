import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import type {AnyAction, Dispatch} from 'redux';

import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';

import {closeRightHandSide, goBack} from 'actions/views/rhs';
import {getPreviousRhsState} from 'selectors/rhs';
import {RHSStates} from 'utils/constants';

import type {GlobalState} from 'types/store';

import RHS from './channel_troubles_rhs';
import type {Props} from './channel_troubles_rhs';

function mapStateToProps(state: GlobalState) {
    const channel = getCurrentChannel(state);

    const prevRhsState = getPreviousRhsState(state);
    const hasPrevState = prevRhsState === RHSStates.CHANNEL_DONE_TASKS ||
        prevRhsState === RHSStates.CHANNEL_DONE_TROUBLES ||
        prevRhsState === RHSStates.CHANNEL_COMPLETED_TROUBLES;

    const canGoBack = Boolean(hasPrevState);

    return {
        channel,
        canGoBack,
    } as Props;
}

function mapDispatchToProps(dispatch: Dispatch<AnyAction>) {
    return {
        actions: bindActionCreators({
            closeRightHandSide,
            goBack,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(RHS);
