import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6">
            <div className="bg-surface p-10 rounded-2xl border border-border shadow-md text-center max-w-md">
                <h1 className="text-3xl font-light text-red-500 mb-4">Access Denied</h1>
                <p className="text-secondary-text mb-8">
                    You do not have permission to view this page. If you are a department staff applicant, your request might still be pending admin approval.
                </p>
                <Link to="/dashboard" className="bg-primary-accent text-surface px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default Unauthorized;

