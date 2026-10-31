import { request } from './http';
 export function loginRequest(email, password) {
    return request('/login', {
        method: 'POST',
        body: { email, password },
        errorMessage: 'Ошибка авторизации',
    });
}
 export function registerRequest(form) {
    return request('/register', {
        method: 'POST',
        body: form,
        errorMessage: 'Ошибка регистрации',
    });
}
 export function forgotPasswordRequest(email) {
    return request('/forgot-password', {
        method: 'POST',
        body: { email },
        errorMessage: 'Не удалось отправить ссылку',
    });
}
 export function resetPasswordRequest(token, password) {
    return request('/reset-password', {
        method: 'POST',
        body: { token, password },
        errorMessage: 'Не удалось сменить пароль',
    });
}

export function getProfile() {
    return request('/profile', { auth: true, errorMessage: 'Не удалось загрузить профиль' });
}
 export function updateProfile(form) {
    return request('/profile', {
        method: 'PUT',
        auth: true,
        body: form,
        errorMessage: 'Не удалось сохранить данные',
    });
}
 export function changePassword(oldPassword, newPassword) {
    return request('/profile/password', {
        method: 'PUT',
        auth: true,
        body: { old_password: oldPassword, new_password: newPassword },
        errorMessage: 'Не удалось сменить пароль',
    });
}
