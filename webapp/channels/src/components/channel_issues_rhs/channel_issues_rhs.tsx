import React from 'react';

import type {Channel} from '@mattermost/types/channels';

import Header from './header';

export interface Props {
    channel: Channel;
    canGoBack: boolean;

    actions: {
        closeRightHandSide: () => void;
        goBack: () => void;
    };
}

export default function ChannelIssuesRHS({
    channel,
    canGoBack,
    actions,
}: Props) {
    return (
        <div
            id='rhsContainer'
            className='sidebar-right__body'
        >
            <Header
                channel={channel}
                canGoBack={canGoBack}
                onClose={actions.closeRightHandSide}
                goBack={actions.goBack}
            />
        </div>
    );
}
