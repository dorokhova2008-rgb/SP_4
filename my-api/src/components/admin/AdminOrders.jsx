import { useState, useEffect } from 'react';
import { getAdminOrders, updateAdminOrder, deleteAdminOrder } from '../../api/admin';
import { ORDER_STATUSES, formatPrice, formatDateTime, formatPhone } from '../../utils/price';
import { validateAddress, validateDateFormat, normalizeSpaces, getNetworkMessage } from '../../utils/validation';
import { useNotice } from '../../utils/useNotice';
import Toast from '../Toast';
 function OrderCard({ order, onSave, onDelete }) {
    const [status, setStatus] = useState(order.order_status);
    const [address, setAddress] = useState(order.delivery_address);
    const [date, setDate] = useState(order.delivery_date);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
     async function handleSave(e) {
        e.preventDefault();

        const newErrors = {};
        const addressError = validateAddress(address);
        if (addressError) newErrors.address = addressError;
        const dateError = validateDateFormat(date);
        if (dateError) newErrors.date = dateError;
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setSaving(true);
        await onSave(order, { order_status: status, delivery_address: normalizeSpaces(address), delivery_date: date });
        setSaving(false);
    }

    return (
        <form onSubmit={handleSave} noValidate className="panel order">
            <div className="order-head">
                <h3>Заказ от {formatDateTime(order.created_at)}</h3>
                <strong>{formatPrice(order.total_price)}</strong>
            </div>

            <p>Клиент: {order.user_name}, {order.email}, {formatPhone(order.phone)}</p>
            <ul className="order-items">
                {order.items.map(item => (
                    <li key={item.service_name}>{item.service_name} — {item.quantity} шт., {formatPrice(item.total_price)}</li>
                ))}
            </ul>

            <div className="form-row">
                <label className="field">
                    <span>Статус</span>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </label>
                <label className="field grow">
                    <span>Адрес доставки</span>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={errors.address ? 'invalid' : ''} maxLength={200} />
                    {errors.address && <span className="field-error">{errors.address}</span>}
                </label>
                <label className="field">
                    <span>Дата доставки</span>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={errors.date ? 'invalid' : ''} />
                    {errors.date && <span className="field-error">{errors.date}</span>}
                </label>
            </div>

            <div className="form-buttons">
                <button type="submit" className="btn btn-primary btn-small" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
                <button type="button" className="btn btn-danger btn-small" onClick={() => onDelete(order)}>Удалить заказ</button>
            </div>
        </form>
    );
}
 export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notice, showNotice] = useNotice();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setOrders(await getAdminOrders());
            setError(null);
        } catch (err) {
            console.error(err);
            setError(getNetworkMessage(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(order, form) {
        try {
            await updateAdminOrder(order.order_id, form);
            await loadData();
            showNotice('success', 'Заказ сохранён');
        } catch (err) {
            console.error(err);
            showNotice('error', getNetworkMessage(err));
        }
    }

    async function handleDelete(order) {
        if (!window.confirm('Удалить этот заказ полностью?')) return;
        try {
            await deleteAdminOrder(order.order_id);
            await loadData();
            showNotice('success', 'Заказ удалён');
        } catch (err) {
            console.error(err);
            showNotice('error', getNetworkMessage(err));
        }
    }

    if (loading) return <div className="state">Загрузка заказов...</div>;
    if (error) {
        return (
            <div className="state state-error">
                <h2>{error}</h2>
                <button className="btn btn-primary" onClick={loadData}>Попробовать снова</button>
            </div>
        );
    }

    return (
        <div>
            <Toast notice={notice} />
            <h2>Заказы</h2>
            {orders.length === 0 && <p className="muted">Заказов пока нет.</p>}
            {orders.map(order => (
                <OrderCard key={order.order_id} order={order} onSave={handleSave} onDelete={handleDelete} />
            ))}
        </div>
    );
}
