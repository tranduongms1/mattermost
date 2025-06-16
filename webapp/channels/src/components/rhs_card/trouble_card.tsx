import React, {useCallback, useState} from 'react';
import {FormControl, FormGroup, ListGroup} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import styled from 'styled-components';

import {receivedPost} from 'mattermost-redux/actions/posts';
import {Client4} from 'mattermost-redux/client';
import {getChannel, getMyChannelMember} from 'mattermost-redux/selectors/entities/channels';
import {makeGetDisplayName} from 'mattermost-redux/selectors/entities/users';

import {selectPost} from 'actions/views/rhs';
import FileAttachmentList from 'components/file_attachment_list';
import CompletedUserIcon from 'components/widgets/icons/completed_user_icon';
import ConfirmedUserIcon from 'components/widgets/icons/confirmed_user_icon';
import CreatedUserIcon from 'components/widgets/icons/created_user_icon';
import DollarIcon from 'components/widgets/icons/dollar_icon';
import DoneUserIcon from 'components/widgets/icons/done_user_icon';
import GroupIcon from 'components/widgets/icons/group_icon';
import RestoredUserIcon from 'components/widgets/icons/restored_user_icon';
import TimerIcon from 'components/widgets/icons/timer_icon';
import {getSelectedPostCard} from 'selectors/rhs';
import {CustomPostActions} from 'utils/constants';

import type {GlobalState} from 'types/store';
import CustomerInfo from 'components/customer_info';

const Container = styled.div`
    padding: 0 16px 56px;
`;

const ListGroupItem = styled.li`
    display: flex;
    align-items: center;
    color: rgba(var(--center-channel-color-rgb), 0.8);
    background-color: rgba(var(--center-channel-color-rgb), 0.04);
    border-color: rgba(var(--center-channel-color-rgb), 0.08);

    &:not(:first-child) {
        border-top-color: transparent;
    }

    svg, .icon {
        margin-right: 8px;
    }

    .title {
        flex 1 1 auto;
    }
`;

export default function TroubleCard() {
    const dispatch = useDispatch();
    const post = useSelector(getSelectedPostCard);
    const channel = useSelector((state: GlobalState) => getChannel(state, post.channel_id));
    const channelMember = useSelector((state: GlobalState) => getMyChannelMember(state, post.channel_id));
    const [submitting, setSubmitting] = useState(false);

    const {
        title,
        description,
        creator_name,
        status,
        confirmed_at,
        confirmed_by,
        confirmed_by_name,
        done_at,
        done_by,
        done_by_name,
        completed_at,
        completed_by,
        completed_by_name,
        restored_at,
        restored_by,
        restored_by_name,
        priority,
        priority_at,
        priority_by,
        priority_by_name,
        ...customerInfo
    } = post.props as any;

    const getDisplayName = makeGetDisplayName();
    const confirmedUser = useSelector<GlobalState>(state => getDisplayName(state, confirmed_by, false));
    const doneUser = useSelector<GlobalState>(state => getDisplayName(state, done_by, false));
    const restoredUser = useSelector<GlobalState>(state => getDisplayName(state, restored_by, false));
    const completedUser = useSelector<GlobalState>(state => getDisplayName(state, completed_by, false));
    const priorityUser = useSelector<GlobalState>(state => getDisplayName(state, priority_by, false));

    const updateTask = useCallback((data: any) => {
        if (submitting) return;
        setSubmitting(true);
        (Client4 as any).doFetch(
            Client4.urlVersion + '/tasks/' + post.id,
            {
                method: 'PATCH',
                body: JSON.stringify(data),
            }
        )
            .then((rp: any) => channelMember || dispatch(receivedPost(rp)))
            .finally(() => setSubmitting(false));
    }, [channelMember, submitting, post.id]);

    if (!channel) return null;

    return (
        <React.Fragment>
            <Container>
                <FormGroup>
                    <CustomerInfo {...customerInfo}/>
                </FormGroup>
                <FormGroup>
                    <FormControl
                        disabled
                        value={title}
                    />
                </FormGroup>
                {description &&
                <FormGroup>
                    <FormControl
                        disabled
                        componentClass='textarea'
                        value={description}
                        rows={5}
                    />
                </FormGroup>
                }
                {Boolean(post.file_ids?.length) &&
                <div className="form-group">
                    <FileAttachmentList
                        post={post}
                    />
                </div>
                }
                <ListGroup>
                    <ListGroupItem className='list-group-item'>
                        <GroupIcon />
                        {channel.display_name}
                    </ListGroupItem>
                    <ListGroupItem className='list-group-item'>
                        <CreatedUserIcon />
                        <div className='title'>
                            {creator_name}
                        </div>
                        {new Date(post.create_at).toLocaleDateString()}
                    </ListGroupItem>
                    <ListGroupItem className='list-group-item'>
                        <ConfirmedUserIcon />
                        <div className='title'>
                            {confirmed_by ? (confirmedUser || confirmed_by_name) : 'Chưa có thông tin'}
                        </div>
                        {confirmed_at && new Date(confirmed_at).toLocaleDateString()}
                    </ListGroupItem>
                    <ListGroupItem className='list-group-item'>
                        <DoneUserIcon />
                        <div className='title'>
                            {done_by ? (doneUser || done_by_name) : 'Chưa có thông tin'}
                        </div>
                        {done_at && new Date(done_at).toLocaleDateString()}
                    </ListGroupItem>
                    {restored_by &&
                        <ListGroupItem className='list-group-item'>
                            <RestoredUserIcon />
                            <div className='title'>
                                {restoredUser || restored_by_name}
                            </div>
                            {new Date(restored_at).toLocaleDateString()}
                        </ListGroupItem>
                    }
                    <ListGroupItem className='list-group-item'>
                        <CompletedUserIcon />
                        <div className='title'>
                            {completed_by ? (completedUser || completed_by_name) : 'Chưa có thông tin'}
                        </div>
                        {completed_at && new Date(completed_at).toLocaleDateString()}
                    </ListGroupItem>
                    {priority &&
                        <ListGroupItem className='list-group-item'>
                            <TimerIcon />
                            <div className='title'>
                                {priority_by ? (priorityUser || priority_by_name) : 'Chưa có thông tin'}
                            </div>
                            {priority_at && new Date(priority_at).toLocaleDateString()}
                        </ListGroupItem>
                    }
                    <ListGroupItem className='list-group-item'>
                        <DollarIcon />
                        <div className='title'>Chưa có thông tin</div>
                    </ListGroupItem>
                </ListGroup>
            </Container>
            <div className='post-card--info'>
                {status != 'completed' &&
                    <button
                        className="btn btn-default"
                        onClick={() => updateTask({priority: !priority})}
                    >
                        <TimerIcon />
                    </button>
                }
                <button
                    className="btn btn-default"
                    onClick={(e) => {
                        e.stopPropagation();
                        dispatch(selectPost(post));
                    }}
                >
                    <span className='icon icon-reply-outline' />
                </button>
                <button
                    className="btn btn-default"
                >
                    <DollarIcon />
                </button>
                {CustomPostActions[status]?.map(action => (
                    <button
                        className="btn btn-default"
                        disabled={submitting || !action.newStatus || status === action.newStatus}
                        style={{
                            color: action.newStatus ? undefined : 'var(--button-bg)',
                        }}
                        onClick={() => updateTask({status: action.newStatus})}
                    >
                        <span className={`icon icon-${action.iconName}`}/>
                    </button>
                ))}
            </div>
        </React.Fragment>
    );
}
