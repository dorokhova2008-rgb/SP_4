import { useState, useRef, useEffect } from 'react';
 export function useNotice() {
    const [notice, setNotice] = useState(null);
    const timer = useRef(null);

    useEffect(() => {
        return () => clearTimeout(timer.current);
    }, []);

    function showNotice(type, text) {
        clearTimeout(timer.current);
        setNotice({ type, text });
        timer.current = setTimeout(() => setNotice(null), 3500);
    }

    return [notice, showNotice];
}
