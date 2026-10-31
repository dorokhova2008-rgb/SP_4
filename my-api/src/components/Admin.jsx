import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AdminServices from './admin/AdminServices';
import AdminCategories from './admin/AdminCategories';
import AdminUsers from './admin/AdminUsers';
import AdminOrders from './admin/AdminOrders';
import AdminReviews from './admin/AdminReviews';

const TABS = [
    { key: 'services', title: 'Услуги' },
    { key: 'categories', title: 'Категории' },
    { key: 'users', title: 'Пользователи' },
    { key: 'orders', title: 'Заказы' },
    { key: 'reviews', title: 'Отзывы' },
];
 export default function Admin() {
    const location = useLocation();
    const requestedTab = location.state && location.state.tab;
    const [tab, setTab] = useState(TABS.some(item => item.key === requestedTab) ? requestedTab : 'services');

    return (
        <div className="admin">
            <h1>Админ-панель</h1>

            <div className="nav-buttons">
                <Link to="/" className="btn btn-ghost">В каталог</Link>
                <Link to="/reviews" className="btn btn-ghost">Страница отзывов</Link>
                <Link to="/profile" className="btn btn-ghost">Личный кабинет</Link>
            </div>

            <div className="tabs">
                {TABS.map(item => (
                    <button
                        key={item.key}
                        className={tab === item.key ? 'tab active' : 'tab'}
                        onClick={() => setTab(item.key)}
                    >
                        {item.title}
                    </button>
                ))}
            </div>

            {tab === 'services' && <AdminServices />}
            {tab === 'categories' && <AdminCategories />}
            {tab === 'users' && <AdminUsers />}
            {tab === 'orders' && <AdminOrders />}
            {tab === 'reviews' && <AdminReviews />}
        </div>
    );
}
