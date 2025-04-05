import React, {useState} from 'react';
import {useDispatch} from 'react-redux';
import styled from 'styled-components';

import {Post} from '@mattermost/types/posts';

import TimerIcon from 'components/widgets/icons/timer_icon';
import CustomerInfo from 'components/customer_info';
import {ActionTypes, CustomPostActions} from 'utils/constants';

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
    post: Post
}

export default function TroublePost({post}: Props) {
    const dispatch = useDispatch();
    const [submitting, setSubmitting] = useState(false);

    const {title, priority, status, creator_name, ...customerInfo} = post.props as any;

    const handleClick = (e: any) => {
        e.preventDefault();
        dispatch({
            type: ActionTypes.SELECT_POST_CARD,
            postId: post.id,
            channelId: post.channel_id
        });
    }

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
                                        key={action.newStatus}
                                        className="btn btn-sm"
                                        disabled={submitting}
                                        style={{
                                            color: action.newStatus ? undefined : 'var(--button-bg)',
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // updateStatus(action.newStatus);
                                        }}
                                    >
                                        <span className={`icon icon-${action.iconName}`}/>
                                        {action.text}
                                    </button>
                                ))}
                                <button
                                    className="btn btn-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch({
                                            type: 'SELECT_POST',
                                            postId: post.root_id || post.id,
                                            channelId: post.channel_id,
                                            timestamp: Date.now(),
                                        });
                                    }}
                                >
                                    <span className='icon icon-reply-outline' />
                                    Thảo luận
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
