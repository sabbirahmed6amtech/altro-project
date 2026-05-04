import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminGuard from './components/AdminGuard.jsx';
import AdminLayout from './admin/AdminLayout.jsx';

// Public pages
const Home = lazy(() => import('./pages/Home.jsx'));
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'));
const CategoryPage = lazy(() => import('./pages/CategoryPage.jsx'));
const Track = lazy(() => import('./pages/Track.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

// Admin pages
const AdminLogin = lazy(() => import('./pages/admin/Login.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const Orders = lazy(() => import('./pages/admin/Orders.jsx'));
const OrderDetail = lazy(() => import('./pages/admin/OrderDetail.jsx'));
const Products = lazy(() => import('./pages/admin/Products.jsx'));
const ProductForm = lazy(() => import('./pages/admin/ProductForm.jsx'));
const Customers = lazy(() => import('./pages/admin/Customers.jsx'));
const Settings = lazy(() => import('./pages/admin/Settings.jsx'));
const Coupons = lazy(() => import('./pages/admin/Coupons.jsx'));
const Banners = lazy(() => import('./pages/admin/Banners.jsx'));

function PageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-[#1a5c38] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedAdminRoute({ children }) {
  return (
    <AdminGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminGuard>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/track" element={<Track />} />

        {/* Admin auth */}
        <Route path="/admin" element={<AdminLogin />} />

        {/* Admin protected routes */}
        <Route
          path="/admin/dashboard"
          element={<ProtectedAdminRoute><Dashboard /></ProtectedAdminRoute>}
        />
        <Route
          path="/admin/orders"
          element={<ProtectedAdminRoute><Orders /></ProtectedAdminRoute>}
        />
        <Route
          path="/admin/orders/:id"
          element={<ProtectedAdminRoute><OrderDetail /></ProtectedAdminRoute>}
        />
        <Route
          path="/admin/products"
          element={<ProtectedAdminRoute><Products /></ProtectedAdminRoute>}
        />
        <Route
          path="/admin/products/new"
          element={<ProtectedAdminRoute><ProductForm /></ProtectedAdminRoute>}
        />
        <Route
          path="/admin/products/:id/edit"
          element={<ProtectedAdminRoute><ProductForm /></ProtectedAdminRoute>}
        />
        <Route
          path="/admin/customers"
          element={<ProtectedAdminRoute><Customers /></ProtectedAdminRoute>}
        />
        <Route
          path="/admin/settings"
          element={<ProtectedAdminRoute><Settings /></ProtectedAdminRoute>}
        />
        <Route
          path="/admin/coupons"
          element={<ProtectedAdminRoute><Coupons /></ProtectedAdminRoute>}
        />
        <Route
          path="/admin/banners"
          element={<ProtectedAdminRoute><Banners /></ProtectedAdminRoute>}
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
