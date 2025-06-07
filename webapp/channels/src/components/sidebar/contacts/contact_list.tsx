import React, {memo, useEffect, useRef, useState} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeList} from 'react-window';
import type {ListChildComponentProps} from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

import type {UserProfile} from '@mattermost/types/users';

import ContactItem from './contact_item';
import {Contact} from './contacts';

export interface Props {
    contacts: Contact[];
    hasNextPage: boolean;
    isNextPageLoading: boolean;
    searchTerms: string;
    openDirectMessage: (user: UserProfile) => void;
    loadMore: () => void;
}

const ContactList = ({
    contacts,
    hasNextPage,
    isNextPageLoading,
    searchTerms,
    openDirectMessage,
    loadMore,
}: Props) => {
    const infiniteLoaderRef = useRef<InfiniteLoader | null>(null);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        if (hasMounted) {
            if (infiniteLoaderRef.current) {
                infiniteLoaderRef.current.resetloadMoreItemsCache();
            }
        }
        setHasMounted(true);
    }, [searchTerms, contacts.length, hasMounted]);

    const itemCount = hasNextPage ? contacts.length + 1 : contacts.length;

    const loadMoreItems = isNextPageLoading ? () => {} : loadMore;

    const isItemLoaded = (index: number) => {
        return !hasNextPage || index < contacts.length;
    };

    const Item = ({index, style}: ListChildComponentProps) => {
        if (isItemLoaded(index)) {
            const contact = contacts[index];
            return (
                <div
                    style={style}
                    key={contact.user.id}
                >
                    <ContactItem
                        contact={contact}
                        actions={{openDirectMessage}}
                    />
                </div>
            );
        }

        return null;
    };

    if (contacts.length === 0) {
        return null;
    }

    return (
        <AutoSizer>
            {({height, width}) => (
                <InfiniteLoader
                    ref={infiniteLoaderRef}
                    isItemLoaded={isItemLoaded}
                    itemCount={itemCount}
                    loadMoreItems={loadMoreItems}
                >
                    {({onItemsRendered}) => (
                        <FixedSizeList
                            itemCount={itemCount}
                            onItemsRendered={onItemsRendered}
                            itemSize={48}
                            height={height}
                            width={width}
                        >
                            {Item}
                        </FixedSizeList>
                    )}
                </InfiniteLoader>
            )}
        </AutoSizer>
    );
};

export default memo(ContactList);
