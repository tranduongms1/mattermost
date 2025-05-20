import React, {useCallback, useState} from 'react';
import {useDispatch} from 'react-redux';
import styled from 'styled-components';

import {Client4} from 'mattermost-redux/client';
import {Post} from '@mattermost/types/posts';

import TimerIcon from 'components/widgets/icons/timer_icon';
import {CustomPostActions} from 'utils/constants';
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

export default function TaskPost({post}: Props) {
    const dispatch = useDispatch();
    const [submitting, setSubmitting] = useState(false);

    const {title, checklists, priority, status, creator_name} = post.props as any;

    const handleClick = (e: any) => {
        e.preventDefault();
        dispatch(selectPostCard(post));
    }

    const updateStatus = useCallback((newStatus: string) => {
        if (submitting) return;
        if (newStatus === 'done') {
            const checkNotDone = (item: any) => !['closed', 'skipped'].includes(item.state);
            const isNotDone = (c: any) => c.items && c.items.some(checkNotDone);
            if (checklists.some(isNotDone)) {
                window.alert('Không thể báo xong do chưa hoàn thành hết việc');
                return;
            }
        }
        setSubmitting(true);
        (Client4 as any).doFetch(
            Client4.urlVersion + '/tasks/' + post.id,
            {
                method: 'PATCH',
                body: JSON.stringify({status: newStatus}),
            }
        ).finally(() => setSubmitting(false));
    }, [submitting, post]);

    return (
        <div className="attachment" onClick={handleClick}>
            <Meta>
                {priority &&
                    <TimerIcon style={{width:'16px', height: '16px', color: '#ff0000', marginRight: '2px'}} />
                }
                <span className='post-preview__time'>{timeFormat.format(new Date(post.create_at))}</span>
            </Meta>
            <div className="attachment__content">
                <div className="clearfix attachment__container" style={{borderLeftColor: 'var(--center-channel-color-16)'}}>
                    <span className="attachment__author-name">{creator_name}</span>
                    <h1 className="attachment__title">{title || post.message}</h1>
                    <div>
                        <div className="attachment__body attachment__body--no_thumb">
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
