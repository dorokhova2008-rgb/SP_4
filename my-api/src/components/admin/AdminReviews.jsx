import { useState, useEffect } from 'react';
import { getAdminReviews } from '../../api/admin';
import { updateReview, deleteReview } from '../../api/reviews';
import { formatDate } from '../../utils/price';
import { validateReview, normalizeSpaces, getNetworkMessage } from '../../utils/validation';
import { useNotice } from '../../utils/useNotice';
import Toast from '../Toast';
  export default function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null);
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [formError, setFormError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [notice, showNotice] = useNotice();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setReviews(await getAdminReviews());
            setError(null);
        } catch (err) {
            console.error(err);
            setError(getNetworkMessage(err));
        } finally {
            setLoading(false);
        }
    }

    function startEdit(review) {
        setEditing(review);
        setRating(review.rating);
        setText(review.review_text);
        setFormError(null);
    }
     async function handleSubmit(e) {
        e.preventDefault();

        const problem = validateReview(rating, text);
        setFormError(problem);
        if (problem) return;

        try {
            setSaving(true);
            await updateReview(editing.review_id, rating, normalizeSpaces(text));
            setEditing(null);
            await loadData();
            showNotice('success', 'Отзыв сохранён');
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
            if (editing && editing.review_id === review.review_id) setEditing(null);
            await loadData();
            showNotice('success', 'Отзыв удалён');
        } catch (err) {
            console.error(err);
            showNotice('error', getNetworkMessage(err));
        }
    }

    if (loading) return <div className="state">Загрузка отзывов...</div>;
    if (error) {
        return (
            <div className="state state-error">
                <h2>{error}</h2>
                <button className="btn btn-primary" onClick={loadData}>Попробовать снова</button>
            </div>
        );
    }

    return (
        <section className="panel">
            <Toast notice={notice} />
            <h2>Отзывы</h2>
            {reviews.length === 0 && <p className="muted">Отзывов пока нет.</p>}

            {editing && (
                <form onSubmit={handleSubmit} noValidate className="edit-form">
                    <h3>Изменение отзыва: {editing.service_name}, автор {editing.user_name}</h3>

                    <fieldset className="rating-field">
                        <legend>Оценка</legend>
                        {[1, 2, 3, 4, 5].map(value => (
                            <label key={value} className="rating-option">
                                <input type="radio" name="admin-rating" value={value} checked={rating === value} onChange={() => setRating(value)} />
                                {value}
                            </label>
                        ))}
                    </fieldset>

                    <label className="field">
                        <span>Комментарий</span>
                        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000} className={formError ? 'invalid' : ''} />
                    </label>
                    {formError && <div className="field-error form-error">{formError}</div>}

                    <div className="form-buttons">
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Отмена</button>
                    </div>
                </form>
            )}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Услуга</th><th>Автор</th><th>Оценка</th><th>Отзыв</th><th>Дата</th><th></th></tr>
                    </thead>
                    <tbody>
                        {reviews.map(r => (
                            <tr key={r.review_id}>
                                <td>{r.service_name}</td>
                                <td>{r.user_name}</td>
                                <td>{r.rating} из 5</td>
                                <td className="wrap">{r.review_text}</td>
                                <td>{formatDate(r.review_date)}</td>
                                <td className="actions">
                                    <button className="btn btn-primary btn-small" onClick={() => startEdit(r)}>Изменить</button>
                                    <button className="btn btn-danger btn-small" onClick={() => handleDelete(r)}>Удалить</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
