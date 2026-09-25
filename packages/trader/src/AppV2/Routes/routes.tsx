import { lazy } from 'react';

import { routes } from '@deriv/shared';

import { TRouteConfig } from 'Types';

import ContractDetailsSwitch from './ContractDetailsSwitch';

// Lazy load route components for better code splitting
const Trade = lazy(() => import(/* webpackChunkName: "trader-trade" */ 'AppV2/Containers/Trade'));
const Positions = lazy(() => import(/* webpackChunkName: "trader-positions" */ 'AppV2/Containers/Positions'));

type TRouteConfigExtended = Omit<TRouteConfig, 'routes'> & {
    path: string;
    component: React.ComponentType;
    default: boolean;
};

const isStarTradersEmbedded =
    typeof window !== 'undefined' && !!(window as any).__STARTRADERS_EMBEDDED__;

const traderRoutes: TRouteConfigExtended[] = [
    // StarTraders owns /manual-trader. When DTrader is mounted inside that
    // page, make the workspace itself available at the basename root.
    // This also protects us if the shared Deriv route index changes between
    // DTrader releases.
    ...(isStarTradersEmbedded
        ? [
              {
                  path: '/',
                  component: Trade,
                  exact: true,
                  default: false,
              },
          ]
        : []),
    {
        path: routes.index,
        component: Trade,
        exact: true,
        default: false,
    },
    {
        path: routes.trader_positions,
        component: Positions,
        is_authenticated: true,
        default: false,
    },
    {
        path: routes.contract,
        component: ContractDetailsSwitch,
        is_authenticated: true,
        default: false,
    },
    {
        // DTrader normally shows its 404 page for unknown paths. Inside
        // StarTraders, however, /manual-trader is the workspace entry point,
        // so an unmatched startup path must open Trade rather than a dead end.
        path: '*',
        component: isStarTradersEmbedded ? Trade : lazy(() => import('Modules/Page404')),
        default: false,
    },
];

export default traderRoutes;
