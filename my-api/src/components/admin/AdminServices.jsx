import { useState, useEffect } from 'react';
import { getServices, getCategories } from '../../api/appointments';
import { createService, updateService, deleteService } from '../../api/admin';
import { calcPrice, formatPrice } from '../../utils/price';
import { MAX_DISCOUNT, validateService, normalizeSpaces, getNetworkMessage } from '../../utils/validation';
import { useNotice } from '../../utils/useNotice';
import Toast from '../Toast';

const EMPTY_FORM = {
    category_id: '',
    service_name: '',
    service_description: '',
    duration_minutes: '',
    price: '',
    service_discount: '0'
};
 export default function AdminServices() {
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [notice, showNotice] = useNotice();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [servicesData, categoriesData] = await Promise.all([getServices(), getCategories()]);
            setServices(servicesData);
            setCategories(categoriesData);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(getNetworkMessage(err));
        } finally {
            setLoading(false);
        }
    }

    function openCreate() {
        setEditingId(null);
        setErrors({});
        setForm({ ...EMPTY_FORM, category_id: categories.length > 0 ? String(categories[0].category_id) : '' });
    }

    function openEdit(service) {
        setEditingId(service.service_id);
        setErrors({});
        setForm({
            category_id: String(service.category_id),
            service_name: service.service_name,
            service_description: service.service_description || '',
            duration_minutes: String(service.duration_minutes),
            price: String(service.price),
            service_discount: String(service.service_discount)
        });
    }

    function closeForm() {
        setForm(null);
        setEditingId(null);
        setErrors({});
    }

    function setField(field, value) {
        setForm({ ...form, [field]: value });
    }
     async function handleSubmit(e) {
        e.preventDefault();

        const otherNames = services.filter(s => s.service_id !== editingId).map(s => s.service_name);
        const newErrors = validateService(form, otherNames);
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        const body = {
            category_id: Number(form.category_id),
            service_name: normalizeSpaces(form.service_name),
            service_description: normalizeSpaces(form.service_description),
            duration_minutes: Number(form.duration_minutes),
            price: Number(String(form.price).replace(',', '.')),
            service_discount: Number(form.service_discount)
        };

        try {
            setSaving(true);
            if (editingId) {
                await updateService(editingId, body);
            } else {
                await createService(body);
            }
            closeForm();
            await loadData();
            showNotice('success', editingId ? 'Услуга сохранена' : 'Услуга добавлена');
        } catch (err) {
            console.error(err);
            setErrors({ common: getNetworkMessage(err) });
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(service) {
        if (!window.confirm(`Удалить услугу «${service.service_name}»? Её отзывы и позиции в корзинах тоже будут удалены.`)) return;
        try {
            await deleteService(service.service_id);
            await loadData();
            showNotice('success', 'Услуга удалена');
        } catch (err) {
            console.error(err);
            showNotice('error', getNetworkMessage(err));
        }
    }

    if (loading) return <div className="state">Загрузка данных...</div>;
    if (error) {
        return (
            <div className="state state-error">
                <h2>{error}</h2>
                <button className="btn btn-primary" onClick={loadData}>Попробовать снова</button>
            </div>
        );
    }

    const saleCount = services.filter(s => s.service_discount > 0).length;
    const salePercent = services.length > 0 ? Math.round(saleCount * 100 / services.length) : 0;

    return (
        <section className="panel">
            <Toast notice={notice} />

            <div className="panel-head">
                <h2>Услуги</h2>
                <button className="btn btn-primary" onClick={openCreate} disabled={categories.length === 0}>Добавить услугу</button>
            </div>
            {categories.length === 0 && <p className="muted">Чтобы добавить услугу, сначала создайте категорию.</p>}
            <p className="muted">
                Со скидкой: {saleCount} из {services.length} услуг ({salePercent}%). Максимальная скидка — {MAX_DISCOUNT}%.
            </p>

            {form && (
                <form onSubmit={handleSubmit} noValidate className="edit-form">
                    <h3>{editingId ? 'Изменение услуги' : 'Новая услуга'}</h3>

                    <label className="field">
                        <span>Категория</span>
                        <select value={form.category_id} onChange={(e) => setField('category_id', e.target.value)} className={errors.category_id ? 'invalid' : ''}>
                            {categories.map(c => (
                                <option key={c.category_name} value={c.category_id}>{c.category_name}</option>
                            ))}
                        </select>
                        {errors.category_id && <span className="field-error">{errors.category_id}</span>}
                    </label>

                    <label className="field">
                        <span>Название</span>
                        <input type="text" value={form.service_name} onChange={(e) => setField('service_name', e.target.value)} className={errors.service_name ? 'invalid' : ''} maxLength={100} />
                        {errors.service_name && <span className="field-error">{errors.service_name}</span>}
                    </label>

                    <label className="field">
                        <span>Описание</span>
                        <textarea value={form.service_description} onChange={(e) => setField('service_description', e.target.value)} rows={3} className={errors.service_description ? 'invalid' : ''} maxLength={500} />
                        {errors.service_description && <span className="field-error">{errors.service_description}</span>}
                    </label>

                    <div className="form-row">
                        <label className="field">
                            <span>Длительность, мин.</span>
                            <input type="number" min="1" max="1440" step="1" value={form.duration_minutes} onChange={(e) => setField('duration_minutes', e.target.value)} className={errors.duration_minutes ? 'invalid' : ''} />
                            {errors.duration_minutes && <span className="field-error">{errors.duration_minutes}</span>}
                        </label>

                        <label className="field">
                            <span>Цена, ₽</span>
                            <input type="text" inputMode="decimal" value={form.price} onChange={(e) => setField('price', e.target.value)} className={errors.price ? 'invalid' : ''} />
                            {errors.price && <span className="field-error">{errors.price}</span>}
                        </label>

                        <label className="field">
                            <span>Скидка, % (до {MAX_DISCOUNT})</span>
                            <input type="number" min="0" max={MAX_DISCOUNT} step="1" value={form.service_discount} onChange={(e) => setField('service_discount', e.target.value)} className={errors.service_discount ? 'invalid' : ''} />
                            {errors.service_discount && <span className="field-error">{errors.service_discount}</span>}
                        </label>
                    </div>

                    {errors.common && <div className="alert alert-error">{errors.common}</div>}

                    <div className="form-buttons">
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
                        <button type="button" className="btn btn-ghost" onClick={closeForm}>Отмена</button>
                    </div>
                </form>
            )}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Название</th><th>Категория</th><th>Цена</th><th>Скидка</th><th>Цена со скидкой</th><th>Длительность</th><th></th></tr>
                    </thead>
                    <tbody>
                        {services.map(s => (
                            <tr key={s.service_id}>
                                <td>{s.service_name}</td>
                                <td>{s.category_name}</td>
                                <td>{formatPrice(s.price)}</td>
                                <td>{s.service_discount}%</td>
                                <td>{formatPrice(calcPrice(s.price, s.service_discount))}</td>
                                <td>{s.duration_minutes} мин.</td>
                                <td className="actions">
                                    <button className="btn btn-primary btn-small" onClick={() => openEdit(s)}>Изменить</button>
                                    <button className="btn btn-danger btn-small" onClick={() => handleDelete(s)}>Удалить</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
