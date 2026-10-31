import { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import OrdersTab from './profile/OrdersTab';
import InfoTab from './profile/InfoTab';
import PasswordTab from './profile/PasswordTab';
 export default function Profile() {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const isAdmin = user.role_name === 'admin';

    const tabs = [
        ...(isAdmin ? [] : [{ key: 'orders', title: 'Мои заказы' }]),
        { key: 'info', title: 'Личные данные' },
        { key: 'password', title: 'Смена пароля' },
    ];
     const requestedTab = location.state && location.state.tab;
    const [tab, setTab] = useState(tabs.some(item => item.key === requestedTab) ? requestedTab : tabs[0].key);
    const message = location.state && location.state.message;

    return (
        <div className="profile">
            <h1>Личный кабинет</h1>

            <div className="nav-buttons">
                <Link to="/" className="btn btn-ghost">В каталог</Link>
                <Link to="/reviews" className="btn btn-ghost">Отзывы</Link>
                {!isAdmin && <Link to="/cart" className="btn btn-ghost">В корзину</Link>}
                {isAdmin && <Link to="/admin" className="btn btn-ghost">В админ-панель</Link>}
            </div>

            {message && <div className="alert alert-success">{message}</div>}

            <div className="tabs">
                {tabs.map(item => (
                    <button
                        key={item.key}
                        className={tab === item.key ? 'tab active' : 'tab'}
                        onClick={() => setTab(item.key)}
                    >
                        {item.title}
                    </button>
                ))}
            </div>

            {tab === 'orders' && <OrdersTab />}
            {tab === 'info' && <InfoTab />}
            {tab === 'password' && <PasswordTab />}
        </div>
    );
}
