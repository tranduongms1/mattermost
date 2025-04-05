import React from 'react';

import type {Channel} from '@mattermost/types/channels';

import type {ChannelStats} from 'types/store/channels';

import Header from './header';
import Menu from './menu';

export interface Props {
    channel: Channel;
    channelStats: ChannelStats;
    isMobile: boolean;

    actions: {
        closeRightHandSide: () => void;
        getChannelStats: (channelId: string) => Promise<{data: any}>;
        showChannelDoneTroubles: (channelId: string) => void;
        showChannelCompletedTroubles: (channelId: string) => void;
        showChannelDoneIssues: (channelId: string) => void;
        showChannelCompletedIssues: (channelId: string) => void;
    };
}

export default function ChannelDoneTasksRHS({
    channel,
    channelStats,
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
            <Menu
                channel={channel}
                channelStats={channelStats}
                actions={{
                    getChannelStats: actions.getChannelStats,
                    showChannelDoneTroubles: actions.showChannelDoneTroubles,
                    showChannelCompletedTroubles: actions.showChannelCompletedTroubles,
                    showChannelDoneIssues: actions.showChannelDoneIssues,
                    showChannelCompletedIssues: actions.showChannelCompletedIssues,
                }}
            />
        </div>
    );
}
