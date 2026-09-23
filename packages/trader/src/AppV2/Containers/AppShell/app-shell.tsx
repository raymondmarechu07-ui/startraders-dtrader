import React from 'react';
import { observer } from 'mobx-react-lite';
import { useDevice } from '@deriv-com/ui';
import Router from '../../Routes/router';
import './app-shell.scss';

const navItems = [
    ['Dashboard', '/dashboard'],
    ['Bot Builder', '/bot-builder'],
    ['Free Bots', '/free-bots'],
    ['Signals', '/signals'],
    ['Speedbot', '/speedbot'],
    ['AI Software', '/ai-software'],
    ['Risk Calculator', '/risk-calculator'],
    ['Trade Academy', '/trade-academy'],
    ['Manual Trader', '/manual-trader'],
];

const AppShell = observer(() => {
    const { isMobile } = useDevice();
    const go = href => { window.location.href = href; };
    return (
        <div className='app-shell'>
            <header className='st-shell-header'>
                <button className='st-shell-menu' aria-label='Open menu' onClick={() => window.location.href = '/dashboard'}>☰</button>
                <button className='st-shell-brand' onClick={() => window.location.href = '/dashboard'}>
                    <span className='st-shell-star'>★</span>
                    <span className='st-shell-brand-orange'>STAR</span>
                    <span className='st-shell-brand-green'>TRADERS</span>
                </button>
                <div className='st-shell-spacer' />
                <button className='st-shell-report' onClick={() => window.location.href = '/dashboard'}>▤ <span>Reports</span></button>
            </header>
            <nav className='st-shell-nav' aria-label='Star Traders'>
                {navItems.map(([label, href]) => (
                    <button key={label} className={'st-shell-nav-item ' + (href === '/manual-trader' ? 'is-active' : '')} onClick={() => go(href)}>{label}</button>
                ))}
            </nav>
            <main className={'app-shell__main-content ' + (isMobile ? 'is-mobile' : '')}>
                <Router />
            </main>
        </div>
    );
});

export default AppShell;