export function calcPrice(price, serviceDiscount = 0, personalDiscount = 0) {
    let result = Number(price);
    if (serviceDiscount > 0) result = result - (result * serviceDiscount / 100);
    if (personalDiscount > 0) result = result - (result * personalDiscount / 100);
    return Math.round(result * 100) / 100;
}

export function formatPrice(value) {
    return Number(value).toLocaleString('ru-RU') + ' ₽';
}

export const COUPON_TYPES = [
    { value: 0, name: 'Без купона' },
    { value: 5, name: 'Бронзовый' },
    { value: 10, name: 'Серебряный' },
    { value: 15, name: 'Золотой' },
    { value: 20, name: 'Платиновый' },
];

export function getCouponName(discount) {
    const coupon = COUPON_TYPES.find(c => c.value === discount);
    return coupon ? coupon.name : `Купон ${discount}%`;
}

export function getRoleName(role) {
    if (role === 'admin') return 'Администратор';
    if (role === 'client') return 'Клиент';
    return role;
}

export const ORDER_STATUSES = ['Новый', 'В обработке', 'Доставлен', 'Отменён'];
 export function formatDate(value) {
    if (!value) return '';
    const [year, month, day] = String(value).slice(0, 10).split('-');
    return `${day}.${month}.${year}`;
}
 export function formatDateTime(value) {
    if (!value) return '';
    return `${formatDate(value)} ${String(value).slice(11, 16)}`;
}
 export function formatPhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length !== 11) return value || '';
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}
