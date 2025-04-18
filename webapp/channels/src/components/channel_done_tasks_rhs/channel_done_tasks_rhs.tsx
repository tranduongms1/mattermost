import React from 'react';

import type {Channel} from '@mattermost/types/channels';
import type {ActionResult} from 'mattermost-redux/types/actions';

import Header from 'components/sidebar_right/header';

import type {ChannelStats} from 'types/store/channels';

import Menu from './menu';

export interface Props {
    channel?: Channel;
    channelStats: ChannelStats;

    actions: {
        closeRightHandSide: () => void;
        getChannelStats: (channelId: string) => Promise<ActionResult<ChannelStats>>;
        showChannelDoneTroubles: (channelId: string) => void;
        showChannelCompletedTroubles: (channelId: string) => void;
        showChannelDoneIssues: (channelId: string) => void;
        showChannelCompletedIssues: (channelId: string) => void;
    };
}

export default function ChannelDoneTasksRHS({
    channel,
    channelStats,
    actions,
}: Props) {
    return (
        <div
            id='rhsContainer'
            className='sidebar-right__body'
        >
            <Header
                title='Việc đã xong'
                subtitle={channel?.display_name}
            />
            <Menu
                channel={channel!}
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
