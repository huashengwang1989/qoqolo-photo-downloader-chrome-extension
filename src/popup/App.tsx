import React, { useEffect, useMemo, useState } from 'react';

import './styles/theme.scss'; // global theme variables

import './styles/popup.scss';
import { requestTabInfo } from './helpers/requestTabInfo';
import { setupTabInfoSync } from './helpers/setupTabUpdateListener';
import PanelWrapper from './PanelWrapper';
import Portfolio from './Portfolio';
import ClassActivity from './ClassActivity';
import CheckInOut from './CheckInOut';

import { isClassActivityPageUrl } from '@/shared/helpers/page';
import type { TabInfo } from '@/shared/types';

const App: React.FC = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [pageType, setPageType] = useState<TabInfo['pageType']>(null);
  const [isQoqoloSite, setIsQoqoloSite] = useState<boolean>(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleTabInfoUpdate = (tabInfo: TabInfo) => {
      setIsSupported(tabInfo.isSupported);
      setPageType(tabInfo.pageType);
      setIsQoqoloSite(tabInfo.isQoqoloSite);
      setLogoUrl(tabInfo.logoUrl);
      setCurrentUrl(tabInfo.url?.fullUrl || null);
    };

    // Initial check
    requestTabInfo(handleTabInfoUpdate);

    // Setup listeners for tab updates
    return setupTabInfoSync(handleTabInfoUpdate);
  }, []);

  // Check if Class Activity page has wrong tab
  const isWrongClassActivityTab = useMemo(() => {
    if (!currentUrl || pageType !== null) {
      return false;
    }
    // If URL matches Class Activity pattern but pageType is null, it means wrong tab
    return isClassActivityPageUrl(currentUrl);
  }, [currentUrl, pageType]);

  // Render content based on page type
  const renderedContent = useMemo(() => {
    if (pageType === 'qoqoloPortfolioPage') {
      return <Portfolio />;
    }
    if (pageType === 'qoqoloClassActivityPage') {
      return <ClassActivity />;
    }
    if (pageType === 'qoqoloCheckInOutPage') {
      return <CheckInOut />;
    }
    return null;
  }, [pageType]);

  return (
    <PanelWrapper
      isLoading={isSupported === null}
      isSupported={isSupported ?? false}
      isQoqoloSite={isQoqoloSite}
      logoUrl={logoUrl}
      wrongClassActivityTab={isWrongClassActivityTab}
    >
      {renderedContent}
    </PanelWrapper>
  );
};

export default App;
