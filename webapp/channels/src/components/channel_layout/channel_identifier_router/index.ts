// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {withRouter} from 'react-router-dom';
import {bindActionCreators} from 'redux';
import type {Dispatch} from 'redux';

import {selectStaticPage} from 'actions/views/lhs';
import {getCurrentStaticPageId} from 'selectors/lhs';
import type {GlobalState} from 'types/store';

import {onChannelByIdentifierEnter} from './actions';
import ChannelIdentifierRouter from './channel_identifier_router';

function mapStateToProps(state: GlobalState) {
    return {
        staticPageId: getCurrentStaticPageId(state),
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        actions: bindActionCreators({
            selectStaticPage,
            onChannelByIdentifierEnter,
        }, dispatch),
    };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ChannelIdentifierRouter));
