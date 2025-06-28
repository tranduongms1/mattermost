// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import type {AnyAction, Dispatch} from 'redux';

import {
    showMentions,
    showSearchResults,
    showFlaggedPosts,
    showPinnedPosts,
    closeRightHandSide,
    toggleRhsExpanded,
    updateRhsState,
} from 'actions/views/rhs';
import {getIsRhsExpanded, getSelectedPostCard} from 'selectors/rhs';

import type {GlobalState} from 'types/store';

import RhsCardHeader from './rhs_card_header';

function mapStateToProps(state: GlobalState) {
    const selected = getSelectedPostCard(state);

    return {
        isExpanded: getIsRhsExpanded(state),
        postType: selected.type,
    };
}

function mapDispatchToProps(dispatch: Dispatch<AnyAction>) {
    return {
        actions: bindActionCreators({
            showMentions,
            showSearchResults,
            showFlaggedPosts,
            showPinnedPosts,
            updateRhsState,
            closeRightHandSide,
            toggleRhsExpanded,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(RhsCardHeader);
