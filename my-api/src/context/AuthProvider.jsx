import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { loginRequest, registerRequest, getProfile } from "../api/auth";
import { TOKEN_KEY } from "../api/http";
 function loadSavedUser() {
    try {
        const saved = localStorage.getItem("user");
        const token = localStorage.getItem(TOKEN_KEY);
        return saved && token ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}
 export function AuthProvider({ children }) {
    const [user, setUser] = useState(loadSavedUser);
    const [notice, setNotice] = useState(null);
    const userId = user ? user.user_id : null;

    function updateUser(newUser) {
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
    }

    function updateToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    }

    function logout() {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem(TOKEN_KEY);
    }

    async function login(email, password) {
        const data = await loginRequest(email, password);
        updateToken(data.token);
        updateUser(data.user);
        setNotice(null);
        return data.user;
    }

    async function register(form) {
        const data = await registerRequest(form);
        updateToken(data.token);
        updateUser(data.user);
        setNotice(null);
        return data.user;
    }
     useEffect(() => {
        if (!userId) return;
        getProfile()
            .then(profile => updateUser(profile))
            .catch(err => console.error(err));
    }, [userId]);
     useEffect(() => {
        function handleExpired() {
            logout();
            setNotice("Сеанс завершён. Войдите в аккаунт снова");
        }
        window.addEventListener("auth-expired", handleExpired);
        return () => window.removeEventListener("auth-expired", handleExpired);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            updateUser,
            updateToken,
            notice,
            clearNotice: () => setNotice(null)
        }}>
            {children}
        </AuthContext.Provider>
    );
}
