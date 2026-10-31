import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
 export default function QuickLinks() {
    const { user } = useContext(AuthContext);
    const { getCartItemsCount } = useContext(CartContext);

    if (!user) {
        return (
            <div className="quick-links">
                <Link to="/login" className="btn btn-primary">Войти</Link>
                <Link to="/login" state={{ mode: 'register' }} className="btn btn-primary">Зарегистрироваться</Link>
                <Link to="/reviews" className="btn btn-ghost">Читать отзывы</Link>
            </div>
        );
    }

    if (user.role_name === 'admin') {
        return (
            <div className="quick-links">
                <Link to="/admin" state={{ tab: 'services' }} className="btn btn-primary">Управление услугами</Link>
                <Link to="/admin" state={{ tab: 'orders' }} className="btn btn-primary">Заказы клиентов</Link>
                <Link to="/admin" state={{ tab: 'reviews' }} className="btn btn-primary">Модерация отзывов</Link>
                <Link to="/admin" state={{ tab: 'users' }} className="btn btn-ghost">Пользователи и скидки</Link>
            </div>
        );
    }

    return (
        <div className="quick-links">
            <Link to="/cart" className="btn btn-primary">Корзина ({getCartItemsCount()})</Link>
            <Link to="/profile" state={{ tab: 'orders' }} className="btn btn-primary">Мои заказы</Link>
            <Link to="/reviews" className="btn btn-primary">Отзывы</Link>
            <Link to="/profile" state={{ tab: 'info' }} className="btn btn-ghost">Личные данные</Link>
        </div>
    );
}
