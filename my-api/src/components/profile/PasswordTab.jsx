import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { changePassword } from '../../api/auth';
import { validateNewPassword, getNetworkMessage } from '../../utils/validation';
 export default function PasswordTab() {
    const { updateToken } = useContext(AuthContext);
    const navigate = useNavigate();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [saving, setSaving] = useState(false);
     async function handleSubmit(e) {
        e.preventDefault();
        setServerError(null);
        setSuccess(null);

        const newErrors = {};
        if (!oldPassword) newErrors.old = 'Введите текущий пароль';
        const passwordError = validateNewPassword(newPassword);
        if (passwordError) newErrors.new = passwordError;
        else if (newPassword === oldPassword) newErrors.new = 'Новый пароль должен отличаться от текущего';
        if (confirm !== newPassword) newErrors.confirm = 'Пароли не совпадают';
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            setSaving(true);
            const result = await changePassword(oldPassword, newPassword);
            updateToken(result.token);
            setOldPassword('');
            setNewPassword('');
            setConfirm('');
            setSuccess(result.message);
        } catch (err) {
            console.error(err);
            setServerError(getNetworkMessage(err));
        } finally {
            setSaving(false);
        }
    }
     function handleForgot() {
        navigate('/login', { state: { mode: 'forgot', logout: true } });
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="panel form-narrow">
            <h2>Смена пароля</h2>

            <label className="field">
                <span>Текущий пароль</span>
                <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className={errors.old ? 'invalid' : ''} maxLength={50} />
                {errors.old && <span className="field-error">{errors.old}</span>}
            </label>

            <label className="field">
                <span>Новый пароль</span>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="От 6 до 50 символов, без пробелов" className={errors.new ? 'invalid' : ''} maxLength={50} />
                {errors.new && <span className="field-error">{errors.new}</span>}
            </label>

            <label className="field">
                <span>Повторите новый пароль</span>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={errors.confirm ? 'invalid' : ''} maxLength={50} />
                {errors.confirm && <span className="field-error">{errors.confirm}</span>}
            </label>

            {serverError && <div className="alert alert-error">{serverError}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Сохранение...' : 'Сменить пароль'}
            </button>

            <p className="muted">
                Не помните текущий пароль?{' '}
                <button type="button" className="link-btn" onClick={handleForgot}>Выйти и восстановить пароль</button>
            </p>
        </form>
    );
}
