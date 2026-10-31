 export const API_URL = 'http://localhost:3001/api';
export const TOKEN_KEY = 'token';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}
  export async function request(path, { method = 'GET', body, auth = false, errorMessage = 'Ошибка запроса' } = {}) {
    const headers = {};
    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }
    if (auth) {
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        if (response.status === 401 && auth) {
            window.dispatchEvent(new Event('auth-expired'));
        }
        let message = errorMessage;
        try {
            const data = await response.json();
            if (data.error) message = data.error;
        } catch {
            message = errorMessage;
        }
        throw new Error(message);
    }

    return await response.json();
}
