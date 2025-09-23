import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();

    return (
        <>
            {location.pathname !== '/login' && <Navbar />}
            <main>{children}</main>
        </>
    );
};

export default Layout;