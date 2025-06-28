import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import styled from 'styled-components';

import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';

import {getTasksForChannel} from 'actions/task_actions';
import {openModal} from 'actions/views/modals';
import CreateIssueModal from 'components/create_issue_modal';
import PostListRHS from 'components/post_list_rhs';
import Header from 'components/sidebar_right/header';
import {getPreviousRhsState, getStatuses} from 'selectors/rhs';
import {ModalIdentifiers, RHSStates} from 'utils/constants';

export const Button = styled.button.attrs({className: 'btn btn-primary'})`
    margin: 4px 16px;
`;

export default function ChannelIssuesRHS() {
    const dispatch = useDispatch();
    const channel = useSelector(getCurrentChannel);
    const statuses = useSelector(getStatuses);
    const prevRhsState = useSelector(getPreviousRhsState);

    useEffect(() => {
        if (!channel) return;
        dispatch(getTasksForChannel(channel.id, 'issue', statuses));
    }, [channel?.id, statuses]);

    let title;
    switch (statuses[0]) {
        case 'done':
            title = 'Sự cố chờ nghiệm thu';
            break;
        case 'completed':
            title = 'Sự cố đã nghiệm thu';
            break;
        default:
            title = 'Sự cố';
            break;
    }
    const hasPrevState = prevRhsState === RHSStates.CHANNEL_DONE_TASKS;

    const openCreateIssueModal = () => dispatch(openModal({
        modalId: ModalIdentifiers.CREATE_ISSUE,
        dialogType: CreateIssueModal,
    }));

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
            <PostListRHS
                channelId={channel?.id}
                type='custom_issue'
                statuses={statuses}
            />
            <Button onClick={openCreateIssueModal}>
                Báo sự cố
            </Button>
        </div>
    );
}
