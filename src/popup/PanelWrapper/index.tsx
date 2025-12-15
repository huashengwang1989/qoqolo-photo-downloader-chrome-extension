import React from 'react';

import PanelLayout from './components/PanelLayout';
import {
  NonQoqoloSiteMessage,
  UnsupportedQoqoloPageMessage,
} from './components/NotSupportedMessage';

import './PanelWrapper.scss';

interface PanelWrapperProps {
  children: React.ReactNode;
  isLoading?: boolean;
  isSupported?: boolean;
  isQoqoloSite?: boolean;
  logoUrl?: string | null;
  notSupportedMessage?: string;
}

const PanelWrapper: React.FC<PanelWrapperProps> = ({
  children,
  isLoading = false,
  isSupported = true,
  isQoqoloSite = false,
  logoUrl = null,
  notSupportedMessage,
}) => {
  if (isLoading) {
    return (
      <PanelLayout logoUrl={logoUrl}>
        <div>Loading...</div>
      </PanelLayout>
    );
  }

  if (!isSupported) {
    // Use custom message if provided, otherwise use dedicated components based on site type
    let message: React.ReactNode;
    if (notSupportedMessage) {
      message = <p className="not-supported">{notSupportedMessage}</p>;
    } else if (!isQoqoloSite) {
      // Non-Qoqolo site
      message = <NonQoqoloSiteMessage />;
    } else {
      // Qoqolo site but not a supported page
      message = <UnsupportedQoqoloPageMessage />;
    }

    return (
      <PanelLayout logoUrl={logoUrl}>
        <div className="not-supported-wrapper">{message}</div>
      </PanelLayout>
    );
  }

  return <PanelLayout logoUrl={logoUrl}>{children}</PanelLayout>;
};

export default PanelWrapper;
