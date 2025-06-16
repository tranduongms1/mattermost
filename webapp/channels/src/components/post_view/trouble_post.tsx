import React, {useCallback, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import styled from 'styled-components';

import type {Post} from '@mattermost/types/posts';

import {receivedPost} from 'mattermost-redux/actions/posts';
import {Client4} from 'mattermost-redux/client';
import {getMyChannelMember} from 'mattermost-redux/selectors/entities/channels';

import TimerIcon from 'components/widgets/icons/timer_icon';
import CustomerInfo from 'components/customer_info';
import {CustomPostActions} from 'utils/constants';
import {selectPost, selectPostCard} from 'actions/views/rhs';

import type {GlobalState} from 'types/store';

const timeFormat = Intl.DateTimeFormat('vi', { dateStyle:'short', timeStyle: 'short'});

const Meta = styled.div`
    position: absolute;
    top: 15px;
    right: 12px;
    display: flex !important;
    align-items: center;
    width: fit-content !important;
`;

type Props = {
    post: Post;
    location?: string;
}

export default function TroublePost({post, location}: Props) {
    const dispatch = useDispatch();
    const channelMember = useSelector((state: GlobalState) => getMyChannelMember(state, post.channel_id));
    const [submitting, setSubmitting] = useState(false);

    const {title, priority, status, creator_name, ...customerInfo} = post.props as any;

    const handleClick = (e: any) => {
        e.preventDefault();
        dispatch(selectPostCard(post));
    }

    const updateStatus = useCallback((newStatus: string) => {
        if (submitting) return;
        setSubmitting(true);
        (Client4 as any).doFetch(
            Client4.urlVersion + '/tasks/' + post.id,
            {
                method: 'PATCH',
                body: JSON.stringify({status: newStatus}),
            }
        )
            .then((rp: any) => channelMember || dispatch(receivedPost(rp)))
            .finally(() => setSubmitting(false));
    }, [channelMember, submitting, post.id]);

    return (
        <div className="attachment" onClick={handleClick}>
            <Meta>
                {priority &&
                    <TimerIcon style={{width:'16px', height: '16px', color: '#ff0000', marginRight: '2px'}} />
                }
                <span className='post-preview__time'>{timeFormat.format(new Date(post.create_at))}</span>
            </Meta>
            <div className="attachment__content">
                <div className="clearfix attachment__container" style={{borderLeftColor: '#FF7A00'}}>
                    <span className="attachment__author-name">{creator_name}</span>
                    <h1 className="attachment__title">{title || post.message}</h1>
                    <div>
                        <div className="attachment__body attachment__body--no_thumb">
                            <div className="post-message post-message--collapsed">
                                <div className="post-message__text-container" style={{ maxHeight: 200 }}>
                                    <CustomerInfo {...customerInfo}/>
                                </div>
                            </div>
                            <div className="attachment-actions">
                                {CustomPostActions[status].map(action => (
                                    <button
                                        key={action.iconName}
                                        className="btn btn-sm"
                                        disabled={submitting || !action.newStatus || status === action.newStatus}
                                        style={{
                                            color: action.newStatus ? undefined : 'var(--button-bg)',
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateStatus(action.newStatus!);
                                        }}
                                    >
                                        <span className={`icon icon-${action.iconName}`}/>
                                        {action.text}
                                    </button>
                                ))}
                                {location !== 'CARD' &&
                                    <button
                                        className="btn btn-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(selectPost(post));
                                        }}
                                    >
                                        <span className='icon icon-reply-outline' />
                                        Thảo luận
                                    </button>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
