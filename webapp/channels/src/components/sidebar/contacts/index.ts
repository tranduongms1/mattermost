import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import type {AnyAction, Dispatch} from 'redux';

import type {UserProfile} from '@mattermost/types/users';
import type {RelationOneToOne} from '@mattermost/types/utilities';

import {createSelector} from 'mattermost-redux/selectors/create_selector';
import {getTeammateNameDisplaySetting} from 'mattermost-redux/selectors/entities/preferences';
import {getCurrentRelativeTeamUrl} from 'mattermost-redux/selectors/entities/teams';
import {
    getProfiles,
    getUserStatuses,
    makeSearchProfilesMatchingWithTerm,
} from 'mattermost-redux/selectors/entities/users';
import {displayUsername} from 'mattermost-redux/utils/user_utils';

import {openDirectChannelToUserId} from 'actions/channel_actions';
import {setModalSearchTerm} from 'actions/views/search';

import type {GlobalState} from 'types/store';

import Contacts from './contacts';
import type {Props, Contact} from './contacts';

const buildProfileList = (
    profiles: UserProfile[],
    userStatuses: RelationOneToOne<UserProfile, string>,
    teammateNameDisplaySetting: string,
) => {
    const contacts: Contact[] = [];
    profiles.forEach((profile) => {
        if (profile.is_bot) return;
        contacts.push({
            user: profile,
            status: userStatuses[profile.id],
            displayName: displayUsername(profile, teammateNameDisplaySetting),
        });
    });

    contacts.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return contacts;
};

const getContacts = createSelector(
    'getContacts',
    getProfiles,
    getUserStatuses,
    getTeammateNameDisplaySetting,
    buildProfileList,
);

const searchContacts = createSelector(
    'searchContacts',
    makeSearchProfilesMatchingWithTerm(),
    getUserStatuses,
    getTeammateNameDisplaySetting,
    buildProfileList,
);

function mapStateToProps(state: GlobalState) {
    const searchTerms = state.views.search.modalSearch;

    let contacts: Contact[] = [];
    if (searchTerms === '') {
        contacts = getContacts(state);
    } else {
        contacts = searchContacts(state, searchTerms.trim());
    }

    const teamUrl = getCurrentRelativeTeamUrl(state);

    return {
        contacts,
        totalCount: contacts.length,
        searchTerms,
        teamUrl,
    } as Props;
}

function mapDispatchToProps(dispatch: Dispatch<AnyAction>) {
    return {
        actions: bindActionCreators({
            openDirectChannelToUserId,
            setModalSearchTerm,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Contacts);
