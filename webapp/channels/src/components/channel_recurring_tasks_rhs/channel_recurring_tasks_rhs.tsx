import React from 'react';

import type {Channel} from '@mattermost/types/channels';

import Header from './header';

export interface Props {
    channel: Channel;
    isMobile: boolean;

    actions: {
        closeRightHandSide: () => void;
    };
}

export default function ChannelRecurringTasksRHS({
    channel,
    isMobile,
    actions,
}: Props) {
    return (
        <div
            id='rhsContainer'
            className='sidebar-right__body'
        >
            <Header
                channel={channel}
                isMobile={isMobile}
                onClose={actions.closeRightHandSide}
            />
        </div>
    );
}
