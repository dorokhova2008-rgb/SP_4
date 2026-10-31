import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { CartContext } from "./CartContext";
import { AuthContext } from "./AuthContext";
import { getCart, addToCart, removeFromCart, createOrder } from "../api/appointments";
 export function CartProvider({ children }) {
    const { user } = useContext(AuthContext);
    const userId = user && user.role_name === 'client' ? user.user_id : null;

    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(Boolean(userId));
    const [error, setError] = useState(null);
    const lastRequest = useRef(0);
      const loadCart = useCallback(async (silent = false) => {
        const requestId = ++lastRequest.current;
        if (!userId) {
            setCart([]);
            setError(null);
            setLoading(false);
            return;
        }
        try {
            if (!silent) setLoading(true);
            const data = await getCart();
            if (requestId !== lastRequest.current) return;
            setCart(data);
            setError(null);
        } catch (err) {
            if (requestId !== lastRequest.current) return;
            console.error(err);
            setError(err.message || "Не удалось загрузить корзину");
        } finally {
            if (requestId === lastRequest.current) setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    async function addItem(serviceId) {
        await addToCart(serviceId);
        await loadCart(true);
    }

    async function decreaseItem(serviceId) {
        await removeFromCart(serviceId, false);
        await loadCart(true);
    }

    async function removeItem(serviceId) {
        await removeFromCart(serviceId, true);
        await loadCart(true);
    }
     async function placeOrder(address, date) {
        const result = await createOrder(address, date);
        await loadCart(true);
        return result;
    }

    function getCartTotal() {
        return cart.reduce((total, item) => total + Number(item.total_price), 0);
    }

    function getCartItemsCount() {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }

    return (
        <CartContext.Provider value={{
            cart,
            loading,
            error,
            loadCart,
            addItem,
            decreaseItem,
            removeItem,
            placeOrder,
            getCartTotal,
            getCartItemsCount
        }}>
            {children}
        </CartContext.Provider>
    );
}
