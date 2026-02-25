import { Route, Routes } from "react-router-dom";
import Homepage from "../pages/Homepage";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import AccountBalances from "../pages/AccountBalances";
import GoalsPage from "../pages/GoalsPage";
import TransactionsPage from "../pages/TransactionsPage";
import ChartPage from "../pages/ChartPage";
import PaymentPage from "../pages/PaymentPage";
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";
import Support from "../pages/Support";
import Blog from "../pages/Blog";
import BlogPost from "../pages/BlogPost";
import Guides from "../pages/Guides";
import GuideArticle from "../pages/GuideArticle";
import NotFound from "../pages/NotFound";

// Admin pages
import AdminLayout from "../pages/admin/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminRevenue from "../pages/admin/AdminRevenue";
import AdminVouchers from "../pages/admin/AdminVouchers";
import AdminPosts from "../pages/admin/AdminPosts";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/support" element={<Support />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/guides" element={<Guides />} />
      <Route path="/guides/:slug" element={<GuideArticle />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/accounts"
        element={
          <PrivateRoute>
            <AccountBalances />
          </PrivateRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <PrivateRoute>
            <GoalsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <PrivateRoute>
            <TransactionsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/chart"
        element={
          <PrivateRoute>
            <ChartPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/payment"
        element={
          <PrivateRoute>
            <PaymentPage />
          </PrivateRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="vouchers" element={<AdminVouchers />} />
        <Route path="posts" element={<AdminPosts />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
