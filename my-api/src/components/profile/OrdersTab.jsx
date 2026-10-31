import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, cancelOrder } from '../../api/appointments';
import { formatPrice, formatDate, formatDateTime } from '../../utils/price';
import { getNetworkMessage } from '../../utils/validation';
 function statusClass(status) {
    if (status === 'Доставлен') return 'status status-done';
    if (status === 'Отменён') return 'status status-cancel';
    if (status === 'В обработке') return 'status status-work';
    return 'status status-new';
}
 export default function OrdersTab() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        try {
            setLoading(true);
            const data = await getOrders();
            setOrders(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(getNetworkMessage(err));
        } finally {
            setLoading(false);
        }
    }
     async function handleCancel(order) {
        if (!window.confirm('Отменить этот заказ?')) return;
        try {
            setActionError(null);
            await cancelOrder(order.order_id);
            await loadOrders();
        } catch (err) {
            console.error(err);
            setActionError(getNetworkMessage(err));
        }
    }

    if (loading) return <div className="state">Загрузка заказов...</div>;
    if (error) {
        return (
            <div className="state state-error">
                <h2>{error}</h2>
                <button className="btn btn-primary" onClick={loadOrders}>Попробовать снова</button>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="state">
                <p>У вас пока нет заказов.</p>
                <Link to="/" className="btn btn-primary">Перейти в каталог</Link>
            </div>
        );
    }

    return (
        <div>
            {actionError && <div className="alert alert-error">{actionError}</div>}

            {orders.map(order => (
                <div key={order.order_id} className="panel order">
                    <div className="order-head">
                        <h3>Заказ от {formatDateTime(order.created_at)}</h3>
                        <span className={statusClass(order.order_status)}>{order.order_status}</span>
                    </div>

                    <p>Адрес доставки: {order.delivery_address}</p>
                    <p>Дата доставки: {formatDate(order.delivery_date)}</p>

                    <ul className="order-items">
                        {order.items.map(item => (
                            <li key={item.service_name}>
                                {item.service_name} — {item.quantity} шт., {formatPrice(item.total_price)}
                            </li>
                        ))}
                    </ul>

                    <div className="order-foot">
                        <strong>Итого: {formatPrice(order.total_price)}</strong>
                        {order.order_status === 'Новый' && (
                            <button className="btn btn-danger btn-small" onClick={() => handleCancel(order)}>
                                Отменить заказ
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
