import { request } from './http';
 export function getServices() {
    return request('/services', { errorMessage: 'Ошибка при получении данных' });
}

export function getCategories() {
    return request('/categories', { errorMessage: 'Ошибка при получении категорий' });
}
 export function getCart() {
    return request('/cart', { auth: true, errorMessage: 'Ошибка загрузки корзины' });
}

export function addToCart(serviceId) {
    return request('/cart', {
        method: 'POST',
        auth: true,
        body: { service_id: serviceId },
        errorMessage: 'Ошибка добавления в корзину',
    });
}
 export function removeFromCart(serviceId, removeAll = true) {
    return request(`/cart/${serviceId}${removeAll ? '' : '?one=true'}`, {
        method: 'DELETE',
        auth: true,
        errorMessage: 'Ошибка удаления',
    });
}
 export function createOrder(address, date) {
    return request('/orders', {
        method: 'POST',
        auth: true,
        body: { delivery_address: address, delivery_date: date },
        errorMessage: 'Ошибка оформления заказа',
    });
}

export function getOrders() {
    return request('/orders', { auth: true, errorMessage: 'Не удалось загрузить заказы' });
}

export function cancelOrder(orderId) {
    return request(`/orders/${orderId}/cancel`, {
        method: 'PUT',
        auth: true,
        errorMessage: 'Не удалось отменить заказ',
    });
}
