// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import './footer.scss';

const Footer = () => {
    return (
        <div className='hfroute-footer'>
            <span
                key='footer-copyright'
                className='footer-copyright'
            >
                {`© ${new Date().getFullYear()} Vietdesign`}
            </span>
        </div>
    );
};

export default Footer;
