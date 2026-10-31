import { request } from './http';


export function createService(form) {
    return request('/services', { method: 'POST', auth: true, body: form, errorMessage: 'Не удалось добавить услугу' });
}

export function updateService(serviceId, form) {
    return request(`/services/${serviceId}`, { method: 'PUT', auth: true, body: form, errorMessage: 'Не удалось сохранить услугу' });
}

export function deleteService(serviceId) {
    return request(`/services/${serviceId}`, { method: 'DELETE', auth: true, errorMessage: 'Не удалось удалить услугу' });
}

export function addCategory(name, description) {
    return request('/categories', {
        method: 'POST',
        auth: true,
        body: { category_name: name, category_description: description },
        errorMessage: 'Не удалось добавить категорию',
    });
}

export function updateCategory(categoryId, name, description) {
    return request(`/categories/${categoryId}`, {
        method: 'PUT',
        auth: true,
        body: { category_name: name, category_description: description },
        errorMessage: 'Не удалось сохранить категорию',
    });
}

export function deleteCategory(categoryId) {
    return request(`/categories/${categoryId}`, { method: 'DELETE', auth: true, errorMessage: 'Не удалось удалить категорию' });
}

export function getUsers() {
    return request('/users', { auth: true, errorMessage: 'Не удалось загрузить пользователей' });
}

export function updateUser(userId, form) {
    return request(`/users/${userId}`, { method: 'PUT', auth: true, body: form, errorMessage: 'Не удалось сохранить данные' });
}

export function setUserDiscount(userId, discount) {
    return request(`/users/${userId}/discount`, { method: 'PUT', auth: true, body: { discount }, errorMessage: 'Не удалось сохранить скидку' });
}

export function deleteUser(userId) {
    return request(`/users/${userId}`, { method: 'DELETE', auth: true, errorMessage: 'Не удалось удалить пользователя' });
}

export function getAdminOrders() {
    return request('/admin/orders', { auth: true, errorMessage: 'Не удалось загрузить заказы' });
}

export function updateAdminOrder(orderId, form) {
    return request(`/admin/orders/${orderId}`, { method: 'PUT', auth: true, body: form, errorMessage: 'Не удалось сохранить заказ' });
}

export function deleteAdminOrder(orderId) {
    return request(`/admin/orders/${orderId}`, { method: 'DELETE', auth: true, errorMessage: 'Не удалось удалить заказ' });
}

export function getAdminReviews() {
    return request('/admin/reviews', { auth: true, errorMessage: 'Не удалось загрузить отзывы' });
}
