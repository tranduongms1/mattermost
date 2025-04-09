import React, {useState} from 'react';
import {useDispatch} from 'react-redux';
import styled from 'styled-components';

import {Post} from '@mattermost/types/posts';

import TimerIcon from 'components/widgets/icons/timer_icon';
import {ActionTypes, CustomPostActions} from 'utils/constants';
import {selectPost, selectPostCard} from 'actions/views/rhs';

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

export default function IssuePost({post}: Props) {
    const dispatch = useDispatch();
    const [submitting, setSubmitting] = useState(false);

    const {title, priority, status, creator_name} = post.props as any;

    const handleClick = (e: any) => {
        e.preventDefault();
        dispatch(selectPostCard(post));
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
                <div className="clearfix attachment__container" style={{borderLeftColor: '#FAC300'}}>
                    <span className="attachment__author-name">{creator_name}</span>
                    <h1 className="attachment__title">{title || post.message}</h1>
                    <div>
                        <div className="attachment__body attachment__body--no_thumb">
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
                                        dispatch(selectPost(post));
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
