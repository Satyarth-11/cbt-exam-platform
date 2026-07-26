import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { RoleType } from '../types/auth';

interface RequireRoleProps {
  allowedRoles: RoleType[];
  children: JSX.Element;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const hasRole = user.roles.some((role) => allowedRoles.includes(role));

  if (!hasRole) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-slate-900 border border-red-500/30 rounded-2xl text-center space-y-4 shadow-xl">
        <h2 className="text-2xl font-bold text-red-400">Access Denied</h2>
        <p className="text-slate-300 text-sm">
          Your account role does not have permission to view this resource.
        </p>
      </div>
    );
  }

  return children;
};
