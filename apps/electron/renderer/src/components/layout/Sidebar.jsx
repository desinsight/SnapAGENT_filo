import React, { useState, useEffect } from 'react';
import ServiceSelector from './ServiceSelector';
import MainSidebar from './MainSidebar';
import { getServicePanels, getServiceConfig } from '../../services/serviceConfig.js';

const Sidebar = ({
  activeService,
  onServiceChange,
  activePanel,
  onPanelChange,
  collapsed,
  onToggleCollapse,
  drives,
  favorites,
  recentFiles,
  currentPath,
  onNavigate,
  onNotification,
  onAIToggle,
  isAIOpen,
  children
}) => {
  const [currentPanels, setCurrentPanels] = useState([]);
  const [serviceInfo, setServiceInfo] = useState(null);

  // 서비스 변경 시 패널 및 정보 업데이트
  useEffect(() => {
    const panels = getServicePanels(activeService);
    const config = getServiceConfig(activeService);
    setCurrentPanels(panels);
    setServiceInfo(config);
  }, [activeService]);

  // 서비스 변경 핸들러 (App.jsx의 handleServiceChange를 직접 호출)
  const handleServiceChange = (serviceId) => {
    onServiceChange(serviceId);
  };

  return (
    <div className="flex h-full">
      {/* 서비스 선택기 (좌측 슬림 바) */}
      <ServiceSelector
        activeService={activeService}
        onServiceChange={handleServiceChange}
        activePanel={activePanel}
        onPanelChange={onPanelChange}
        onAIToggle={onAIToggle}
        isAIOpen={isAIOpen}
      />

      {/* 메인 사이드바 */}
      <MainSidebar
        serviceName={serviceInfo?.name || 'Service'}
        serviceDescription={serviceInfo?.description || '서비스'}
        serviceIcon={serviceInfo?.id === 'file-manager' ? 'FileIcon' : 'ChatIcon'}
        panels={currentPanels}
        activePanel={activePanel}
        onPanelChange={onPanelChange}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        drives={drives}
        favorites={favorites}
        recentFiles={recentFiles}
        currentPath={currentPath}
        onNavigate={onNavigate}
        onNotification={onNotification}
      >
        {children}
      </MainSidebar>
    </div>
  );
};

export default Sidebar;