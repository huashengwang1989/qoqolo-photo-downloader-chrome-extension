import React from 'react';

import PanelLayout from './components/PanelLayout';

import './PanelWrapper.scss';

interface PanelWrapperProps {
  children: React.ReactNode;
  isLoading?: boolean;
  isSupported?: boolean;
  notSupportedMessage?: string;
}

const PanelWrapper: React.FC<PanelWrapperProps> = ({
  children,
  isLoading = false,
  isSupported = true,
  notSupportedMessage = 'This page is not supported.',
}) => {
  if (isLoading) {
    return (
      <PanelLayout>
        <div>Loading...</div>
      </PanelLayout>
    );
  }

  if (!isSupported) {
    return (
      <PanelLayout>
        <div className="not-supported-wrapper">
          <p className="not-supported">{notSupportedMessage}</p>
        </div>
      </PanelLayout>
    );
  }

  return <PanelLayout>{children}</PanelLayout>;
};

export default PanelWrapper;
