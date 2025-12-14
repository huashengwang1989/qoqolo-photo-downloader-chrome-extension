import React, { useEffect, useMemo, useState } from 'react';

import './styles/theme.scss'; // global theme variables

import './styles/popup.scss';
import { requestTabInfo } from './helpers/requestTabInfo';
import { setupTabInfoSync } from './helpers/setupTabUpdateListener';
import PanelWrapper from './PanelWrapper';
import Portfolio from './Portfolio';

import type { TabInfo } from '@/shared/types';

const App: React.FC = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [pageType, setPageType] = useState<TabInfo['pageType']>(null);

  useEffect(() => {
    const handleTabInfoUpdate = (tabInfo: TabInfo) => {
      setIsSupported(tabInfo.isSupported);
      setPageType(tabInfo.pageType);
    };

    // Initial check
    requestTabInfo(handleTabInfoUpdate);

    // Setup listeners for tab updates
    return setupTabInfoSync(handleTabInfoUpdate);
  }, []);

  // Render content based on page type
  const renderedContent = useMemo(() => {
    if (pageType === 'qoqoloPortfolioPage') {
      return <Portfolio />;
    }
    // Future: add other page type components here
    // if (pageType === 'otherPageType') {
    //   return <OtherPageType />;
    // }
    return null;
  }, [pageType]);

  return (
    <PanelWrapper
      isLoading={isSupported === null}
      isSupported={isSupported ?? false}
      notSupportedMessage="This page is not supported."
    >
      {renderedContent}
    </PanelWrapper>
  );
};

export default App;
