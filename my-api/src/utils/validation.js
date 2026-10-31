  
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 50;
export const MAX_DISCOUNT = 50;
export const MAX_PRICE = 10000000;

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const WORD = '[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)*';
const FULL_NAME_REGEX = new RegExp(`^${WORD}(?: ${WORD})+$`);
const CATEGORY_REGEX = /^[А-Яа-яЁё0-9]+(?:[ -][А-Яа-яЁё0-9]+)*$/;

export function normalizeSpaces(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

export function makeKey(value) {
    return normalizeSpaces(value).toLowerCase().replace(/ё/g, 'е');
}

export function hasLatin(value) {
    return /[A-Za-z]/.test(value);
}

function hasCyrillic(value) {
    return /[А-Яа-яЁё]/.test(value);
}

export function isValidEmail(email) {
    const value = email.trim();
    return value.length <= 100 && EMAIL_REGEX.test(value);
}

export function validateEmail(email) {
    if (!email.trim()) return 'Введите адрес электронной почты';
    if (!isValidEmail(email)) return 'Введите корректный адрес электронной почты';
    return null;
}
 export function validateFullName(name) {
    const value = normalizeSpaces(name);
    if (!value) return 'Введите полное имя';
    if (!value.includes(' ')) return 'Введите полное имя: имя и фамилию через пробел';
    if (value.length < 5 || value.length > 100) return 'Полное имя должно содержать от 5 до 100 символов';
    if (!FULL_NAME_REGEX.test(value)) return 'Введите имя и фамилию русскими буквами (пробел и дефис допустимы)';
    return null;
}
 export function validatePhone(phone) {
    const raw = String(phone || '').trim();
    if (!raw) return 'Введите номер телефона';
    if (!/^[\d\s()+-]+$/.test(raw)) return 'В номере телефона допустимы только цифры, пробелы, скобки, плюс и дефис';
    let digits = raw.replace(/\D/g, '');
    if (digits.length === 10) digits = '7' + digits;
    if (digits.length === 11 && digits[0] === '8') digits = '7' + digits.slice(1);
    if (digits.length !== 11 || digits[0] !== '7') return 'Введите российский номер телефона, например +7 900 123-45-67';
    return null;
}

export function validateNewPassword(password) {
    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
        return `Пароль должен содержать от ${MIN_PASSWORD_LENGTH} до ${MAX_PASSWORD_LENGTH} символов`;
    }
    if (/\s/.test(password)) return 'Пароль не должен содержать пробелов';
    return null;
}
 export function validateAddress(address, required = true) {
    const value = normalizeSpaces(address);
    if (!value) return required ? 'Введите адрес доставки' : null;
    if (value.length < 8 || value.length > 200) return 'Адрес должен содержать от 8 до 200 символов';
    if (hasLatin(value)) return 'В адресе допустимы только русские буквы, цифры и знаки препинания';
    if (!hasCyrillic(value) || !/\d/.test(value)) return 'Укажите адрес полностью: город, улица и номер дома';
    return null;
}

function pad(number) {
    return String(number).padStart(2, '0');
}

function toDateString(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
 export function todayString() {
    return toDateString(new Date());
}
 export function maxDeliveryString() {
    const today = new Date();
    return toDateString(new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()));
}
 export function validateDeliveryDate(value) {
    if (!value) return 'Укажите дату доставки';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Некорректная дата доставки';
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return 'Некорректная дата доставки';
    if (value < todayString()) return 'Дата доставки не может быть раньше сегодняшней';
    if (value > maxDeliveryString()) return 'Дата доставки не может быть позже чем через год';
    return null;
}

export function validateReview(rating, text) {
    if (!rating) return 'Поставьте оценку от 1 до 5';
    const value = normalizeSpaces(text);
    if (value.length < 5) return 'Напишите отзыв не короче 5 символов';
    if (value.length > 1000) return 'Отзыв не должен быть длиннее 1000 символов';
    return null;
}
 export function validateCategory(name, description, existingNames) {
    const cleanName = normalizeSpaces(name);
    const cleanDescription = normalizeSpaces(description);

    if (!cleanName) return 'Введите название категории';
    if (cleanName.length < 2 || cleanName.length > 50) return 'Название категории должно содержать от 2 до 50 символов';
    if (!CATEGORY_REGEX.test(cleanName)) return 'В названии допустимы только русские буквы, цифры, пробел и дефис';
    if (existingNames.some(existing => makeKey(existing) === makeKey(cleanName))) return 'Такая категория уже существует';
    if (cleanDescription.length > 200) return 'Описание не должно быть длиннее 200 символов';
    if (hasLatin(cleanDescription)) return 'В описании не должно быть английских букв';
    return null;
}

export function validateDiscount(value) {
    if (value === '' || value === null || value === undefined) return 'Введите скидку';
    const number = Number(value);
    if (!Number.isInteger(number)) return 'Скидка должна быть целым числом';
    if (number < 0 || number > MAX_DISCOUNT) return `Скидка должна быть от 0 до ${MAX_DISCOUNT}`;
    return null;
}
 export function validateService(form, otherNames) {
    const errors = {};
    const name = normalizeSpaces(form.service_name);
    const description = normalizeSpaces(form.service_description);
    const duration = Number(form.duration_minutes);
    const priceText = String(form.price).replace(',', '.');
    const price = Number(priceText);

    if (!form.category_id) errors.category_id = 'Выберите категорию';

    if (name.length < 2 || name.length > 100) errors.service_name = 'Название должно содержать от 2 до 100 символов';
    else if (hasLatin(name) || !hasCyrillic(name)) errors.service_name = 'В названии допустимы русские буквы, цифры и знаки препинания, без английских букв';
    else if (otherNames.some(other => makeKey(other) === makeKey(name))) errors.service_name = 'Услуга с таким названием уже существует';

    if (description.length > 500) errors.service_description = 'Описание не должно быть длиннее 500 символов';
    else if (hasLatin(description)) errors.service_description = 'В описании не должно быть английских букв';

    if (form.duration_minutes === '' || !Number.isInteger(duration) || duration < 1 || duration > 1440) {
        errors.duration_minutes = 'Длительность: целое число минут от 1 до 1440';
    }

    if (priceText.trim() === '' || !Number.isFinite(price) || price <= 0 || price > MAX_PRICE || Math.round(price * 100) / 100 !== price) {
        errors.price = 'Цена: число больше 0, не более двух знаков после запятой';
    }

    const discountError = validateDiscount(form.service_discount);
    if (discountError) errors.service_discount = discountError;

    return errors;
}
 export function getNetworkMessage(err) {
    if (err instanceof TypeError) {
        return 'Нет связи с сервером. Проверьте, что сервер запущен.';
    }
    return err.message;
}
 export function validateDateFormat(value) {
    if (!value) return 'Укажите дату доставки';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Некорректная дата доставки';
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return 'Некорректная дата доставки';
    return null;
}
