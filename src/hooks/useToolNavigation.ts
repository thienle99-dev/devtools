import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTabStore } from '@store/tabStore';
import { getToolByPath } from '@tools/registry';

export function useToolNavigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const tabs = useTabStore(state => state.tabs);
    const activeTabId = useTabStore(state => state.activeTabId);

    // Sync URL -> Tab
    useEffect(() => {
        const { tabs, activeTabId, openTab, setActiveTab } = useTabStore.getState();
        const tool = getToolByPath(location.pathname);

        if (tool) {
            if (tool.id === 'dashboard') {
                if (activeTabId) {
                    setActiveTab(null);
                }
                return;
            }

            const existingTab = tabs.find(t => t.toolId === tool.id);
            if (!existingTab) {
                openTab(tool.id, tool.path, tool.name, tool.description, false, false);
            } else {
                if (existingTab.id !== activeTabId) {
                    setActiveTab(existingTab.id);
                }
            }
        } else if (location.pathname === '/' || location.pathname === '/dashboard') {
            if (activeTabId) setActiveTab(null);
        }
    }, [location.pathname]);

    // When all tabs are closed, redirect to dashboard
    useEffect(() => {
        if (tabs.length === 0 && location.pathname !== '/dashboard' && location.pathname !== '/') {
            navigate('/dashboard', { replace: true });
        }
    }, [tabs.length, location.pathname, navigate]);

    // Sync Tab -> URL
    useEffect(() => {
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab && location.pathname !== activeTab.path) {
            navigate(activeTab.path, { replace: true });
        }
    }, [activeTabId, tabs, location.pathname, navigate]);
}
