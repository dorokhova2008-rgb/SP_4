import { useState, useEffect } from 'react';
import { getUsers, updateUser, setUserDiscount, deleteUser } from '../../api/admin';
import { COUPON_TYPES, getRoleName, formatPhone } from '../../utils/price';
import {
    validateFullName, validateEmail, validatePhone, validateAddress,
    normalizeSpaces, getNetworkMessage
} from '../../utils/validation';
import { useNotice } from '../../utils/useNotice';
import Toast from '../Toast';
 export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [notice, showNotice] = useNotice();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setUsers(await getUsers());
            setError(null);
        } catch (err) {
            console.error(err);
            setError(getNetworkMessage(err));
        } finally {
            setLoading(false);
        }
    }
     async function handleDiscount(user, discount) {
        try {
            await setUserDiscount(user.user_id, discount);
            await loadData();
            showNotice('success', `Пользователю ${user.user_name} назначена скидка ${discount}%`);
        } catch (err) {
            console.error(err);
            showNotice('error', getNetworkMessage(err));
        }
    }

    function startEdit(user) {
        setEditing(user);
        setErrors({});
        setForm({
            name: user.user_name,
            email: user.email,
            phone: formatPhone(user.phone),
            address: user.default_address || ''
        });
    }
     async function handleSubmit(e) {
        e.preventDefault();

        const newErrors = {};
        const nameError = validateFullName(form.name);
        if (nameError) newErrors.name = nameError;
        const emailError = validateEmail(form.email);
        if (emailError) newErrors.email = emailError;
        const phoneError = validatePhone(form.phone);
        if (phoneError) newErrors.phone = phoneError;
        const addressError = validateAddress(form.address, false);
        if (addressError) newErrors.address = addressError;
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            setSaving(true);
            await updateUser(editing.user_id, {
                user_name: normalizeSpaces(form.name),
                email: form.email.trim(),
                phone: form.phone.trim(),
                default_address: normalizeSpaces(form.address)
            });
            setEditing(null);
            await loadData();
            showNotice('success', 'Данные пользователя сохранены');
        } catch (err) {
            console.error(err);
            setErrors({ common: getNetworkMessage(err) });
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(user) {
        if (!window.confirm(`Удалить пользователя ${user.user_name}? Его заказы, корзина и отзывы тоже будут удалены.`)) return;
        try {
            await deleteUser(user.user_id);
            await loadData();
            showNotice('success', 'Пользователь удалён');
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

    return (
        <section className="panel">
            <Toast notice={notice} />
            <h2>Пользователи и персональные скидки</h2>
            <p className="muted">Каждому клиенту назначается один из видов скидочных купонов. У администратора скидок нет.</p>

            {editing && (
                <form onSubmit={handleSubmit} noValidate className="edit-form">
                    <h3>Изменение данных: {editing.user_name}</h3>

                    <label className="field">
                        <span>Полное имя</span>
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={errors.name ? 'invalid' : ''} maxLength={100} />
                        {errors.name && <span className="field-error">{errors.name}</span>}
                    </label>
                    <label className="field">
                        <span>Электронная почта</span>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={errors.email ? 'invalid' : ''} maxLength={100} />
                        {errors.email && <span className="field-error">{errors.email}</span>}
                    </label>
                    <label className="field">
                        <span>Телефон</span>
                        <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={errors.phone ? 'invalid' : ''} maxLength={20} />
                        {errors.phone && <span className="field-error">{errors.phone}</span>}
                    </label>
                    <label className="field">
                        <span>Адрес по умолчанию</span>
                        <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={errors.address ? 'invalid' : ''} maxLength={200} />
                        {errors.address && <span className="field-error">{errors.address}</span>}
                    </label>

                    {errors.common && <div className="alert alert-error">{errors.common}</div>}

                    <div className="form-buttons">
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Отмена</button>
                    </div>
                </form>
            )}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Пользователь</th><th>Электронная почта</th><th>Телефон</th><th>Роль</th><th>Заказов</th><th>Купон</th><th></th></tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.user_id}>
                                <td>{u.user_name}</td>
                                <td>{u.email}</td>
                                <td>{formatPhone(u.phone)}</td>
                                <td>{getRoleName(u.role_name)}</td>
                                <td>{u.orders_count}</td>
                                <td>
                                    {u.role_name === 'admin' ? (
                                        <span className="muted">Не предусмотрен</span>
                                    ) : (
                                        <select value={u.personal_discount} onChange={(e) => handleDiscount(u, Number(e.target.value))}>
                                            {COUPON_TYPES.map(c => (
                                                <option key={c.value} value={c.value}>
                                                    {c.name}{c.value > 0 ? ` (−${c.value}%)` : ''}
                                                </option>
                                            ))}
                                            {!COUPON_TYPES.some(c => c.value === u.personal_discount) && (
                                                <option value={u.personal_discount}>Купон −{u.personal_discount}%</option>
                                            )}
                                        </select>
                                    )}
                                </td>
                                <td className="actions">
                                    <button className="btn btn-primary btn-small" onClick={() => startEdit(u)}>Изменить</button>
                                    {u.role_name !== 'admin' && (
                                        <button className="btn btn-danger btn-small" onClick={() => handleDelete(u)}>Удалить</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
