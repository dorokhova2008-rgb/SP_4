import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { forgotPasswordRequest } from '../api/auth';
import {
    validateEmail, validateFullName, validatePhone, validateNewPassword,
    normalizeSpaces, getNetworkMessage
} from '../utils/validation';
 export default function Login() {
    const { login, register, logout, notice, clearNotice } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state && location.state.from;
    const infoMessage = location.state && location.state.message;

    const [mode, setMode] = useState((location.state && location.state.mode) || 'login');
     useEffect(() => {
        if (location.state && location.state.logout) {
            logout();
        }
     }, []);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [resetLink, setResetLink] = useState(null);
    const [loading, setLoading] = useState(false);
     function changeMode(newMode) {
        setMode(newMode);
        setErrors({});
        setServerError(null);
        setSuccess(null);
        setResetLink(null);
        setPassword('');
        setConfirm('');
        clearNotice();
    }
     function validate() {
        const newErrors = {};

        if (mode === 'register') {
            const nameError = validateFullName(name);
            if (nameError) newErrors.name = nameError;
        }

        const emailError = validateEmail(email);
        if (emailError) newErrors.email = emailError;

        if (mode === 'register') {
            const phoneError = validatePhone(phone);
            if (phoneError) newErrors.phone = phoneError;
        }

        if (mode === 'login' && !password) {
            newErrors.password = 'Введите пароль';
        }

        if (mode === 'register') {
            const passwordError = validateNewPassword(password);
            if (passwordError) newErrors.password = passwordError;
            if (confirm !== password) {
                newErrors.confirm = 'Пароли не совпадают';
            }
        }

        return newErrors;
    }
     async function handleSubmit(e) {
        e.preventDefault();
        setServerError(null);
        setSuccess(null);
        setResetLink(null);
        clearNotice();

        const newErrors = validate();
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            setLoading(true);

            if (mode === 'login') {
                const user = await login(email.trim(), password);
                navigate(from || (user.role_name === 'admin' ? '/admin' : '/'), { replace: true });
            } else if (mode === 'register') {
                await register({
                    name: normalizeSpaces(name),
                    email: email.trim(),
                    password,
                    phone: phone.trim()
                });
                navigate(from || '/', { replace: true });
            } else {
                const data = await forgotPasswordRequest(email.trim());
                setSuccess(data.message);
                if (data.reset_link) setResetLink(data.reset_link);
            }
        } catch (err) {
            console.error(err);
            setServerError(getNetworkMessage(err));
        } finally {
            setLoading(false);
        }
    }

    const titles = {
        login: 'Вход в аккаунт',
        register: 'Регистрация',
        forgot: 'Восстановление пароля'
    };

    const buttons = {
        login: 'Войти',
        register: 'Зарегистрироваться',
        forgot: 'Получить ссылку для смены пароля'
    };

    return (
        <div className="login-box">
            <h2 className="center">{titles[mode]}</h2>

            {mode === 'forgot' && (
                <p className="muted center">
                    Укажите адрес электронной почты, с которым вы регистрировались. Мы отправим ссылку, по которой можно задать новый пароль.
                </p>
            )}

            {infoMessage && mode === 'login' && <div className="alert alert-info">{infoMessage}</div>}
            {notice && <div className="alert alert-info">{notice}</div>}

            <form onSubmit={handleSubmit} noValidate>
                {mode === 'register' && (
                    <label className="field">
                        <span>Полное имя</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Например: Иван Петров"
                            className={errors.name ? 'invalid' : ''}
                            maxLength={100}
                        />
                        {errors.name && <span className="field-error">{errors.name}</span>}
                    </label>
                )}

                <label className="field">
                    <span>Электронная почта</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Введите адрес электронной почты"
                        className={errors.email ? 'invalid' : ''}
                        maxLength={100}
                    />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                </label>

                {mode === 'register' && (
                    <label className="field">
                        <span>Телефон</span>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+7 900 123-45-67"
                            className={errors.phone ? 'invalid' : ''}
                            maxLength={20}
                        />
                        {errors.phone && <span className="field-error">{errors.phone}</span>}
                    </label>
                )}

                {mode !== 'forgot' && (
                    <label className="field">
                        <span>Пароль</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={mode === 'register' ? 'От 6 до 50 символов, без пробелов' : 'Введите пароль'}
                            className={errors.password ? 'invalid' : ''}
                            maxLength={50}
                        />
                        {errors.password && <span className="field-error">{errors.password}</span>}
                    </label>
                )}

                {mode === 'register' && (
                    <label className="field">
                        <span>Повторите пароль</span>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Повторите пароль"
                            className={errors.confirm ? 'invalid' : ''}
                            maxLength={50}
                        />
                        {errors.confirm && <span className="field-error">{errors.confirm}</span>}
                    </label>
                )}

                {serverError && <div className="alert alert-error">{serverError}</div>}
                {serverError && mode === 'login' && (
                    <p className="muted">
                        Не помните пароль?{' '}
                        <button type="button" className="link-btn" onClick={() => changeMode('forgot')}>
                            Восстановить пароль
                        </button>
                    </p>
                )}
                {success && <div className="alert alert-success">{success}</div>}
                {resetLink && (
                    <div className="alert alert-info">
                        Учебный режим: письмо не отправляется. Ссылка для смены пароля:
                        <br />
                        <a href={resetLink}>Сменить пароль</a>
                    </div>
                )}

                <button type="submit" className="btn btn-primary btn-wide" disabled={loading}>
                    {loading ? 'Подождите...' : buttons[mode]}
                </button>
            </form>

            <div className="form-links">
                {mode === 'login' && (
                    <>
                        <p>Нет аккаунта? <button type="button" className="link-btn" onClick={() => changeMode('register')}>Зарегистрироваться</button></p>
                        <p>Забыли пароль? <button type="button" className="link-btn" onClick={() => changeMode('forgot')}>Восстановить</button></p>
                    </>
                )}
                {mode !== 'login' && (
                    <p>Уже есть аккаунт? <button type="button" className="link-btn" onClick={() => changeMode('login')}>Войти</button></p>
                )}
            </div>

            {mode === 'login' && (
                <div className="demo-accounts">
                    <strong>Тестовые учётные записи:</strong>
                    <div>Клиент: client@shop.ru, пароль client123</div>
                    <div>Администратор: admin@shop.ru, пароль admin123</div>
                </div>
            )}
        </div>
    );
}
