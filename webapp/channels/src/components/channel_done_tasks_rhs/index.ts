import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import type {AnyAction, Dispatch} from 'redux';

import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';

import {getChannelStats} from 'actions/channels';
import {closeRightHandSide, showChannelCompletedIssues, showChannelCompletedTroubles, showChannelDoneIssues, showChannelDoneTroubles} from 'actions/views/rhs';
import {EMPTY_CHANNEL_STATS, getCurrentChannelStats} from 'selectors/channels';

import type {GlobalState} from 'types/store';

import RHS from './channel_done_tasks_rhs';

function mapStateToProps(state: GlobalState) {
    const channel = getCurrentChannel(state);
    const channelStats = getCurrentChannelStats(state) || EMPTY_CHANNEL_STATS;

    return {
        channel,
        channelStats,
    };
}

function mapDispatchToProps(dispatch: Dispatch<AnyAction>) {
    return {
        actions: bindActionCreators({
            closeRightHandSide,
            getChannelStats,
            showChannelDoneTroubles,
            showChannelCompletedTroubles,
            showChannelDoneIssues,
            showChannelCompletedIssues,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(RHS);
