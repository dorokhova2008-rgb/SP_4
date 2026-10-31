import { request } from './http';
 export function getAllReviews() {
    return request('/reviews', { errorMessage: 'Не удалось загрузить отзывы' });
}
 export function getReviews(serviceId) {
    return request(`/services/${serviceId}/reviews`, { errorMessage: 'Не удалось загрузить отзывы' });
}

export function addReview(serviceId, rating, text) {
    return request('/reviews', {
        method: 'POST',
        auth: true,
        body: { service_id: serviceId, rating, review_text: text },
        errorMessage: 'Не удалось добавить отзыв',
    });
}

export function updateReview(reviewId, rating, text) {
    return request(`/reviews/${reviewId}`, {
        method: 'PUT',
        auth: true,
        body: { rating, review_text: text },
        errorMessage: 'Не удалось сохранить отзыв',
    });
}

export function deleteReview(reviewId) {
    return request(`/reviews/${reviewId}`, {
        method: 'DELETE',
        auth: true,
        errorMessage: 'Не удалось удалить отзыв',
    });
}
