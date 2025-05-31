import React from 'react';
import {useSelector} from 'react-redux';

import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';

import PostListRHS from 'components/post_list_rhs';
import Header from 'components/sidebar_right/header';

export default function ChannelRecurringTasksRHS() {
    const channel = useSelector(getCurrentChannel);

    return (
        <div
            id='rhsContainer'
            className='sidebar-right__body'
        >
            <Header
                title='Việc định kỳ'
                subtitle={channel?.display_name}
            />
            <PostListRHS
                channelId={channel?.id}
                type='custom_recurring_task'
                statuses={[]}
            />
        </div>
    );
}
