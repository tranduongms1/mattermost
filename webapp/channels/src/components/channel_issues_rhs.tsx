import React from 'react';
import {useSelector} from 'react-redux';

import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';

import Header from 'components/sidebar_right/header';
import {getPreviousRhsState, getRhsState} from 'selectors/rhs';
import {RHSStates} from 'utils/constants';

export default function ChannelIssuesRHS() {
    const channel = useSelector(getCurrentChannel);
    const rhsState = useSelector(getRhsState);
    const prevRhsState = useSelector(getPreviousRhsState);

    let title;
    switch (rhsState) {
        case RHSStates.CHANNEL_DONE_ISSUES:
            title = 'Sự cố chờ nghiệm thu';
            break;
        case RHSStates.CHANNEL_COMPLETED_ISSUES:
            title = 'Sự cố đã nghiệm thu';
            break;
        default:
            title = 'Sự cố';
            break;
    }
    const hasPrevState = prevRhsState === RHSStates.CHANNEL_DONE_TASKS ||
        prevRhsState === RHSStates.CHANNEL_DONE_ISSUES ||
        prevRhsState === RHSStates.CHANNEL_COMPLETED_ISSUES;

    return (
        <div
            id='rhsContainer'
            className='sidebar-right__body'
        >
            <Header
                title={title}
                subtitle={channel?.display_name}
                canGoBack={hasPrevState}
            />
        </div>
    );
}
