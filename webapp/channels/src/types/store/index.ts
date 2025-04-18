// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {GlobalState as BaseGlobalState} from '@mattermost/types/store';

import type {ChannelsState} from './channels';
import type {PluginsState} from './plugins';
import type {ViewsState} from './views';

export type DraggingState = {
    state?: string;
    type?: string;
    id?: string;
}

export type GlobalState = BaseGlobalState & {
    channels: ChannelsState;
    plugins: PluginsState;
    storage: {
        storage: Record<string, any>;
        initialized: boolean;
    };
    views: ViewsState;
};
