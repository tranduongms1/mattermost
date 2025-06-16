import React, {useCallback, useState} from 'react';
import {ProgressBar} from 'react-bootstrap';
import {FormattedDate} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import styled from 'styled-components';

import type {Post} from '@mattermost/types/posts';
import {Client4} from 'mattermost-redux/client';
import {getMyChannelMember} from 'mattermost-redux/selectors/entities/channels';

import TimerIcon from 'components/widgets/icons/timer_icon';
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
    post: Post
}

export default function TaskPost({post}: Props) {
    const dispatch = useDispatch();
    const channelMember = useSelector((state: GlobalState) => getMyChannelMember(state, post.channel_id));
    const [submitting, setSubmitting] = useState(false);

    const {title, start_date, end_date, checklists, priority, status, creator_name} = post.props as any;

    const doneFilter = (i: any) => ['closed', 'skipped'].includes(i.state);
    const items: any[] = checklists.reduce((p: any[], c: any) => p.concat(c.items || []), []);
    const progress = items.length ? items.filter(doneFilter).length / items.length : 1;

    const handleClick = (e: any) => {
        e.preventDefault();
        dispatch(selectPostCard(post));
    }

    const updateStatus = useCallback((newStatus: string) => {
        if (submitting) return;
        if (newStatus === 'done' && progress < 1) {
            window.alert('Không thể báo xong do chưa hoàn thành hết việc');
            return;
        }
        setSubmitting(true);
        (Client4 as any).doFetch(
            Client4.urlVersion + '/tasks/' + post.id,
            {
                method: 'PATCH',
                body: JSON.stringify({status: newStatus}),
            }
        ).finally(() => setSubmitting(false));
    }, [submitting, post.id, progress]);

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
                    <div className="row post-preview__time">
                        <div className='col-sm-6'>
                            <span>Bắt đầu: </span>
                            {Boolean(start_date) &&
                            <FormattedDate
                                format='DD/MM/YY'
                                value={start_date}
                            />
                            }
                        </div>
                        {Boolean(end_date) &&
                        <div className='col-sm-6 text-right'>
                            <span>Kết thúc: </span>
                            <FormattedDate
                                format='DD/MM/YY'
                                value={end_date}
                            />
                        </div>
                        }
                    </div>
                    {Boolean(items.length) &&
                    <ProgressBar
                        className={'mb-1' + (Date.now() > end_date ? ' progress-bar-danger' : '')}
                        style={{height: '12px'}}
                        max={1}
                        now={progress}
                    />
                    }
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
                                {Boolean(channelMember) &&
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
