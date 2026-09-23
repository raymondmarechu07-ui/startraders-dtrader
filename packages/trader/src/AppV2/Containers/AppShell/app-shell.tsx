import React from 'react';
import { useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { routes, getBrandLogoDark, getBrandName } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { useDevice } from '@deriv-com/ui';

import Sidebar from 'AppV2/Components/Layout/Sidebar/sidebar';

import Router from '../../Routes/router';

import './app-shell.scss';

const STARTRADERS_DASHBOARD = 'https://startraders-xn1z.onrender.com/dashboard';

const AppShell = observer(() => {
    const { ui, client } = useStore();
    const { active_sidebar_flyout } = ui;
    const { isMobile } = useDevice();
    const location = useLocation();

    React.useEffect(() => {
        if (active_sidebar_flyout && location.pathname !== routes.index) {
            ui.closeSidebarFlyout();
        }
    }, [location.pathname]);

    const isManualTrader = location.pathname === routes.index || location.pathname === '/';
    const isReports = location.pathname.startsWith(routes.reports);

    return (
        <div className='app-shell app-shell--startraders'>
            <header className='startraders-shell-header'>
                <a className='startraders-shell-brand' href={STARTRADERS_DASHBOARD} aria-label='Star Traders dashboard'>
                    <img src={`/${getBrandLogoDark()}`} alt={getBrandName()} />
                    <span>Star Traders</span>
                </a>

                <nav className='startraders-shell-nav' aria-label='Star Traders navigation'>
                    <a className='startraders-shell-nav__item' href={STARTRADERS_DASHBOARD}>
                        Dashboard
                    </a>
                    <a className={`startraders-shell-nav__item ${isManualTrader ? 'is-active' : ''}`} href='/'>
                        Manual Trader
                    </a>
                    {client.is_logged_in && (
                        <a className={`startraders-shell-nav__item ${isReports ? 'is-active' : ''}`} href={routes.reports}>
                            Reports
                        </a>
                    )}
                </nav>

                <div className='startraders-shell-status'>
                    <span className='startraders-shell-dot' />
                    <span>{client.is_logged_in ? 'CONNECTED' : 'READY'}</span>
                </div>
            </header>

            <div className='app-shell__body'>
                {!isMobile && <Sidebar />}
                <div className='app-shell__main-content'>
                    <Router />
                </div>
            </div>
        </div>
    );
});

export default AppShell;
