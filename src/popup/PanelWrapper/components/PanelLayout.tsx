import React from 'react';

import ToggleViewButton from './ToggleViewButton';

interface PanelLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
}

const PanelLayout: React.FC<PanelLayoutProps> = ({
  children,
  headerTitle = 'Qoqolo Photo Downloader',
}) => {
  return (
    <div className="panel-wrapper">
      <div className="panel-header">
        <h2>{headerTitle}</h2>
        <ToggleViewButton />
      </div>
      <div className="panel-content">{children}</div>
    </div>
  );
};

export default PanelLayout;
