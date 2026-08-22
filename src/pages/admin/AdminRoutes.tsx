import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import PageSkeleton from "@/components/PageSkeleton";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import { AuthProvider } from "@/hooks/useAdminAuth";

const AdminLogin = lazy(() => import("./Login"));
const AdminDashboard = lazy(() => import("./Dashboard"));
const AdminOrders = lazy(() => import("./Orders"));
const AdminServices = lazy(() => import("./Services"));
const AdminTestimonials = lazy(() => import("./Testimonials"));
const AdminFaqs = lazy(() => import("./Faqs"));
const AdminReports = lazy(() => import("./Reports"));
const AdminPromos = lazy(() => import("./Promos"));
const AdminAuditLog = lazy(() => import("./AuditLog"));
const AdminGaransi = lazy(() => import("./Garansi"));

const AdminRoutes = () => (
  <AuthProvider>
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route path="" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
        <Route path="services" element={<ProtectedRoute><AdminServices /></ProtectedRoute>} />
        <Route path="testimonials" element={<ProtectedRoute><AdminTestimonials /></ProtectedRoute>} />
        <Route path="faqs" element={<ProtectedRoute><AdminFaqs /></ProtectedRoute>} />
        <Route path="promos" element={<ProtectedRoute><AdminPromos /></ProtectedRoute>} />
        <Route path="audit" element={<ProtectedRoute><AdminAuditLog /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
        <Route path="garansi" element={<ProtectedRoute><AdminGaransi /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  </AuthProvider>
);

export default AdminRoutes;
