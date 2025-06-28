import React, {useCallback, useMemo, useState} from 'react';
import {FormControl, FormGroup, ListGroup, ProgressBar} from 'react-bootstrap';
import {FormattedDate} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import ReactSelect, {components} from 'react-select';
import styled from 'styled-components';

import {Client4} from 'mattermost-redux/client';
import {getChannel, getMyChannelMember} from 'mattermost-redux/selectors/entities/channels';
import {getTeammateNameDisplaySetting} from 'mattermost-redux/selectors/entities/preferences';
import {getCurrentUserId, getProfiles, makeGetDisplayName} from 'mattermost-redux/selectors/entities/users';
import {displayUsername} from 'mattermost-redux/utils/user_utils';

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

const Prefix = styled.span`
    margin-left: 8px;
    color: rgba(var(--center-channel-color-rgb), 0.75);
`;

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

export default function TaskCard() {
    const dispatch = useDispatch();
    const post = useSelector(getSelectedPostCard);
    const channel = useSelector((state: GlobalState) => getChannel(state, post.channel_id));
    const channelMember = useSelector((state: GlobalState) => getMyChannelMember(state, post.channel_id));
    const currentUserId = useSelector(getCurrentUserId);
    const users = useSelector(getProfiles);
    const userMap = users.reduce<any>((p, u) => ({...p, [u.id]: u}), {});
    const teammateNameDisplaySetting = useSelector(getTeammateNameDisplaySetting);
    const [submitting, setSubmitting] = useState(false);

    const {
        title,
        start_date,
        end_date,
        assignee_ids,
        manager_ids,
        channel_name,
        creator_id,
        creator_name,
        checklists,
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
    } = post.props as any;

    const isCreator = creator_id === currentUserId;
    const getDisplayName = makeGetDisplayName();
    const assigneeValue = useMemo(
        () => (assignee_ids || []).map((id: string) => userMap[id]).filter(Boolean),
        [userMap, assignee_ids]
    );
    const managerValue = useMemo(
        () => (manager_ids || []).map((id: string) => userMap[id]).filter(Boolean),
        [userMap, manager_ids]
    );
    const confirmedUser = useSelector<GlobalState>(state => getDisplayName(state, confirmed_by, false));
    const doneUser = useSelector<GlobalState>(state => getDisplayName(state, done_by, false));
    const restoredUser = useSelector<GlobalState>(state => getDisplayName(state, restored_by, false));
    const completedUser = useSelector<GlobalState>(state => getDisplayName(state, completed_by, false));
    const priorityUser = useSelector<GlobalState>(state => getDisplayName(state, priority_by, false));

    const doneFilter = (i: any) => ['closed', 'skipped'].includes(i.state);
    const items: any[] = checklists.reduce((p: any[], c: any) => p.concat(c.items || []), []);
    const progress = items.length ? items.filter(doneFilter).length / items.length : 1;

    const getDisplayUsername = useCallback((user) => {
        return displayUsername(user, teammateNameDisplaySetting);
    }, [teammateNameDisplaySetting]);

    const updateTask = useCallback((data: any) => {
        if (submitting) return;
        if (!channelMember) {
            window.alert('Không thể thao tác khi bạn không còn là thành viên của nhóm');
            return;
        }
        if (data.status === 'done' && progress < 1) {
            window.alert('Không thể báo xong do chưa hoàn thành hết việc');
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
    }, [channelMember, submitting, post]);

    const updateChecklistItem = useCallback((idx: number, itemIdx: number, data: any) => {
        if (submitting) return;
        if (!channelMember) {
            window.alert('Không thể thao tác khi bạn không còn là thành viên của nhóm');
            return;
        }
        setSubmitting(true);
        (Client4 as any).doFetch(
            Client4.urlVersion + '/tasks/' + post.id + '/checklists/' + idx + '/items/' + itemIdx,
            {
                method: 'PATCH',
                body: JSON.stringify(data),
            }
        ).finally(() => setSubmitting(false));
    }, [channelMember, submitting, post.id]);

    const withPrefix = (text: string) => {
        return ({children, ...props}: any) => (
            <components.Control {...props}>
                <Prefix>{text}</Prefix>
                {children}
            </components.Control>
        );
    }

    return (
        <React.Fragment>
            <Container>
                <FormGroup>
                    <FormControl
                        disabled
                        value={title}
                    />
                </FormGroup>
                <div className='row mb-4'>
                    <div className='col-sm-6'>
                        <ReactSelect
                            className='react-select'
                            classNamePrefix='react-select'
                            isClearable={false}
                            isDisabled={true}
                            isMulti={true}
                            options={users}
                            getOptionLabel={getDisplayUsername}
                            getOptionValue={(user) => user.id}
                            placeholder='Người thực hiện'
                            components={{
                                Control: withPrefix('To:'),
                                DropdownIndicator: null,
                                IndicatorSeparator: null,
                                Input: () => null,
                            }}
                            value={assigneeValue}
                        />
                    </div>
                    <div className='col-sm-6'>
                        <ReactSelect
                            className='react-select'
                            classNamePrefix='react-select'
                            isClearable={false}
                            isDisabled={true}
                            isMulti={true}
                            options={users}
                            getOptionLabel={getDisplayUsername}
                            getOptionValue={(user) => user.id}
                            placeholder='Người quản lý'
                            components={{
                                Control: withPrefix('CC:'),
                                DropdownIndicator: null,
                                IndicatorSeparator: null,
                                Input: () => null,
                            }}
                            value={managerValue}
                        />
                    </div>
                </div>
                <div className={'row' + (items.length ? '' : ' mb-4')}>
                    <div className='col-sm-6'>
                        <span>Bắt đầu: </span>
                        <FormattedDate
                            format='DD/MM/YY'
                            value={start_date}
                        />
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
                {(checklists || []).map((checklist: any, idx: number) => (
                <ListGroup key={idx}>
                    <ListGroupItem className='list-group-item'>
                        {checklist.title}
                    </ListGroupItem>
                    {Boolean(checklist.end_date) &&
                    <ListGroupItem className='list-group-item'>
                        <div className='col-sm-6 px-0'>
                            <span>Bắt đầu: </span>
                            <FormattedDate
                                format='DD/MM/YY'
                                value={checklist.start_date || start_date}
                            />
                        </div>
                        <div className='col-sm-6 px-0 text-right'>
                            <span>Kết thúc: </span>
                            <FormattedDate
                                format='DD/MM/YY'
                                value={checklist.end_date}
                            />
                        </div>
                    </ListGroupItem>
                    }
                    {(checklist.items || []).map((item: any, itemIdx: number) => {
                        const closed = item.state === 'closed';
                        const skip = item.state === 'skip';
                        const skipped = item.state === 'skipped';
                        const style = skip || skipped ? {textDecoration: 'line-through'} : undefined;
                        return (
                            <ListGroupItem
                                key={itemIdx}
                                className='list-group-item'
                                onClick={(closed || skip || skipped) ? undefined : () => updateChecklistItem(idx, itemIdx, {state: 'closed'})}
                            >
                                <i className={`icon icon-${closed ? 'checkbox-marked' : 'checkbox-blank-outline'}`}/>
                                <div className='flex-1' style={style}>{item.title}</div>
                                {!closed && !skipped && (
                                    <i 
                                        className={`icon icon-${skip && isCreator ? 'check' : 'close'} mr-0`}
                                        style={{cursor: 'pointer'}}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (skip && isCreator) {
                                                updateChecklistItem(idx, itemIdx, {state: 'skipped'});
                                                return;
                                            }
                                            updateChecklistItem(idx, itemIdx, {state: skip ? '' : 'skip'});
                                        }}
                                    />
                                )}
                            </ListGroupItem>
                        );
                    })}
                </ListGroup>
                ))}
                <ListGroup>
                    <ListGroupItem className='list-group-item'>
                        <GroupIcon />
                        {channel?.display_name || channel_name}
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
                        className="btn"
                        onClick={() => updateTask({priority: !priority})}
                    >
                        <TimerIcon />
                    </button>
                }
                {Boolean(channelMember) &&
                <button
                    className="btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        dispatch(selectPost(post));
                    }}
                >
                    <span className='icon icon-reply-outline' />
                </button>
                }
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
