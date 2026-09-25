import React from 'react';

import Router from '../../Routes/router';

import './app-shell.scss';

const AppShell = () => {
    return (
        <main className='app-shell app-shell--startraders-embedded'>
            <Router />
        </main>
    );
};

export default AppShell;
