import React, { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingScreen from '../components/LoadingScreen';

const AuthLayout = ({ children, authentication = true }) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const authStatus = useSelector(state => state.auth.status);

    // Memoize auth check to prevent unnecessary re-renders
    const authCheck = useMemo(() => ({
        isLoading: authStatus === null,
        isAuthenticated: Boolean(authStatus),
        needsAuth: authentication,
    }), [authStatus, authentication]);

    useEffect(() => {
        const { isLoading, isAuthenticated, needsAuth } = authCheck;

        if (isLoading) return;

        // Redirect unauthenticated users trying to access protected routes
        if (needsAuth && !isAuthenticated) {
            navigate('/login', { 
                replace: true,
                state: { from: pathname } // Remember where they came from
            });
            return;
        }

        // Redirect authenticated users away from login/register pages
        if (!needsAuth && isAuthenticated) {
            navigate('/', { replace: true });
            return;
        }
    }, [authCheck, navigate, pathname]);

    // Show modern loading state
    if (authCheck.isLoading) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
};


export default AuthLayout;