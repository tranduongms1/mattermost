import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import type {AnyAction, Dispatch} from 'redux';

import {getChannelStats} from 'mattermost-redux/actions/channels';
import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';

import {closeRightHandSide, showChannelCompletedIssues, showChannelCompletedTroubles, showChannelDoneIssues, showChannelDoneTroubles} from 'actions/views/rhs';
import {EMPTY_CHANNEL_STATS, getCurrentChannelStats} from 'selectors/channels';
import {getIsMobileView} from 'selectors/views/browser';

import type {GlobalState} from 'types/store';

import RHS from './channel_done_tasks_rhs';
import type {Props} from './channel_done_tasks_rhs';

function mapStateToProps(state: GlobalState) {
    const channel = getCurrentChannel(state);
    const channelStats = getCurrentChannelStats(state) || EMPTY_CHANNEL_STATS;
    const isMobile = getIsMobileView(state);

    return {
        channel,
        channelStats,
        isMobile,
    } as Props;
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
