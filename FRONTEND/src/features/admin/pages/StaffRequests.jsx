import React, { useState } from 'react';
import StaffRequestTable from '../components/StaffRequestTable';
import StaffRequestReviewModal from '../components/StaffRequestReviewModal';

const StaffRequests = () => {
   const [modal, setModal] = useState({ mode: null, request: null });
   const [toast, setToast] = useState('');
   const [refreshKey, setRefreshKey] = useState(0);

   const showToast = (message) => {
      setToast(message);
      setTimeout(() => setToast(''), 3500);
   };

   const handleApprove = (request) => setModal({ mode: 'approve', request });
   const handleReject = (request) => setModal({ mode: 'reject', request });
   const handleClose = () => setModal({ mode: null, request: null });

   const handleSuccess = (message) => {
      handleClose();
      showToast(message);
      setRefreshKey((k) => k + 1); // trigger table refetch
   };

   return (
      <div className="min-h-[calc(100vh-4rem)] bg-background font-sans">
         <div className="max-w-7xl mx-auto px-6 py-10">
            {/* Page Header */}
            <div className="mb-8">
               <h1 className="text-3xl font-light tracking-tight text-primary-text">Staff Requests</h1>
               <p className="text-secondary-text text-sm mt-1.5">
                  Review and manage department staff access requests.
               </p>
            </div>

            {/* Toast notification */}
            {toast && (
               <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-3">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {toast}
               </div>
            )}

            {/* Table */}
            <StaffRequestTable
               onApprove={handleApprove}
               onReject={handleReject}
               refreshKey={refreshKey}
            />
         </div>

         {/* Review Modal */}
         <StaffRequestReviewModal
            mode={modal.mode}
            request={modal.request}
            onClose={handleClose}
            onSuccess={handleSuccess}
         />
      </div>
   );
};

export default StaffRequests;