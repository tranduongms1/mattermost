// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import type {CSSProperties} from 'react';

export default function MattermostLogo(props: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span {...props}>
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path style={style} d="M0 32C0 14.3269 14.3269 0 32 0C49.6731 0 64 14.3269 64 32C64 49.6731 49.6731 64 32 64C14.3269 64 0 49.6731 0 32Z" fill="#009AF9" />
                <path style={style} d="M26.6869 14H45.8437C45.2427 17.8435 42.0875 19.0507 40.585 19.1739H29.2837C28.9081 19.1739 28.5324 19.5435 28.5324 19.913L28.565 26.5652C21.954 27.1565 16.5451 31.4928 14.6669 33.587C17.4215 31.8623 23.3063 29.5217 27.8138 29.1522C36.0775 28.4746 39.4581 26.1957 42.0875 24.7174C39.8337 31.7391 35.3262 33.2174 31.9456 33.587C29.2577 33.8808 28.565 34.3261 28.565 34.6957L28.7213 42.1842C28.7104 42.4306 28.839 42.9233 29.44 42.9233H46C44.798 46.7668 41.6449 48 40.585 48H22.9307C19.9257 48 20.3013 45.7826 20.3013 45.0435V34.6957C15.1928 34.6957 10.6603 37.6522 9.03258 39.1304C8.43158 36.4696 16.2946 29.6449 20.3013 26.5652V17.6957C20.3013 15.1087 24.0575 14 26.6869 14Z" fill="white" />
            </svg>
        </span>
    );
}

const style: CSSProperties = {
    fillRule: 'evenodd',
    clipRule: 'evenodd',
};
