'use client';

import { useEffect } from 'react';

const LayoutWrapper = ({ children }) => {
    useEffect(() => {
        // Initialize Bootstrap tooltips
        if (typeof window !== 'undefined') {
            const { Tooltip } = require('bootstrap');
            const tooltipTriggerList = document.querySelectorAll('[data-bs-title]');
            [...tooltipTriggerList].map(tooltipTriggerEl => new Tooltip(tooltipTriggerEl));
        }
    }, []);

    return children;
} 

export default LayoutWrapper;