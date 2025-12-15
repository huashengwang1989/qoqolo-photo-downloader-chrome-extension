import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import './NotSupportedMessage.scss';

/**
 * Message component for non-Qoqolo sites
 */
export const NonQoqoloSiteMessage: React.FC = () => {
  return (
    <div className="not-supported-message">
      <div className="not-supported-icon">
        <FontAwesomeIcon icon={faTriangleExclamation} />
      </div>
      <h3 className="not-supported-title">This page is not supported.</h3>
      <p className="not-supported-description">
        This extension works for Qoqolo Student Portal only.
      </p>
    </div>
  );
};
