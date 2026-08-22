import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CourseView from './pages/CourseView';
import AdminDashboard from './pages/AdminDashboard';
import ProfileSettings from './pages/ProfileSettings';
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
import Layout from './layouts/Layout';
import VulnLayout from './layouts/VulnLayout';
import { AuthProvider } from './context/AuthContext';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Academy Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="labs/sql-injection" element={<CourseView />} />
            </Route>

            {/* Vulnerable Apps Routes */}
            <Route path="/vuln" element={<VulnLayout />}>
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
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
