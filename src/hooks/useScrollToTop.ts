import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.scrollTo(0, 0);
        } else {
            window.scrollTo(0, 0);
        }
    }, [pathname]);
};
