import { useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeContext } from './context/ThemeContext';
import { ThemeProvider } from './context/ThemeProvider';
import { AuthProvider } from './context/AuthProvider';
import { CartProvider } from './context/CartProvider';
import Menu from './components/Menu';
import RequireAuth from './components/RequireAuth';
import AppointmentsList from './components/AppointmentsList';
import Cart from './components/Cart';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import ReviewsPage from './components/ReviewsPage';
import Admin from './components/Admin';
import NotFound from './components/NotFound';
 function AppContent() {
    const { theme } = useContext(ThemeContext);

    return (
        <div className={`app app-${theme}`}>
            <BrowserRouter>
                <Menu />
                <main className="page">
                    <Routes>
                        <Route path="/" element={<AppointmentsList />} />
                        <Route path="/reviews" element={<ReviewsPage />} />
                        <Route path="/cart" element={<RequireAuth role="client"><Cart /></RequireAuth>} />
                        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                        <Route path="/admin" element={<RequireAuth role="admin"><Admin /></RequireAuth>} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>
            </BrowserRouter>
        </div>
    );
}
 export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <CartProvider>
                    <AppContent />
                </CartProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
