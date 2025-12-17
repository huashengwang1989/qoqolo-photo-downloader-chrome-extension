import { faCamera, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import './NotSupportedMessage.scss';

/**
 * Message component for Qoqolo sites but unsupported pages
 */
export const UnsupportedQoqoloPageMessage: React.FC = () => {
  return (
    <div className="not-supported-message">
      <div className="not-supported-icon">
        <FontAwesomeIcon icon={faCamera} />
      </div>
      <h3 className="not-supported-title">
        Navigate to a supported page to start photo extraction.
      </h3>
      <div className="not-supported-sections">
        <div className="not-supported-section">
          <h4 className="not-supported-section-title">Currently supported:</h4>
          <ul className="not-supported-list">
            <li>
              <span className="not-supported-list-icon">
                <FontAwesomeIcon icon={faCheck} />
              </span>
              <span>Portfolios Activity</span>
            </li>
            <li>
              <span className="not-supported-list-icon">
                <FontAwesomeIcon icon={faCheck} />
              </span>
              <span>Class Activity</span>
            </li>
            <li>
              <span className="not-supported-list-icon">
                <FontAwesomeIcon icon={faCheck} />
              </span>
              <span>Recent Sign-in/out</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
