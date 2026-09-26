import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StaffAuthProvider } from './context/StaffAuthContext.js';
import { MerchantDirectoryPage } from './pages/MerchantDirectoryPage.js';
import { CustomerEngagementPage } from './pages/CustomerEngagementPage.js';
import { StaffLoginPage } from './pages/StaffLoginPage.js';
import { StaffTerminalPage } from './pages/StaffTerminalPage.js';

export default function App() {
  return (
    <StaffAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing & Merchant Showcase */}
          <Route path="/" element={<MerchantDirectoryPage />} />

          {/* Customer Routes (Section 31 & Master Spec) */}
          {/* Combined Suite */}
          <Route path="/c/:slug/v" element={<CustomerEngagementPage routeModule="combined" />} />
          <Route path="/c/:slug" element={<CustomerEngagementPage routeModule="combined" />} />

          {/* Spin + Review Custom Tier */}
          <Route path="/c/:slug/spin-review" element={<CustomerEngagementPage routeModule="spin-review" />} />

          {/* Loyalty + Review Custom Tier */}
          <Route path="/c/:slug/loyalty-review" element={<CustomerEngagementPage routeModule="loyalty-review" />} />

          {/* Spin & Win Standalone */}
          <Route path="/c/:slug/spin" element={<CustomerEngagementPage routeModule="spin" />} />

          {/* Digital Loyalty Standalone */}
          <Route path="/c/:slug/loyalty" element={<CustomerEngagementPage routeModule="loyalty" />} />

          {/* AI Google Review Booster Standalone */}
          <Route path="/review/:slug" element={<CustomerEngagementPage routeModule="review" />} />

          {/* Staff Routes */}
          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route path="/staff/terminal" element={<StaffTerminalPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StaffAuthProvider>
  );
}
