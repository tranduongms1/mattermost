import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FormControl, FormGroup, ListGroup, ProgressBar} from 'react-bootstrap';
import {FormattedDate} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import styled from 'styled-components';

import type {Post} from '@mattermost/types/posts';

import {getPostsByIds} from 'mattermost-redux/actions/posts';
import {Client4} from 'mattermost-redux/client';
import {getChannel} from 'mattermost-redux/selectors/entities/channels';
import {makeGetPostsForIds} from 'mattermost-redux/selectors/entities/posts';
import {getCurrentUserId, makeGetDisplayName} from 'mattermost-redux/selectors/entities/users';

import {selectPost} from 'actions/views/rhs';
import FileAttachmentList from 'components/file_attachment_list';
import IssuePost from 'components/post_view/issue_post';
import TroublePost from 'components/post_view/trouble_post';
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

export default function PlanCard() {
    const dispatch = useDispatch();
    const post = useSelector(getSelectedPostCard);
    const channel = useSelector((state: GlobalState) => getChannel(state, post.channel_id));
    const currentUserId = useSelector(getCurrentUserId);
    const [submitting, setSubmitting] = useState(false);

    const {
        title,
        start_date,
        end_date,
        creator_id,
        creator_name,
        troubles: trouble_ids,
        issues: issue_ids,
        checklists,
        status,
        confirmed_by,
        confirmed_at,
        done_by,
        done_at,
        completed_by,
        completed_at,
        restored_by,
        restored_at,
        priority,
        priority_by,
        priority_at,
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

    const isCreator = creator_id === currentUserId;
    const getDisplayName = makeGetDisplayName();
    const confirmedUser = useSelector<GlobalState>(state => getDisplayName(state, confirmed_by, false));
    const doneUser = useSelector<GlobalState>(state => getDisplayName(state, done_by, false));
    const restoredUser = useSelector<GlobalState>(state => getDisplayName(state, restored_by, false));
    const completedUser = useSelector<GlobalState>(state => getDisplayName(state, completed_by, false));
    const priorityUser = useSelector<GlobalState>(state => getDisplayName(state, priority_by, false));

    const doneFilter = (i: any) => i && (['closed', 'skipped'].includes(i.state) || ['done', 'completed'].includes(i.props?.status));
    const items: any[] = troubles.concat(issues).concat(checklists || []);
    const progress = items.length ? items.filter(doneFilter).length / items.length : 1;

    const updateTask = useCallback((data: any) => {
        if (submitting) return;
        if (data.status === 'done' && progress < 1) {
            window.alert('Không thể báo xong do chưa hoàn thành hết việc');
            return;
        }
        if (data.status === 'completed' && troubles.concat(issues).some(p => p && p.props?.status !== 'completed')) {
            window.alert('Không thể nghiệm thu do chưa nghiệm thu hết trouble và sự cố');
            return;
        }
        setSubmitting(true);
        (Client4 as any).doFetch(
            Client4.urlVersion + '/tasks/' + post.id,
            {
                method: 'PATCH',
                body: JSON.stringify(data),
            }
        ).finally(() => setSubmitting(false));
    }, [submitting, post.id, troubles, issues, progress]);

    const updateChecklistItem = useCallback((itemIdx: number, data: any) => {
        if (submitting) return;
        setSubmitting(true);
        (Client4 as any).doFetch(
            Client4.urlVersion + '/plans/' + post.id + '/checklists/' + itemIdx,
            {
                method: 'PATCH',
                body: JSON.stringify(data),
            }
        ).finally(() => setSubmitting(false));
    }, [submitting, post.id]);

    if (!channel) return null;

    return (
        <React.Fragment>
            <Container>
                <FormGroup>
                    <FormControl
                        disabled
                        value={title}
                    />
                </FormGroup>
                <div className='row'>
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
                    className={'mb-4' + (Date.now() > end_date ? ' progress-bar-danger' : '')}
                    style={{height: '12px'}}
                    max={1}
                    now={progress}
                />
                }
                {Boolean(post.file_ids?.length) &&
                <div className="form-group">
                    <FileAttachmentList
                        post={post}
                    />
                </div>
                }
                {troubles.map((post: Post) => {
                    if (!post) return null;
                    return (
                        <div key={post.id} className="post px-0">
                            <div className="post__content px-0">
                                <div className="post__main flex-1">
                                    <div className="post__body">
                                        <TroublePost
                                            post={post}
                                            location='CARD'
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {issues.map((post: Post) => {
                    if (!post) return null;
                    return (
                        <div key={post.id} className="post px-0">
                            <div className="post__content px-0">
                                <div className="post__main flex-1">
                                    <div className="post__body">
                                        <IssuePost
                                            post={post}
                                            location='CARD'
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {Boolean(checklists && checklists.length) &&
                <ListGroup>
                    <ListGroupItem className='list-group-item'>Công việc khác</ListGroupItem>
                    {checklists.map((item: any, itemIdx: number) => {
                        const closed = item.state === 'closed';
                        const skip = item.state === 'skip';
                        const skipped = item.state === 'skipped';
                        return (
                            <ListGroupItem
                                key={itemIdx}
                                className='list-group-item'
                                onClick={(closed || skip || skipped) ? undefined : () => updateChecklistItem(itemIdx, {state: 'closed'})}
                            >
                                <i className={`icon icon-${closed ? 'checkbox-marked' : 'checkbox-blank-outline'}`}/>
                                <div className='flex-1'>{item.title}</div>
                                {!closed && !skipped && (
                                    <i 
                                        className={`icon icon-${skip && isCreator ? 'check' : 'close'} mr-0`}
                                        style={{cursor: 'pointer'}}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (skip && isCreator) {
                                                return;
                                            }
                                            updateChecklistItem(itemIdx, {state: skip ? '' : 'skip'});
                                        }}
                                    />
                                )}
                            </ListGroupItem>
                        );
                    })}
                </ListGroup>
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
                            {confirmed_by ? confirmedUser : 'Chưa có thông tin'}
                        </div>
                        {confirmed_at && new Date(confirmed_at).toLocaleDateString()}
                    </ListGroupItem>
                    <ListGroupItem className='list-group-item'>
                        <DoneUserIcon />
                        <div className='title'>
                            {done_by ? doneUser : 'Chưa có thông tin'}
                        </div>
                        {done_at && new Date(done_at).toLocaleDateString()}
                    </ListGroupItem>
                    {restored_by &&
                        <ListGroupItem className='list-group-item'>
                            <RestoredUserIcon />
                            <div className='title'>
                                {restoredUser}
                            </div>
                            {new Date(restored_at).toLocaleDateString()}
                        </ListGroupItem>
                    }
                    <ListGroupItem className='list-group-item'>
                        <CompletedUserIcon />
                        <div className='title'>
                            {completed_by ? completedUser : 'Chưa có thông tin'}
                        </div>
                        {completed_at && new Date(completed_at).toLocaleDateString()}
                    </ListGroupItem>
                    {priority &&
                        <ListGroupItem className='list-group-item'>
                            <TimerIcon />
                            <div className='title'>
                                {priority_by ? priorityUser : 'Chưa có thông tin'}
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
                        className="btn"
                        onClick={() => updateTask({priority: !priority})}
                    >
                        <TimerIcon />
                    </button>
                }
                <button
                    className="btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        dispatch(selectPost(post));
                    }}
                >
                    <span className='icon icon-reply-outline' />
                </button>
                <button
                    className="btn"
                >
                    <DollarIcon />
                </button>
                {CustomPostActions[status]?.map(action => (
                    <button
                        className="btn"
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
