import React, {useEffect, useMemo, useRef, useState} from 'react';
import Scrollbars from 'react-custom-scrollbars';
import {useSelector} from 'react-redux';
import styled from 'styled-components';

import {getCurrentUserId} from 'mattermost-redux/selectors/entities/common';

import Post from 'components/post';
import IssuePost from 'components/post_view/issue_post';
import PlanPost from 'components/post_view/plan_post';
import TaskPost from 'components/post_view/task_post';
import TroublePost from 'components/post_view/trouble_post';

import type {GlobalState} from 'types/store';

const GET_MORE_BUFFER = 30;

const Select = styled.select`
    margin: 16px 5px 10px;
    padding: 4px 0;
    border-color: rgba(63, 67, 80, 0.16);

    & ~ div .search-items-container {
        padding-top: 0;
    }
`;

const renderView = (props: Record<string, unknown>): JSX.Element => (
    <div
        {...props}
        className='scrollbar--view'
    />
);

const renderThumbHorizontal = (props: Record<string, unknown>): JSX.Element => (
    <div
        {...props}
        className='scrollbar--horizontal scrollbar--thumb--RHS'
    />
);

const renderThumbVertical = (props: Record<string, unknown>): JSX.Element => (
    <div
        {...props}
        className='scrollbar--vertical scrollbar--thumb--RHS'
    />
);

const renderTrackVertical = (props: Record<string, unknown>): JSX.Element => (
    <div
        {...props}
        className='scrollbar--vertical--RHS'
    />
);

type Props = {
    channelId?: string;
    type: string;
    statuses: string[];
    fromMe?: boolean;
    toMe?: boolean;
    isManager?: boolean;
}

export default function PostListRHS({
    channelId,
    type,
    statuses,
    fromMe,
    toMe,
    isManager,
}: Props) {
    const scrollbars = useRef<Scrollbars | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showLoadMore, setShowLoadMore] = useState(false);

    const currentUserId = useSelector(getCurrentUserId);
    const posts = useSelector((state: GlobalState) => Object.values(state.entities.posts.posts).filter(p => {
        if (channelId && p.channel_id !== channelId) return false;
        if (p.type !== type) return false;
        if (fromMe && p.props.creator_id !== currentUserId) return false;
        if (toMe && !(p.props as any).assignee_ids?.includes(currentUserId)) return false;
        if (isManager && !(p.props as any).manager_ids?.includes(currentUserId)) return false;
        return statuses.includes(p.props.status as string);
    }));

    const sortedPosts = useMemo(() => {
        if (statuses.includes('completed')) {
            return posts.slice().sort((a, b) => b.update_at - a.update_at);
        }
        return posts.slice().sort((a: any, b: any) => {
            if (a.props.priority !== b.props.priority) {
                const ap = a.props.priority || false;
                const bp = b.props.priority || false;
                return bp - ap;
            }
            return b.update_at - a.update_at;
        });
    }, [statuses, posts]);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const handleScroll = (): void => {
        const scrollHeight = scrollbars.current?.getScrollHeight() || 0;
        const scrollTop = scrollbars.current?.getScrollTop() || 0;
        const clientHeight = scrollbars.current?.getClientHeight() || 0;
        if ((scrollTop + clientHeight + GET_MORE_BUFFER) >= scrollHeight) {
            setShowLoadMore(false);
        }
    }

    const myChannels = (window as any).store.getState().entities.channels.channels;
    let contentItems;
    let loadingMoreComponent;

    switch (true) {
        case isLoading:
            contentItems = (
                <div className='sidebar--right__subheader a11y__section'>
                    <div className='sidebar--right__loading'>
                        <span className='LoadingSpinner'>
                            <span className='fa fa-spinner fa-fw fa-pulse spinner' />
                        </span>
                    </div>
                </div>
            );
            break;
        default:
            contentItems = sortedPosts.map((post) => {
                if (myChannels[post.channel_id]) {
                    return (
                        <Post
                            key={post.id}
                            post={post}
                            location='SEARCH'
                        />
                    );
                }
                let content;
                switch (post.type as string) {
                case 'custom_issue':
                    content = <IssuePost post={post}/>;
                    break;
                case 'custom_plan':
                    content = <PlanPost post={post}/>;
                    break;
                case 'custom_task':
                    content = <TaskPost post={post}/>
                    break;
                case 'custom_trouble':
                    content = <TroublePost post={post}/>;
                    break;
                }
                return (
                    <div key={post.id} className="post post--bot">
                        <div className="post__content">
                            <div className="post__main">
                                <div className="post__body">
                                    {content}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            });

            loadingMoreComponent = showLoadMore ? (
                <div className='loading-screen'>
                    <div className='loading__content'>
                        <div className='round round-1' />
                        <div className='round round-2' />
                        <div className='round round-3' />
                    </div>
                </div>
            ) : null;
    }

    return (
        <Scrollbars
            ref={scrollbars}
            autoHide={true}
            autoHideTimeout={500}
            autoHideDuration={500}
            renderTrackVertical={renderTrackVertical}
            renderThumbHorizontal={renderThumbHorizontal}
            renderThumbVertical={renderThumbVertical}
            renderView={renderView}
            onScroll={handleScroll}
        >
            <div className="search-items-container post-list__table a11y__region" style={{ overflowY: 'auto' }}>
                {contentItems}
                {loadingMoreComponent}
            </div>
        </Scrollbars>
    );
}
