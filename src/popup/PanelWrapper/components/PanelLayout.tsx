import React from 'react';

import ToggleViewButton from './ToggleViewButton';

interface PanelLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  logoUrl?: string | null;
}

const PanelLayout: React.FC<PanelLayoutProps> = ({
  children,
  headerTitle = 'Qoqolo Photo Downloader',
  logoUrl = null,
}) => {
  return (
    <div className="panel-wrapper">
      <div className="panel-header">
        {logoUrl && <img src={logoUrl} alt="Qoqolo Logo" className="panel-header-logo" />}
        <h2>{headerTitle}</h2>
        <ToggleViewButton />
      </div>
      <div className="panel-content">{children}</div>
    </div>
  );
};

export default PanelLayout;
