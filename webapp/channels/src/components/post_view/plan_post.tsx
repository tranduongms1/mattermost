import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ProgressBar} from 'react-bootstrap';
import {FormattedDate} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import styled from 'styled-components';

import type {Post} from '@mattermost/types/posts';
import {getPostsByIds} from 'mattermost-redux/actions/posts';
import {Client4} from 'mattermost-redux/client';
import {makeGetPostsForIds} from 'mattermost-redux/selectors/entities/posts';

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

export default function PlanPost({post}: Props) {
    const dispatch = useDispatch();
    const [submitting, setSubmitting] = useState(false);

    const {
        title,
        start_date,
        end_date,
        troubles: trouble_ids,
        issues: issue_ids,
        checklists,
        priority,
        status,
        creator_name,
    } = post.props as any;
    const troubleIds = useMemo(
        () => (trouble_ids || []).filter(Boolean) as string[],
        [trouble_ids],
    );
    const issueIds = useMemo(
        () => (issue_ids || []).filter(Boolean) as string[],
        [issue_ids],
    );

    useEffect(() => {
        if (troubleIds.length + issueIds.length) {
            dispatch(getPostsByIds([...troubleIds, ...issueIds]));
        }
    }, [troubleIds, issueIds]);

    const getPostForIds = makeGetPostsForIds();
    const troubles = useSelector((state: GlobalState) => getPostForIds(state, troubleIds));
    const issues = useSelector((state: GlobalState) => getPostForIds(state, issueIds));

    const doneFilter = (i: any) => i && (['closed', 'skipped'].includes(i.state) || ['done', 'completed'].includes(i.props?.status));
    const items: any[] = troubles.concat(issues).concat(checklists || []);
    const progress = items.length ? items.filter(doneFilter).length / items.length : 1;

    const handleClick = (e: any) => {
        e.preventDefault();
        dispatch(selectPostCard(post));
    }

    const updateStatus = useCallback((newStatus: string) => {
        if (submitting) return;
        if (newStatus === 'done' && progress !== 1) {
            window.alert('Không thể báo xong do chưa hoàn thành hết việc');
            return;
        }
        if (newStatus === 'completed' && troubles.concat(issues).some(p => p && p.props?.status !== 'completed')) {
            window.alert('Không thể nghiệm thu do chưa nghiệm thu hết trouble và sự cố');
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
    }, [submitting, post.id, troubles, issues, progress]);

    return (
        <div className="attachment" onClick={handleClick}>
            <Meta>
                {priority &&
                    <TimerIcon style={{width:'16px', height: '16px', color: '#ff0000', marginRight: '2px'}} />
                }
                <span className='post-preview__time'>{timeFormat.format(new Date(post.create_at))}</span>
            </Meta>
            <div className="attachment__content">
                <div className="clearfix attachment__container" style={{borderLeftColor: '#039990'}}>
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
