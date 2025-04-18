import React from 'react';
import {useSelector} from 'react-redux';

import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';

import Header from 'components/sidebar_right/header';

export default function ChannelPlansRHS() {
    const channel = useSelector(getCurrentChannel);

    return (
        <div
            id='rhsContainer'
            className='sidebar-right__body'
        >
            <Header
                title='Việc kế hoạch'
                subtitle={channel?.display_name}
            />
        </div>
    );
}
