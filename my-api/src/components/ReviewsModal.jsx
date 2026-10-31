import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getReviews, addReview, updateReview, deleteReview } from '../api/reviews';
import { formatDate } from '../utils/price';
import { validateReview, normalizeSpaces, getNetworkMessage } from '../utils/validation';
  export default function ReviewsModal({ service, onClose, onChanged }) {
    const { user } = useContext(AuthContext);
    const isAdmin = user && user.role_name === 'admin';

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [editing, setEditing] = useState(null);
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [formError, setFormError] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadReviews();
     }, []);
     useEffect(() => {
        function handleKey(e) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    async function loadReviews() {
        try {
            setLoading(true);
            const data = await getReviews(service.service_id);
            setReviews(data);
            setLoadError(null);
        } catch (err) {
            console.error(err);
            setLoadError(getNetworkMessage(err));
        } finally {
            setLoading(false);
        }
    }

    const myReview = user ? reviews.find(r => r.user_id === user.user_id) : null;
    const showForm = user && (editing || !myReview);

    function startEdit(review) {
        setEditing(review);
        setRating(review.rating);
        setText(review.review_text);
        setFormError(null);
    }

    function cancelEdit() {
        setEditing(null);
        setRating(0);
        setText('');
        setFormError(null);
    }
     async function handleSubmit(e) {
        e.preventDefault();

        const problem = validateReview(rating, text);
        setFormError(problem);
        if (problem) return;

        try {
            setSaving(true);
            if (editing) {
                await updateReview(editing.review_id, rating, normalizeSpaces(text));
            } else {
                await addReview(service.service_id, rating, normalizeSpaces(text));
            }
            cancelEdit();
            await loadReviews();
            onChanged();
        } catch (err) {
            console.error(err);
            setFormError(getNetworkMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(review) {
        if (!window.confirm('Удалить этот отзыв?')) return;
        try {
            await deleteReview(review.review_id);
            if (editing && editing.review_id === review.review_id) cancelEdit();
            await loadReviews();
            onChanged();
        } catch (err) {
            console.error(err);
            setLoadError(getNetworkMessage(err));
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-label={`Отзывы: ${service.service_name}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>Отзывы: {service.service_name}</h2>
                    <button className="btn btn-ghost btn-small" onClick={onClose}>Закрыть</button>
                </div>

                {loading && <p className="muted">Загрузка отзывов...</p>}

                {loadError && (
                    <div className="alert alert-error">
                        {loadError}{' '}
                        <button className="link-btn" onClick={loadReviews}>Попробовать снова</button>
                    </div>
                )}

                {!loading && !loadError && reviews.length === 0 && (
                    <p className="muted">Отзывов пока нет. Станьте первым!</p>
                )}

                <div className="review-list">
                    {reviews.map(review => {
                        const canChange = user && (isAdmin || review.user_id === user.user_id);
                        return (
                            <div key={review.review_id} className="review">
                                <div className="review-head">
                                    <strong>{review.user_name}</strong>
                                    <span className="muted">{formatDate(review.review_date)}</span>
                                </div>
                                <div className="review-rating">Оценка: {review.rating} из 5</div>
                                <p className="review-text">{review.review_text}</p>
                                {canChange && (
                                    <div className="review-actions">
                                        <button className="link-btn" onClick={() => startEdit(review)}>Изменить</button>
                                        <button className="link-btn link-danger" onClick={() => handleDelete(review)}>Удалить</button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {!user && (
                    <div className="alert alert-info">
                        Оставлять отзывы могут только авторизованные пользователи.{' '}
                        <Link to="/login" state={{ from: '/', message: 'Чтобы оставить отзыв, войдите в аккаунт' }}>Войти</Link>
                    </div>
                )}

                {user && myReview && !editing && (
                    <p className="muted">Вы уже оставили отзыв на эту услугу. Его можно изменить или удалить.</p>
                )}

                {showForm && (
                    <form onSubmit={handleSubmit} noValidate className="review-form">
                        <h3>{editing ? 'Изменение отзыва' : 'Ваш отзыв'}</h3>

                        <fieldset className="rating-field">
                            <legend>Оценка</legend>
                            {[1, 2, 3, 4, 5].map(value => (
                                <label key={value} className="rating-option">
                                    <input
                                        type="radio"
                                        name="rating"
                                        value={value}
                                        checked={rating === value}
                                        onChange={() => setRating(value)}
                                    />
                                    {value}
                                </label>
                            ))}
                        </fieldset>

                        <label className="field">
                            <span>Комментарий</span>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Расскажите, как всё прошло"
                                rows={4}
                                maxLength={1000}
                                className={formError ? 'invalid' : ''}
                            />
                        </label>

                        {formError && <div className="field-error form-error">{formError}</div>}

                        <div className="form-buttons">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Сохранение...' : editing ? 'Сохранить' : 'Отправить отзыв'}
                            </button>
                            {editing && (
                                <button type="button" className="btn btn-ghost" onClick={cancelEdit}>Отмена</button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
