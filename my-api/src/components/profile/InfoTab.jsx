import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { updateProfile } from '../../api/auth';
import { formatPhone } from '../../utils/price';
import {
    validateFullName, validateEmail, validatePhone, validateAddress,
    normalizeSpaces, getNetworkMessage
} from '../../utils/validation';
 export default function InfoTab() {
    const { user, updateUser } = useContext(AuthContext);

    const [name, setName] = useState(user.user_name);
    const [email, setEmail] = useState(user.email);
    const [phone, setPhone] = useState(formatPhone(user.phone));
    const [address, setAddress] = useState(user.default_address || '');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [saving, setSaving] = useState(false);
     async function handleSubmit(e) {
        e.preventDefault();
        setServerError(null);
        setSuccess(null);

        const newErrors = {};
        const nameError = validateFullName(name);
        if (nameError) newErrors.name = nameError;
        const emailError = validateEmail(email);
        if (emailError) newErrors.email = emailError;
        const phoneError = validatePhone(phone);
        if (phoneError) newErrors.phone = phoneError;
        const addressError = validateAddress(address, false);
        if (addressError) newErrors.address = addressError;
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            setSaving(true);
            const updated = await updateProfile({
                user_name: normalizeSpaces(name),
                email: email.trim(),
                phone: phone.trim(),
                default_address: normalizeSpaces(address)
            });
            updateUser(updated);
            setName(updated.user_name);
            setEmail(updated.email);
            setPhone(formatPhone(updated.phone));
            setAddress(updated.default_address || '');
            setSuccess('Данные сохранены');
        } catch (err) {
            console.error(err);
            setServerError(getNetworkMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="panel form-narrow">
            <h2>Личные данные</h2>

            <label className="field">
                <span>Полное имя</span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={errors.name ? 'invalid' : ''} maxLength={100} />
                {errors.name && <span className="field-error">{errors.name}</span>}
            </label>

            <label className="field">
                <span>Электронная почта</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={errors.email ? 'invalid' : ''} maxLength={100} />
                {errors.email && <span className="field-error">{errors.email}</span>}
            </label>

            <label className="field">
                <span>Телефон</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 123-45-67" className={errors.phone ? 'invalid' : ''} maxLength={20} />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
            </label>

            {user.role_name !== 'admin' && (
                <label className="field">
                    <span>Адрес по умолчанию</span>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Город, улица, дом" className={errors.address ? 'invalid' : ''} maxLength={200} />
                    {errors.address && <span className="field-error">{errors.address}</span>}
                    <span className="muted">Этот адрес подставляется при оформлении заказа.</span>
                </label>
            )}

            {serverError && <div className="alert alert-error">{serverError}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
        </form>
    );
}
