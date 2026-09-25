import PropTypes from 'prop-types';
import React from 'react';
import ErrorComponent from './index';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    componentDidCatch = (error, info) => {
        // Keep the original exception visible during the StarTraders integration
        // so a generic DTrader error screen does not hide the real startup fault.
        // eslint-disable-next-line no-console
        console.error('[DTrader ErrorBoundary]', error, info);
        this.setState({
            hasError: true,
            error,
            info,
        });
    };
    render = () =>
        this.state.hasError ? (
            <ErrorComponent
                should_show_refresh={true}
                header="Manual Trader encountered an error"
                message={
                    this.state.error?.message
                        ? `DTrader startup error: ${this.state.error.message}`
                        : 'DTrader encountered an unexpected startup error.'
                }
            />
        ) : (
            this.props.children
        );
}

ErrorBoundary.propTypes = {
    root_store: PropTypes.object,
    children: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
};

export default ErrorBoundary;
