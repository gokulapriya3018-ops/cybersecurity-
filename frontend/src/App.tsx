import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import SQLiCourseView from './pages/SQLiCourseView';
import XSSCourseView from './pages/XSSCourseView';
import AdminSOCDashboard from './pages/AdminSOCDashboard';
import AdminStudentDossierPage from './pages/AdminStudentDossierPage';
import ProfileSettings from './pages/ProfileSettings';

// Import SQLi Labs
import SQLi01Login from './pages/vuln/SQLi01Login';
import SQLi02Search from './pages/vuln/SQLi02Search';
import SQLi03Details from './pages/vuln/SQLi03Details';
import SQLi04UserLookup from './pages/vuln/SQLi04UserLookup';
import SQLi05Filter from './pages/vuln/SQLi05Filter';
import SQLi06Api from './pages/vuln/SQLi06Api';
import SQLi07Cookie from './pages/vuln/SQLi07Cookie';
import SQLi08Order from './pages/vuln/SQLi08Order';
import SQLi09Header from './pages/vuln/SQLi09Header';
import SQLi10SecondOrder from './pages/vuln/SQLi10SecondOrder';

// Import XSS Labs
import XSS01Reflected from './pages/labs/XSS01Reflected';
import XSS02Stored from './pages/labs/XSS02Stored';
import XSS03Dom from './pages/labs/XSS03Dom';
import XSS04Attribute from './pages/labs/XSS04Attribute';
import XSS05Blacklist from './pages/labs/XSS05Blacklist';
import XSS06Api from './pages/labs/XSS06Api';
import XSS07Header from './pages/labs/XSS07Header';
import XSS08Csp from './pages/labs/XSS08Csp';
import XSS09Markdown from './pages/labs/XSS09Markdown';
import XSS10SecondOrder from './pages/labs/XSS10SecondOrder';
import ChainedFinalExam from './pages/vuln/ChainedFinalExam';

import Layout from './layouts/Layout';
import VulnLayout from './layouts/VulnLayout';
import { AuthProvider } from './context/AuthContext';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Academy Core Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="admin" element={<AdminSOCDashboard />} />
              <Route path="admin/operator/:id" element={<AdminStudentDossierPage />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="labs/sql-injection" element={<SQLiCourseView />} />
              <Route path="labs/xss" element={<XSSCourseView />} />
            </Route>

            {/* Vulnerable Apps Sandbox Context */}
            <Route path="/vuln" element={<VulnLayout />}>
              {/* SQL Injection Sandbox Routes */}
              <Route path="sqli-01" element={<SQLi01Login />} />
              <Route path="sqli-02" element={<SQLi02Search />} />
              <Route path="sqli-03" element={<SQLi03Details />} />
              <Route path="sqli-04" element={<SQLi04UserLookup />} />
              <Route path="sqli-05" element={<SQLi05Filter />} />
              <Route path="sqli-06" element={<SQLi06Api />} />
              <Route path="sqli-07" element={<SQLi07Cookie />} />
              <Route path="sqli-08" element={<SQLi08Order />} />
              <Route path="sqli-09" element={<SQLi09Header />} />
              <Route path="sqli-10" element={<SQLi10SecondOrder />} />

              {/* Cross-Site Scripting Sandbox Routes */}
              <Route path="xss-reflected" element={<XSS01Reflected />} />
              <Route path="xss-stored" element={<XSS02Stored />} />
              <Route path="xss-dom" element={<XSS03Dom />} />
              <Route path="xss-attribute" element={<XSS04Attribute />} />
              <Route path="xss-blacklist" element={<XSS05Blacklist />} />
              <Route path="xss-api" element={<XSS06Api />} />
              <Route path="xss-header" element={<XSS07Header />} />
              <Route path="xss-csp" element={<XSS08Csp />} />
              <Route path="xss-markdown" element={<XSS09Markdown />} />
              <Route path="xss-second-order" element={<XSS10SecondOrder />} />
              <Route path="chained-final-exam" element={<ChainedFinalExam />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
