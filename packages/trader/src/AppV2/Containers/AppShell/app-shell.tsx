import React from 'react';
import { useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { getBrandLogoDark, getBrandName } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { useDevice } from '@deriv-com/ui';

import Sidebar from 'AppV2/Components/Layout/Sidebar/sidebar';

import Router from '../../Routes/router';

import './app-shell.scss';

const STARTRADERS_ROOT = 'https://startraders-xn1z.onrender.com';

const NAV_ITEMS = [
    ['⌂', 'Dashboard', '/dashboard'],
    ['▣', 'Bot Builder', '/bot-builder'],
    ['☆', 'Free Bots', '/free-bots'],
    ['▣', 'Manual Trader', '/manual-trader/'],
    ['⌁', 'Signals', '/signals'],
    ['ϟ', 'Speedbot', '/speedbot'],
    ['✦', 'AI Software', '/ai-software'],
    ['◉', 'Risk Calculator', '/risk-calculator'],
    ['◇', 'Trade Academy', '/trade-academy'],
    ['⌕', 'Analysis Tool', '/analysis-tool'],
    ['⇄', 'Copy Trader', '/copy-trader'],
    ['▤', 'Bulk Trader', '/bulk-trader'],
];

const AppShell = observer(() => {
    const { ui, client } = useStore();
    const { active_sidebar_flyout } = ui;
    const { isMobile } = useDevice();
    const location = useLocation();

    React.useEffect(() => {
        if (active_sidebar_flyout && location.pathname !== '/') {
            ui.closeSidebarFlyout();
        }
    }, [location.pathname]);

    const isManualTrader = location.pathname === '/' || location.pathname === '/manual-trader';

    return (
        <div className='app-shell app-shell--startraders'>
            <header className='startraders-shell-header'>
                <a className='startraders-shell-brand' href={`${STARTRADERS_ROOT}/dashboard`} aria-label='Star Traders dashboard'>
                    <img src={`/${getBrandLogoDark()}`} alt={getBrandName()} />
                    <span>STARTRADERS</span>
                </a>

                <nav className='startraders-shell-nav' aria-label='Star Traders navigation'>
                    {NAV_ITEMS.map(([icon, label, href]) => (
                        <a
                            key={href}
                            className={`startraders-shell-nav__item ${label === 'Manual Trader' && isManualTrader ? 'is-active' : ''}`}
                            href={`${STARTRADERS_ROOT}${href}`}
                        >
                            <span className='startraders-shell-nav__icon' aria-hidden='true'>{icon}</span>
                            <span>{label}</span>
                        </a>
                    ))}
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
