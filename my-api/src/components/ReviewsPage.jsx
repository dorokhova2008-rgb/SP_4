import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getServices } from '../api/appointments';
import { getAllReviews } from '../api/reviews';
import { formatDate } from '../utils/price';
import { getNetworkMessage } from '../utils/validation';
import ReviewsModal from './ReviewsModal';
  export default function ReviewsPage() {
    const [services, setServices] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState('');
    const [modalService, setModalService] = useState(null);

    useEffect(() => {
        loadData();
    }, []);
     async function loadData(silent = false) {
        try {
            if (!silent) setLoading(true);
            const [servicesData, reviewsData] = await Promise.all([getServices(), getAllReviews()]);
            setServices(servicesData);
            setReviews(reviewsData);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(getNetworkMessage(err));
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="state">Загрузка отзывов...</div>;
    if (error) {
        return (
            <div className="state state-error">
                <h2>{error}</h2>
                <button className="btn btn-primary" onClick={() => loadData()}>Попробовать снова</button>
            </div>
        );
    }

    const selectedService = services.find(s => s.service_name === selected);
    const visibleReviews = selected ? reviews.filter(r => r.service_name === selected) : reviews;

    return (
        <div className="reviews-page">
            <h1>Отзывы клиентов</h1>

            <div className="panel">
                <h2>Выберите услугу</h2>
                <p className="muted">Выберите услугу, чтобы посмотреть отзывы только о ней или написать свой отзыв.</p>

                <div className="reviews-toolbar">
                    <select value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Услуга">
                        <option value="">Все услуги</option>
                        {services.map(service => (
                            <option key={service.service_name} value={service.service_name}>
                                {service.service_name}
                            </option>
                        ))}
                    </select>

                    <button
                        className="btn btn-primary"
                        onClick={() => setModalService(selectedService)}
                        disabled={!selectedService}
                    >
                        Написать отзыв
                    </button>
                    <Link to="/" className="btn btn-ghost">Перейти в каталог</Link>
                </div>

                {!selectedService && (
                    <p className="muted">Чтобы написать отзыв, сначала выберите конкретную услугу в списке.</p>
                )}
                {selectedService && (
                    <p>
                        {selectedService.reviews_count > 0
                            ? `Средняя оценка: ${selectedService.rating_avg} из 5 (отзывов: ${selectedService.reviews_count})`
                            : 'У этой услуги пока нет отзывов. Станьте первым!'}
                    </p>
                )}
            </div>

            {visibleReviews.length === 0 && <p className="muted">Отзывов пока нет.</p>}

            {visibleReviews.map(review => (
                <div key={review.review_id} className="panel review-card">
                    <div className="review-head">
                        <strong>{review.service_name}</strong>
                        <span className="muted">{formatDate(review.review_date)}</span>
                    </div>
                    <div className="review-rating">Оценка: {review.rating} из 5</div>
                    <p className="review-text">{review.review_text}</p>
                    <p className="muted">Автор: {review.user_name}</p>
                </div>
            ))}

            {modalService && (
                <ReviewsModal
                    service={modalService}
                    onClose={() => setModalService(null)}
                    onChanged={() => loadData(true)}
                />
            )}
        </div>
    );
}
