import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { formatPrice } from '../utils/price';
import { getServiceImage } from '../utils/images';
import {
    validateAddress, validateDeliveryDate, todayString, maxDeliveryString,
    normalizeSpaces, getNetworkMessage
} from '../utils/validation';
 export default function Cart() {
    const { user } = useContext(AuthContext);
    const { cart, loading, error, loadCart, addItem, decreaseItem, removeItem, placeOrder, getCartTotal } = useContext(CartContext);
    const navigate = useNavigate();

    const [actionError, setActionError] = useState(null);
    const [address, setAddress] = useState(user.default_address || '');
    const [date, setDate] = useState('');
    const [errors, setErrors] = useState({});
    const [paying, setPaying] = useState(false);
     async function runAction(action) {
        try {
            setActionError(null);
            await action();
        } catch (err) {
            console.error(err);
            setActionError(getNetworkMessage(err));
        }
    }
     async function handleOrder(e) {
        e.preventDefault();
        setActionError(null);

        const newErrors = {};
        const addressError = validateAddress(address);
        if (addressError) newErrors.address = addressError;
        const dateError = validateDeliveryDate(date);
        if (dateError) newErrors.date = dateError;
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            setPaying(true);
            const result = await placeOrder(normalizeSpaces(address), date);
            navigate('/profile', {
                state: { message: `Заказ оформлен на сумму ${formatPrice(result.total)}. Следить за ним можно в разделе «Мои заказы».` }
            });
        } catch (err) {
            console.error(err);
            setActionError(getNetworkMessage(err));
        } finally {
            setPaying(false);
        }
    }

    if (loading) return <div className="state">Загрузка корзины...</div>;
    if (error) {
        return (
            <div className="state state-error">
                <h2>{error}</h2>
                <button className="btn btn-primary" onClick={() => loadCart()}>Попробовать снова</button>
            </div>
        );
    }

    return (
        <div className="cart">
            <h1>Ваша корзина</h1>

            <div className="nav-buttons">
                <Link to="/" className="btn btn-ghost">Вернуться в каталог</Link>
                <Link to="/profile" state={{ tab: 'orders' }} className="btn btn-ghost">Мои заказы</Link>
                <Link to="/reviews" className="btn btn-ghost">Отзывы</Link>
            </div>

            {actionError && <div className="alert alert-error">{actionError}</div>}

            {cart.length === 0 ? (
                <div className="state">
                    <p>Корзина пуста. Добавьте что-нибудь из каталога.</p>
                    <Link to="/" className="btn btn-primary">Перейти в каталог</Link>
                </div>
            ) : (
                <div>
                    {cart.map(item => (
                        <div key={item.service_name} className="cart-item">
                            <div className="cart-thumb">
                                <img src={getServiceImage(item.service_name, item.category_name)} alt={item.service_name} />
                            </div>

                            <div className="cart-info">
                                <strong>{item.service_name}</strong>
                                <p className="muted">{item.service_description}</p>
                                <p className="muted">Длительность: {item.duration_minutes} мин. · {formatPrice(item.unit_price)} за 1 шт.</p>
                            </div>

                            <div className="qty">
                                <button className="btn btn-ghost btn-small" onClick={() => runAction(() => decreaseItem(item.service_id))} disabled={item.quantity <= 1} aria-label="Уменьшить количество">−</button>
                                <span className="qty-value">{item.quantity}</span>
                                <button className="btn btn-ghost btn-small" onClick={() => runAction(() => addItem(item.service_id))} aria-label="Увеличить количество">+</button>
                            </div>

                            <div className="cart-sum">{formatPrice(item.total_price)}</div>

                            <button className="btn btn-danger btn-small" onClick={() => runAction(() => removeItem(item.service_id))}>
                                Удалить
                            </button>
                        </div>
                    ))}

                    <div className="cart-total">
                        <span>Итого:</span>
                        <strong>{formatPrice(getCartTotal())}</strong>
                    </div>

                    <form onSubmit={handleOrder} noValidate className="panel order-form">
                        <h2>Оформление заказа</h2>

                        <label className="field">
                            <span>Адрес доставки</span>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Город, улица, дом"
                                className={errors.address ? 'invalid' : ''}
                                maxLength={200}
                            />
                            {errors.address && <span className="field-error">{errors.address}</span>}
                        </label>

                        <label className="field">
                            <span>Дата доставки</span>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={todayString()}
                                max={maxDeliveryString()}
                                className={errors.date ? 'invalid' : ''}
                            />
                            {errors.date && <span className="field-error">{errors.date}</span>}
                        </label>

                        <div className="cart-actions">
                            <button type="submit" className="btn btn-primary" disabled={paying}>
                                {paying ? 'Оформляем...' : 'Оформить заказ'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
