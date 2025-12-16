import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import './NotSupportedMessage.scss';

/**
 * Message component for Class Activity page but wrong tab
 */
export const WrongClassActivityTabMessage: React.FC = () => {
  return (
    <div className="not-supported-message">
      <div className="not-supported-icon">
        <FontAwesomeIcon icon={faExclamationTriangle} />
      </div>
      <h3 className="not-supported-title">
        Please navigate to &quot;All&quot;, &quot;Albums&quot; or &quot;Activity&quot; tab to
        retrieve photos.
      </h3>
    </div>
  );
};
