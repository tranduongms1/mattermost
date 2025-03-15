// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect} from 'react';
import {useSelector} from 'react-redux';

import {getConfig} from 'mattermost-redux/selectors/entities/general';

type Props = {
    children?: React.ReactNode | React.ReactNodeArray;
}

const HeaderFooterNotLoggedIn = (props: Props) => {
    const config = useSelector(getConfig);

    useEffect(() => {
        document.body.classList.add('sticky');
        const rootElement: HTMLElement | null = document.getElementById('root');
        if (rootElement) {
            rootElement.classList.add('container-fluid');
        }

        return () => {
            document.body.classList.remove('sticky');
            const rootElement: HTMLElement | null = document.getElementById('root');
            if (rootElement) {
                rootElement.classList.remove('container-fluid');
            }
        };
    }, []);

    if (!config) {
        return null;
    }

    return (
        <div className='inner-wrap'>
            <div className='row content'>
                {props.children}
            </div>
            <div className='row footer'>
                <div
                    id='footer_section'
                    className='footer-pane col-xs-12'
                >
                    <div className='col-xs-12'>
                        <span
                            id='company_name'
                            className='pull-right footer-site-name'
                        >
                            {config.SiteName}
                        </span>
                    </div>
                    <div className='col-xs-12'>
                        <span
                            id='copyright'
                            className='pull-right footer-link copyright'
                        >
                            {`© ${new Date().getFullYear()} Vietdesign`}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeaderFooterNotLoggedIn;
