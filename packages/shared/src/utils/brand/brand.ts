// eslint-disable-next-line import/no-relative-packages
import config_data from '../../../../../brand.config.json';
import { appendLangParam } from '../url/helpers';

export const getBrandDomain = (): string => {
    return (config_data as Record<string, unknown> & typeof config_data).brand_domain as string;
};

export const getBrandName = () => {
    return config_data.brand_name;
};

export const getBrandLogo = () => {
    return config_data.brand_logo;
};

export const getBrandLogoDark = (): string => {
    return (
        ((config_data as Record<string, unknown> & typeof config_data).brand_logo_dark as string) ??
        config_data.brand_logo
    );
};

export const getPlatformName = () => {
    return config_data.platform.name;
};

export const getPlatformLogo = () => {
    return config_data.platform.logo;
};

export const getPlatformDescription = (): string => {
    return ((config_data.platform as Record<string, unknown>).description as string) ?? '';
};

/**
 * Cloudflare Pages creates preview hostnames such as:
 *   f914bffb.startraders-dtrader.pages.dev
 * These should use the production Deriv endpoints rather than the
 * restricted staging endpoints.
 */
const isStarTradersProductionHost = (hostname: string): boolean =>
    hostname === config_data.brand_hostname.production ||
    hostname.endsWith('.startraders-dtrader.pages.dev') ||
    hostname === 'startraders-xn1z.onrender.com';

export const isProduction = (): boolean => {
    if (typeof window === 'undefined') return false;
    return isStarTradersProductionHost(window.location.hostname);
};

export const getBrandHostname = () => {
    const hostname = isProduction() ? config_data.brand_hostname.production : config_data.brand_hostname.staging;
    return substituteDerivDomain(hostname);
};

export const getBrandUrl = () => {
    const hostname = isProduction() ? config_data.brand_hostname.production : config_data.brand_hostname.staging;
    return `https://${substituteDerivDomain(hostname)}`;
};

export const getBrandHomeUrl = (language?: string) => {
    const baseUrl = `${getBrandUrl()}/home`;
    return appendLangParam(baseUrl, language);
};

export const getBrandLoginUrl = (language?: string) => {
    const baseUrl = `${getBrandUrl()}/login`;
    return appendLangParam(baseUrl, language);
};

export const getBrandSignupUrl = (language?: string) => {
    const baseUrl = `${getBrandUrl()}/signup`;
    return appendLangParam(baseUrl, language);
};

export const getAppId = (): number => {
    const app_id = (config_data as Record<string, unknown> & typeof config_data).app_id as
        | { staging: number; production: number }
        | undefined;
    if (!app_id) return 16929;
    return isProduction() ? app_id.production : app_id.staging;
};

const substituteDerivDomain = (url: string): string => {
    const domain = getDomainName();
    if (!domain || domain !== getBrandDomain()) return url;
    try {
        const parsed = new URL(url);
        parsed.hostname = parsed.hostname.replace(/deriv\.com$/, domain);
        return parsed.toString();
    } catch {
        return url.replace(/deriv\.com/, domain);
    }
};

export const getDomainName = () => {
    if (typeof window === 'undefined') return '';
    const hostname = window.location.hostname;
    if (!hostname) return '';
    const domainParts = hostname.split('.');
    if (domainParts.length >= 2) {
        return `${domainParts[domainParts.length - 2]}.${domainParts[domainParts.length - 1]}`;
    }
    return '';
};

export const getTrustedDomainName = (): string => {
    const domain = getDomainName();
    return domain === getBrandDomain() ? domain : 'deriv.com';
};

const CLOUDFLARE_PAGES_PATTERN = /^[a-zA-Z0-9-]+\.startraders-dtrader\.pages\.dev$/;
export const getRedirectHostname = (): string => {
    if (typeof window === 'undefined') return '';
    const hostname = window.location.hostname;
    const domain = getDomainName();
    if (domain === getBrandDomain()) return hostname;
    if (CLOUDFLARE_PAGES_PATTERN.test(hostname)) return hostname;
    return '';
};

export const getApiV4BaseUrl = (): string => {
    const cfg = config_data as Record<string, unknown> & typeof config_data;
    const derivws = cfg.derivws as { staging: string; production: string } | undefined;
    if (!derivws) return 'https://api.derivws.com';
    return isProduction() ? derivws.production : derivws.staging;
};

export const getAuthBaseUrl = (): string => {
    return isProduction() ? config_data.auth.production : config_data.auth.staging;
};

export const getOAuthClientId = (): string => {
    const client_id = process.env.OAUTH_CLIENT_ID;
    if (!client_id)
        throw new Error(
            'OAUTH_CLIENT_ID is not set. Add it to your .env file for local dev or GitHub Environment secrets for CI.'
        );
    return client_id;
};

export const getOAuthAppId = (): string => {
    return ((config_data.auth as Record<string, unknown>).oauth_app_id as string) ?? '';
};

export const getOAuthRedirectUri = (): string => {
    const auth = config_data.auth as Record<string, unknown>;
    return isProduction()
        ? ((auth.oauth_redirect_uri_production as string) ?? '')
        : ((auth.oauth_redirect_uri_staging as string) ?? '');
};

export const getWebSocketURL = (): string => {
    const base = isProduction() ? config_data.api_core.production : config_data.api_core.staging;
    return `${substituteDerivDomain(base)}/options/v1/ws`;
};

export const getWhoAmIURL = (): string => {
    const base = isProduction() ? config_data.auth.production : config_data.auth.staging;
    return substituteDerivDomain(`${base}/sessions/whoami`);
};

export const getLogoutURL = (): string => {
    const base = isProduction() ? config_data.auth.production : config_data.auth.staging;
    return substituteDerivDomain(`${base}/self-service/logout/browser`);
};

export const getApiCoreUrl = (): string => {
    const url = isProduction() ? config_data.api_core.production : config_data.api_core.staging;
    return substituteDerivDomain(url);
};

export const getApiCoreBaseUrl = (): string => {
    return `https://${getApiCoreUrl()}`;
};

export const getApiUrl = (): string => {
    const url = isProduction() ? config_data.api.production : config_data.api.staging;
    return substituteDerivDomain(url);
};

export const getApiBaseUrl = (): string => {
    return `https://${getApiUrl()}`;
};

export const getHomeUrl = (): string => {
    return substituteDerivDomain(((config_data.platform as Record<string, unknown>).home_url as string) ?? '');
};

export const getHelpCentreUrl = (): string => {
    return substituteDerivDomain(config_data.platform.help_centre_url);
};

export const getDepositUrl = (): string => {
    const deposit = (config_data as Record<string, unknown>).deposit_url as
        | { staging: string; production: string }
        | undefined;
    if (!deposit) return '';
    return substituteDerivDomain(isProduction() ? deposit.production : deposit.staging);
};

export const getSignupUrl = (): string => {
    const signup = (config_data as Record<string, unknown>).signup_url as
        | { staging: string; production: string }
        | undefined;
    if (!signup) return '';
    return substituteDerivDomain(isProduction() ? signup.production : signup.staging);
};

export const isFeatureEnabled = (feature: 'dark_mode' | 'language_switcher'): boolean => {
    const features = (config_data as Record<string, unknown>).features as Record<string, boolean> | undefined;
    return features?.[feature] ?? false;
};
