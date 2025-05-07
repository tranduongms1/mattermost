import React, {useEffect, useRef, useState} from 'react';
import Scrollbars from 'react-custom-scrollbars';
import {useSelector} from 'react-redux';
import styled from 'styled-components';

import Post from 'components/post';
import IssuePost from 'components/post_view/issue_post';

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
}

export default function PostListRHS({
    channelId,
    type,
    statuses,
}: Props) {
    const scrollbars = useRef<Scrollbars | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showLoadMore, setShowLoadMore] = useState(false);

    const posts = useSelector((state: GlobalState) => Object.values(state.entities.posts.posts).filter(
        (p) => (!channelId || p.channel_id === channelId) && p.type === type && statuses.includes(p.props.status as string)
    ));

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const handleScroll = (): void => {
        const scrollHeight = scrollbars.current?.getScrollHeight() || 0;
        const scrollTop = scrollbars.current?.getScrollTop() || 0;
        const clientHeight = scrollbars.current?.getClientHeight() || 0;
        if ((scrollTop + clientHeight + GET_MORE_BUFFER) >= scrollHeight) {
            setShowLoadMore(true);
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
            contentItems = posts.map((post) => {
                if (myChannels[post.channel_id]) {
                    return (
                        <Post
                            post={post}
                            location='SEARCH'
                        />
                    );
                }
                return (
                    <div className="post post--bot">
                        <div className="post__content">
                            <div className="post__main">
                                <div className="post__body">
                                    <IssuePost post={post}/>
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
        <div className="search-items-container post-list__table a11y__region" style={{overflowY: 'auto'}}>
            {contentItems}
            {loadingMoreComponent}
        </div>
    );
}
