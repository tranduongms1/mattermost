import React, {useCallback, useEffect, useState} from 'react';
import {useHistory} from 'react-router-dom';
import styled from 'styled-components';

import type {Channel} from '@mattermost/types/channels';
import type {UserProfile} from '@mattermost/types/users';

import ContactList from './contact_list';
import SearchBar from './search';

export interface Contact {
    user: UserProfile;
    status?: string;
    displayName: string;
}

const Container = styled.div`
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
`;

export interface Props {
    contacts: Contact[];
    totalCount: number;
    searchTerms: string;
    teamUrl: string;

    actions: {
        openDirectChannelToUserId: (userId: string) => Promise<{data: Channel}>;
        setModalSearchTerm: (terms: string) => void;
    };
}

export default function Contacts({
    contacts,
    totalCount,
    searchTerms,
    teamUrl,
    actions,
}: Props) {
    const history = useHistory();

    const [page, setPage] = useState(0);
    const [isNextPageLoading, setIsNextPageLoading] = useState(false);

    useEffect(() => {
        return () => {
            actions.setModalSearchTerm('');
        };
    }, []);

    const setSearchTerms = async (terms: string) => {
        actions.setModalSearchTerm(terms);
    };

    const openDirectMessage = useCallback(async (user: UserProfile) => {
        // we first prepare the DM channel...
        await actions.openDirectChannelToUserId(user.id);

        // ... and then redirect to it
        history.push(teamUrl + '/messages/@' + user.username);
    }, [actions.openDirectChannelToUserId, history, teamUrl]);

    const loadMore = useCallback(async () => {
        setIsNextPageLoading(true);

        setPage(page + 1);

        setIsNextPageLoading(false);
    }, [page]);

    return (
        <Container>
            <SearchBar
                terms={searchTerms}
                onInput={setSearchTerms}
            />
            <ContactList
                contacts={contacts}
                searchTerms={searchTerms}
                openDirectMessage={openDirectMessage}
                loadMore={loadMore}
                hasNextPage={contacts.length < totalCount}
                isNextPageLoading={isNextPageLoading}
            />
        </Container>
    );
}
