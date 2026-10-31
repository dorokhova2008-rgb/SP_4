const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const crypto = require('crypto');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

pool.on('connect', () => {
    console.log('Подключение к базе данных установлено');
});
pool.on('error', (err) => {
    console.error('Ошибка подключения к БД:', err);
});


const SECRET = process.env.AUTH_SECRET || process.env.RESET_SECRET || crypto.randomBytes(32).toString('hex');
const AUTH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 15 * 60 * 1000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SHOW_RESET_LINK = process.env.SHOW_RESET_LINK === 'true';

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 50;
const MAX_DISCOUNT = 50;
const MAX_PRICE = 10000000;
const ORDER_STATUSES = ['Новый', 'В обработке', 'Доставлен', 'Отменён'];

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const WORD = '[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)*';
const FULL_NAME_REGEX = new RegExp(`^${WORD}(?: ${WORD})+$`);
const CATEGORY_REGEX = /^[А-Яа-яЁё0-9]+(?:[ -][А-Яа-яЁё0-9]+)*$/;


function text(value) {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function normalizeSpaces(value) {
    return text(value).trim().replace(/\s+/g, ' ');
}

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function capitalizeWords(value) {
    return value.split(/([ -])/).map(capitalize).join('');
}

function makeKey(value) {
    return normalizeSpaces(value).toLowerCase().replace(/ё/g, 'е');
}

function hasLatin(value) {
    return /[A-Za-z]/.test(value);
}

function hasCyrillic(value) {
    return /[А-Яа-яЁё]/.test(value);
}

function hasControlChars(value) {
    return /[\u0000-\u001F\u007F]/.test(value);
}

function isValidEmail(email) {
    return email.length <= 100 && EMAIL_REGEX.test(email);
}

function isValidDiscount(value) {
    return Number.isInteger(value) && value >= 0 && value <= MAX_DISCOUNT;
}

function toId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function passwordError(password) {
    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
        return `Пароль должен содержать от ${MIN_PASSWORD_LENGTH} до ${MAX_PASSWORD_LENGTH} символов`;
    }
    if (/\s/.test(password)) {
        return 'Пароль не должен содержать пробелов';
    }
    return null;
}

function fullNameError(name) {
    if (!name.includes(' ')) {
        return 'Введите полное имя: имя и фамилию через пробел';
    }
    if (name.length < 5 || name.length > 100) {
        return 'Полное имя должно содержать от 5 до 100 символов';
    }
    if (!FULL_NAME_REGEX.test(name)) {
        return 'Введите имя и фамилию русскими буквами (пробел и дефис допустимы)';
    }
    return null;
}

function normalizePhone(value) {
    const raw = text(value).trim();
    if (!raw || !/^[\d\s()+-]+$/.test(raw)) return null;
    let digits = raw.replace(/\D/g, '');
    if (digits.length === 10) digits = '7' + digits;
    if (digits.length === 11 && digits[0] === '8') digits = '7' + digits.slice(1);
    if (digits.length !== 11 || digits[0] !== '7') return null;
    return '+' + digits;
}

function addressError(address) {
    if (address.length < 8 || address.length > 200) {
        return 'Адрес должен содержать от 8 до 200 символов';
    }
    if (hasControlChars(address) || hasLatin(address)) {
        return 'В адресе допустимы только русские буквы, цифры и знаки препинания';
    }
    if (!hasCyrillic(address) || !/\d/.test(address)) {
        return 'Укажите адрес полностью: город, улица и номер дома';
    }
    return null;
}

function pad(number) {
    return String(number).padStart(2, '0');
}

function formatDateString(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isValidDateString(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function deliveryDateError(value) {
    if (!value) return 'Укажите дату доставки';
    if (!isValidDateString(value)) return 'Некорректная дата доставки';
    const today = new Date();
    const todayString = formatDateString(today);
    const limit = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    if (value < todayString) return 'Дата доставки не может быть раньше сегодняшней';
    if (value > formatDateString(limit)) return 'Дата доставки не может быть позже чем через год';
    return null;
}

function reviewError(rating, reviewText) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return 'Оценка должна быть целым числом от 1 до 5';
    }
    if (reviewText.length < 5 || reviewText.length > 1000) {
        return 'Отзыв должен содержать от 5 до 1000 символов';
    }
    if (hasControlChars(reviewText)) {
        return 'В отзыве есть недопустимые символы';
    }
    return null;
}

function validateServiceBody(body) {
    const name = normalizeSpaces(body.service_name);
    const description = normalizeSpaces(body.service_description);
    const duration = Number(body.duration_minutes);
    const price = Number(text(body.price).replace(',', '.'));
    const discount = Number(body.service_discount === undefined || body.service_discount === '' ? 0 : body.service_discount);
    const categoryId = toId(body.category_id);

    let error = null;
    if (!categoryId) error = 'Выберите категорию';
    else if (name.length < 2 || name.length > 100) error = 'Название услуги должно содержать от 2 до 100 символов';
    else if (hasLatin(name) || !hasCyrillic(name) || hasControlChars(name)) error = 'В названии услуги допустимы русские буквы, цифры и знаки препинания, без английских букв';
    else if (description.length > 500) error = 'Описание не должно быть длиннее 500 символов';
    else if (hasLatin(description) || hasControlChars(description)) error = 'В описании не должно быть английских букв';
    else if (!Number.isInteger(duration) || duration < 1 || duration > 1440) error = 'Длительность: целое число минут от 1 до 1440';
    else if (!Number.isFinite(price) || price <= 0 || price > MAX_PRICE || Math.round(price * 100) / 100 !== price) error = `Цена: число больше 0 и не больше ${MAX_PRICE}, не более двух знаков после запятой`;
    else if (!isValidDiscount(discount)) error = `Скидка должна быть целым числом от 0 до ${MAX_DISCOUNT}`;

    return { error, values: { categoryId, name, description: description || null, duration, price, discount } };
}

function calcPrice(price, serviceDiscount, personalDiscount) {
    let result = Number(price);
    if (serviceDiscount > 0) result = result - (result * serviceDiscount / 100);
    if (personalDiscount > 0) result = result - (result * personalDiscount / 100);
    return Math.round(result * 100) / 100;
}


function passwordFingerprint(password) {
    return crypto.createHash('sha256').update(password).digest('hex').slice(0, 16);
}

function sign(kind, payload, password) {
    return crypto
        .createHmac('sha256', SECRET)
        .update(kind + '.' + payload + passwordFingerprint(password))
        .digest('base64url');
}

function createToken(kind, user, ttl) {
    const payload = Buffer.from(JSON.stringify({ uid: user.user_id, exp: Date.now() + ttl })).toString('base64url');
    return payload + '.' + sign(kind, payload, user.password);
}

async function checkToken(kind, token) {
    const parts = text(token).split('.');
    if (parts.length !== 2) return null;

    let data;
    try {
        data = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    } catch {
        return null;
    }
    if (!data.uid || !data.exp || data.exp < Date.now()) return null;

    const result = await pool.query('SELECT user_id, password FROM users WHERE user_id = $1', [data.uid]);
    const user = result.rows[0];
    if (!user) return null;

    const a = Buffer.from(sign(kind, parts[0], user.password));
    const b = Buffer.from(parts[1]);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    return user;
}

function publicUser(row) {
    return {
        user_id: row.user_id,
        user_name: row.user_name,
        email: row.email,
        phone: row.phone,
        default_address: row.default_address,
        personal_discount: row.role_name === 'admin' ? 0 : row.personal_discount,
        role_name: row.role_name
    };
}

const USER_FIELDS = `u.user_id, u.email, u.password, u.user_name, u.phone, u.default_address, u.personal_discount, r.role_name`;


async function requireAuth(req, res, next) {
    try {
        const header = text(req.header('authorization'));
        const token = header.startsWith('Bearer ') ? header.slice(7) : '';
        const tokenUser = await checkToken('auth', token);
        if (!tokenUser) {
            return res.status(401).json({ error: 'Необходимо войти в аккаунт' });
        }
        const result = await pool.query(
            `SELECT ${USER_FIELDS} FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1`,
            [tokenUser.user_id]
        );
        req.user = result.rows[0];
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
}

function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user.role_name !== 'admin') {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }
        next();
    });
}

function requireClient(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user.role_name === 'admin') {
            return res.status(403).json({ error: 'Администратор не может пользоваться корзиной и оформлять заказы' });
        }
        next();
    });
}

function fail(res, error, message) {
    console.error(error);
    res.status(500).json({ error: message });
}


app.get('/api/test', (req, res) => {
    res.json({ message: 'Сервер работает' });
});


app.post('/api/login', async (req, res) => {
    try {
        const email = text(req.body.email).trim().toLowerCase();
        const password = text(req.body.password);

        if (!email || !password) {
            return res.status(400).json({ error: 'Введите адрес электронной почты и пароль' });
        }

        const result = await pool.query(
            `SELECT ${USER_FIELDS} FROM users u JOIN roles r ON u.role_id = r.role_id WHERE LOWER(u.email) = $1`,
            [email]
        );

        const user = result.rows[0];
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Неверный адрес электронной почты или пароль' });
        }

        res.json({ token: createToken('auth', user, AUTH_TTL_MS), user: publicUser(user) });
    } catch (error) {
        fail(res, error, 'Ошибка сервера');
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const name = capitalizeWords(normalizeSpaces(req.body.name).toLowerCase());
        const email = text(req.body.email).trim().toLowerCase();
        const password = text(req.body.password);
        const phone = normalizePhone(req.body.phone);

        const nameProblem = fullNameError(name);
        if (nameProblem) return res.status(400).json({ error: nameProblem });
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Введите корректный адрес электронной почты' });
        }
        const passProblem = passwordError(password);
        if (passProblem) return res.status(400).json({ error: passProblem });
        if (!phone) {
            return res.status(400).json({ error: 'Введите корректный номер телефона, например +7 900 123-45-67' });
        }

        const roleResult = await pool.query("SELECT role_id FROM roles WHERE role_name = 'client'");
        if (roleResult.rows.length === 0) {
            return res.status(500).json({ error: 'В базе данных нет роли клиента' });
        }

        const result = await pool.query(
            `INSERT INTO users (role_id, email, password, user_name, phone)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING user_id, email, password, user_name, phone, default_address, personal_discount`,
            [roleResult.rows[0].role_id, email, password, name, phone]
        );

        const user = { ...result.rows[0], role_name: 'client' };
        res.json({ token: createToken('auth', user, AUTH_TTL_MS), user: publicUser(user) });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Пользователь с таким адресом электронной почты уже существует' });
        }
        fail(res, error, 'Ошибка при регистрации');
    }
});

app.post('/api/forgot-password', async (req, res) => {
    try {
        const email = text(req.body.email).trim().toLowerCase();
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Введите корректный адрес электронной почты' });
        }

        const result = await pool.query('SELECT user_id, password FROM users WHERE LOWER(email) = $1', [email]);
        const user = result.rows[0];

        const response = { message: 'Если такой адрес зарегистрирован, ссылка для смены пароля отправлена' };

        if (user) {
            const link = `${FRONTEND_URL}/reset-password?token=${createToken('reset', user, RESET_TTL_MS)}`;
            console.log(`Ссылка для сброса пароля (${email}): ${link}`);
            if (SHOW_RESET_LINK) {
                response.reset_link = link;
            }
        }

        res.json(response);
    } catch (error) {
        fail(res, error, 'Ошибка сервера');
    }
});

app.post('/api/reset-password', async (req, res) => {
    try {
        const password = text(req.body.password);
        const passProblem = passwordError(password);
        if (passProblem) return res.status(400).json({ error: passProblem });

        const user = await checkToken('reset', req.body.token);
        if (!user) {
            return res.status(400).json({ error: 'Ссылка недействительна или устарела. Запросите новую на странице входа' });
        }

        await pool.query('UPDATE users SET password = $1 WHERE user_id = $2', [password, user.user_id]);
        res.json({ message: 'Пароль изменён. Теперь можно войти' });
    } catch (error) {
        fail(res, error, 'Ошибка при смене пароля');
    }
});


app.get('/api/profile', requireAuth, (req, res) => {
    res.json(publicUser(req.user));
});

function validateProfileBody(body) {
    const name = capitalizeWords(normalizeSpaces(body.user_name).toLowerCase());
    const email = text(body.email).trim().toLowerCase();
    const phone = normalizePhone(body.phone);
    const address = normalizeSpaces(body.default_address);

    let error = fullNameError(name);
    if (!error && !isValidEmail(email)) error = 'Введите корректный адрес электронной почты';
    if (!error && !phone) error = 'Введите корректный номер телефона, например +7 900 123-45-67';
    if (!error && address) error = addressError(address);

    return { error, values: { name, email, phone, address: address || null } };
}

app.put('/api/profile', requireAuth, async (req, res) => {
    try {
        const { error, values } = validateProfileBody(req.body);
        if (error) return res.status(400).json({ error });

        await pool.query(
            `UPDATE users SET user_name = $1, email = $2, phone = $3, default_address = $4
             WHERE user_id = $5`,
            [values.name, values.email, values.phone, values.address, req.user.user_id]
        );
        const updated = await pool.query(
            `SELECT ${USER_FIELDS} FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1`,
            [req.user.user_id]
        );
        res.json(publicUser(updated.rows[0]));
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Этот адрес электронной почты уже занят другим пользователем' });
        }
        fail(res, error, 'Ошибка при сохранении данных');
    }
});

app.put('/api/profile/password', requireAuth, async (req, res) => {
    try {
        const oldPassword = text(req.body.old_password);
        const newPassword = text(req.body.new_password);

        if (!oldPassword) {
            return res.status(400).json({ error: 'Введите текущий пароль' });
        }
        if (oldPassword !== req.user.password) {
            return res.status(400).json({ error: 'Текущий пароль указан неверно' });
        }
        const passProblem = passwordError(newPassword);
        if (passProblem) return res.status(400).json({ error: passProblem });
        if (newPassword === oldPassword) {
            return res.status(400).json({ error: 'Новый пароль должен отличаться от текущего' });
        }

        await pool.query('UPDATE users SET password = $1 WHERE user_id = $2', [newPassword, req.user.user_id]);
        const token = createToken('auth', { user_id: req.user.user_id, password: newPassword }, AUTH_TTL_MS);
        res.json({ message: 'Пароль успешно изменён', token });
    } catch (error) {
        fail(res, error, 'Ошибка при смене пароля');
    }
});


app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.category_id, c.category_name, c.category_description,
                    COUNT(s.service_id)::int AS services_count
             FROM categories c
             LEFT JOIN services s ON s.category_id = c.category_id
             GROUP BY c.category_id
             ORDER BY c.category_id`
        );
        res.json(result.rows);
    } catch (error) {
        fail(res, error, 'Ошибка при получении категорий');
    }
});

async function validateCategoryBody(body, ignoreId) {
    const name = capitalize(normalizeSpaces(body.category_name));
    const description = normalizeSpaces(body.category_description);

    if (name.length < 2 || name.length > 50) {
        return { error: 'Название категории должно содержать от 2 до 50 символов' };
    }
    if (!CATEGORY_REGEX.test(name)) {
        return { error: 'В названии категории допустимы только русские буквы, цифры, пробел и дефис' };
    }
    if (description.length > 200) {
        return { error: 'Описание не должно быть длиннее 200 символов' };
    }
    if (hasLatin(description) || hasControlChars(description)) {
        return { error: 'В описании не должно быть английских букв' };
    }

    const existing = await pool.query('SELECT category_id, category_name FROM categories');
    const key = makeKey(name);
    if (existing.rows.some(row => row.category_id !== ignoreId && makeKey(row.category_name) === key)) {
        return { error: 'Такая категория уже существует', status: 409 };
    }

    return { name, description: description || null };
}

app.post('/api/categories', requireAdmin, async (req, res) => {
    try {
        const check = await validateCategoryBody(req.body, null);
        if (check.error) return res.status(check.status || 400).json({ error: check.error });

        const result = await pool.query(
            'INSERT INTO categories (category_name, category_description) VALUES ($1, $2) RETURNING *',
            [check.name, check.description]
        );
        res.json({ ...result.rows[0], services_count: 0 });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Такая категория уже существует' });
        }
        fail(res, error, 'Ошибка при добавлении категории');
    }
});

app.put('/api/categories/:id', requireAdmin, async (req, res) => {
    try {
        const categoryId = toId(req.params.id);
        if (!categoryId) return res.status(400).json({ error: 'Некорректный номер категории' });

        const check = await validateCategoryBody(req.body, categoryId);
        if (check.error) return res.status(check.status || 400).json({ error: check.error });

        const result = await pool.query(
            'UPDATE categories SET category_name = $1, category_description = $2 WHERE category_id = $3 RETURNING *',
            [check.name, check.description, categoryId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Категория не найдена' });
        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Такая категория уже существует' });
        }
        fail(res, error, 'Ошибка при сохранении категории');
    }
});

app.delete('/api/categories/:id', requireAdmin, async (req, res) => {
    try {
        const categoryId = toId(req.params.id);
        if (!categoryId) return res.status(400).json({ error: 'Некорректный номер категории' });

        const count = await pool.query('SELECT COUNT(*)::int AS count FROM services WHERE category_id = $1', [categoryId]);
        if (count.rows[0].count > 0) {
            return res.status(400).json({ error: 'Нельзя удалить категорию, в которой есть услуги. Сначала удалите или перенесите услуги' });
        }

        const result = await pool.query('DELETE FROM categories WHERE category_id = $1 RETURNING category_id', [categoryId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Категория не найдена' });
        res.json({ message: 'Категория удалена' });
    } catch (error) {
        fail(res, error, 'Ошибка при удалении категории');
    }
});


app.get('/api/services', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.service_id, s.category_id, s.service_name, s.service_description,
                    s.duration_minutes, s.price, s.service_discount,
                    c.category_name,
                    r.rating_avg,
                    COALESCE(r.reviews_count, 0) AS reviews_count
             FROM services s
             JOIN categories c ON s.category_id = c.category_id
             LEFT JOIN (
                 SELECT service_id, ROUND(AVG(rating), 1) AS rating_avg, COUNT(*)::int AS reviews_count
                 FROM reviews
                 GROUP BY service_id
             ) r ON r.service_id = s.service_id
             ORDER BY s.service_id`
        );
        res.json(result.rows);
    } catch (error) {
        fail(res, error, 'Ошибка сервера');
    }
});

async function serviceNameTaken(name, ignoreId) {
    const existing = await pool.query('SELECT service_id, service_name FROM services');
    const key = makeKey(name);
    return existing.rows.some(row => row.service_id !== ignoreId && makeKey(row.service_name) === key);
}

app.post('/api/services', requireAdmin, async (req, res) => {
    try {
        const { error, values } = validateServiceBody(req.body);
        if (error) return res.status(400).json({ error });

        const category = await pool.query('SELECT category_id FROM categories WHERE category_id = $1', [values.categoryId]);
        if (category.rows.length === 0) return res.status(400).json({ error: 'Выбранная категория не существует' });
        if (await serviceNameTaken(values.name, null)) {
            return res.status(409).json({ error: 'Услуга с таким названием уже существует' });
        }

        const result = await pool.query(
            `INSERT INTO services (category_id, service_name, service_description, duration_minutes, price, service_discount)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING service_id`,
            [values.categoryId, values.name, values.description, values.duration, values.price, values.discount]
        );
        res.json({ message: 'Услуга добавлена', service_id: result.rows[0].service_id });
    } catch (error) {
        fail(res, error, 'Ошибка при добавлении услуги');
    }
});

app.put('/api/services/:id', requireAdmin, async (req, res) => {
    try {
        const serviceId = toId(req.params.id);
        if (!serviceId) return res.status(400).json({ error: 'Некорректный номер услуги' });

        const { error, values } = validateServiceBody(req.body);
        if (error) return res.status(400).json({ error });

        const category = await pool.query('SELECT category_id FROM categories WHERE category_id = $1', [values.categoryId]);
        if (category.rows.length === 0) return res.status(400).json({ error: 'Выбранная категория не существует' });
        if (await serviceNameTaken(values.name, serviceId)) {
            return res.status(409).json({ error: 'Услуга с таким названием уже существует' });
        }

        const result = await pool.query(
            `UPDATE services
             SET category_id = $1, service_name = $2, service_description = $3,
                 duration_minutes = $4, price = $5, service_discount = $6
             WHERE service_id = $7
             RETURNING service_id`,
            [values.categoryId, values.name, values.description, values.duration, values.price, values.discount, serviceId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Услуга не найдена' });
        res.json({ message: 'Услуга сохранена' });
    } catch (error) {
        fail(res, error, 'Ошибка при сохранении услуги');
    }
});

app.delete('/api/services/:id', requireAdmin, async (req, res) => {
    try {
        const serviceId = toId(req.params.id);
        if (!serviceId) return res.status(400).json({ error: 'Некорректный номер услуги' });

        const used = await pool.query(
            'SELECT COUNT(*)::int AS count FROM appointments WHERE service_id = $1 AND order_id IS NOT NULL',
            [serviceId]
        );
        if (used.rows[0].count > 0) {
            return res.status(400).json({ error: 'Нельзя удалить услугу, которая есть в оформленных заказах' });
        }

        const result = await pool.query('DELETE FROM services WHERE service_id = $1 RETURNING service_id', [serviceId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Услуга не найдена' });
        res.json({ message: 'Услуга удалена' });
    } catch (error) {
        fail(res, error, 'Ошибка при удалении услуги');
    }
});


app.get('/api/services/:id/reviews', async (req, res) => {
    try {
        const serviceId = toId(req.params.id);
        if (!serviceId) return res.status(400).json({ error: 'Некорректный номер услуги' });

        const result = await pool.query(
            `SELECT rv.review_id, rv.user_id, rv.rating, rv.review_text,
                    to_char(rv.review_created_at, 'YYYY-MM-DD') AS review_date,
                    u.user_name
             FROM reviews rv
             JOIN users u ON rv.user_id = u.user_id
             WHERE rv.service_id = $1
             ORDER BY rv.review_created_at DESC, rv.review_id DESC`,
            [serviceId]
        );
        res.json(result.rows);
    } catch (error) {
        fail(res, error, 'Ошибка при получении отзывов');
    }
});

app.get('/api/reviews', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT rv.review_id, rv.user_id, rv.rating, rv.review_text,
                    to_char(rv.review_created_at, 'YYYY-MM-DD') AS review_date,
                    u.user_name, s.service_name
             FROM reviews rv
             JOIN users u ON rv.user_id = u.user_id
             JOIN services s ON rv.service_id = s.service_id
             ORDER BY rv.review_created_at DESC, rv.review_id DESC`
        );
        res.json(result.rows);
    } catch (error) {
        fail(res, error, 'Ошибка при получении отзывов');
    }
});

app.post('/api/reviews', requireAuth, async (req, res) => {
    try {
        const serviceId = toId(req.body.service_id);
        const rating = Number(req.body.rating);
        const reviewText = normalizeSpaces(req.body.review_text);

        if (!serviceId) return res.status(400).json({ error: 'Некорректный номер услуги' });
        const problem = reviewError(rating, reviewText);
        if (problem) return res.status(400).json({ error: problem });

        const service = await pool.query('SELECT service_id FROM services WHERE service_id = $1', [serviceId]);
        if (service.rows.length === 0) return res.status(404).json({ error: 'Услуга не найдена' });

        const existing = await pool.query(
            'SELECT review_id FROM reviews WHERE user_id = $1 AND service_id = $2',
            [req.user.user_id, serviceId]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Вы уже оставили отзыв на эту услугу. Его можно изменить' });
        }

        await pool.query(
            'INSERT INTO reviews (user_id, service_id, rating, review_text) VALUES ($1, $2, $3, $4)',
            [req.user.user_id, serviceId, rating, reviewText]
        );
        res.json({ message: 'Отзыв добавлен' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Вы уже оставили отзыв на эту услугу. Его можно изменить' });
        }
        fail(res, error, 'Ошибка при добавлении отзыва');
    }
});

async function findEditableReview(req, res) {
    const reviewId = toId(req.params.id);
    if (!reviewId) {
        res.status(400).json({ error: 'Некорректный номер отзыва' });
        return null;
    }
    const result = await pool.query('SELECT review_id, user_id FROM reviews WHERE review_id = $1', [reviewId]);
    const review = result.rows[0];
    if (!review) {
        res.status(404).json({ error: 'Отзыв не найден' });
        return null;
    }
    if (review.user_id !== req.user.user_id && req.user.role_name !== 'admin') {
        res.status(403).json({ error: 'Можно изменять только свои отзывы' });
        return null;
    }
    return review;
}

app.put('/api/reviews/:id', requireAuth, async (req, res) => {
    try {
        const review = await findEditableReview(req, res);
        if (!review) return;

        const rating = Number(req.body.rating);
        const reviewText = normalizeSpaces(req.body.review_text);
        const problem = reviewError(rating, reviewText);
        if (problem) return res.status(400).json({ error: problem });

        await pool.query('UPDATE reviews SET rating = $1, review_text = $2 WHERE review_id = $3', [rating, reviewText, review.review_id]);
        res.json({ message: 'Отзыв сохранён' });
    } catch (error) {
        fail(res, error, 'Ошибка при сохранении отзыва');
    }
});

app.delete('/api/reviews/:id', requireAuth, async (req, res) => {
    try {
        const review = await findEditableReview(req, res);
        if (!review) return;

        await pool.query('DELETE FROM reviews WHERE review_id = $1', [review.review_id]);
        res.json({ message: 'Отзыв удалён' });
    } catch (error) {
        fail(res, error, 'Ошибка при удалении отзыва');
    }
});

app.get('/api/admin/reviews', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT rv.review_id, rv.rating, rv.review_text,
                    to_char(rv.review_created_at, 'YYYY-MM-DD') AS review_date,
                    u.user_name, s.service_name
             FROM reviews rv
             JOIN users u ON rv.user_id = u.user_id
             JOIN services s ON rv.service_id = s.service_id
             ORDER BY rv.review_created_at DESC, rv.review_id DESC`
        );
        res.json(result.rows);
    } catch (error) {
        fail(res, error, 'Ошибка при получении отзывов');
    }
});


async function refreshCartPrices(db, userId, personalDiscount) {
    await db.query(
        `UPDATE appointments a
         SET final_price = ROUND(s.price * (100 - s.service_discount) / 100.0 * (100 - $2::int) / 100.0, 2)
         FROM services s
         WHERE a.service_id = s.service_id AND a.user_id = $1 AND a.status = 'cart' AND a.order_id IS NULL`,
        [userId, personalDiscount]
    );
}

app.get('/api/cart', requireClient, async (req, res) => {
    try {
        await refreshCartPrices(pool, req.user.user_id, req.user.personal_discount);
        const result = await pool.query(
            `SELECT s.service_id, s.service_name, s.service_description, s.duration_minutes, c.category_name,
                    COUNT(a.appointment_id)::int AS quantity,
                    SUM(a.final_price) AS total_price,
                    ROUND(SUM(a.final_price) / COUNT(a.appointment_id), 2) AS unit_price
             FROM appointments a
             JOIN services s ON a.service_id = s.service_id
             JOIN categories c ON s.category_id = c.category_id
             WHERE a.user_id = $1 AND a.status = 'cart' AND a.order_id IS NULL
             GROUP BY s.service_id, c.category_name
             ORDER BY MIN(a.appointment_id)`,
            [req.user.user_id]
        );
        res.json(result.rows);
    } catch (error) {
        fail(res, error, 'Ошибка при получении корзины');
    }
});

app.post('/api/cart', requireClient, async (req, res) => {
    try {
        const serviceId = toId(req.body.service_id);
        if (!serviceId) return res.status(400).json({ error: 'Некорректный номер услуги' });

        const serviceResult = await pool.query('SELECT price, service_discount FROM services WHERE service_id = $1', [serviceId]);
        const service = serviceResult.rows[0];
        if (!service) return res.status(404).json({ error: 'Услуга не найдена' });

        const count = await pool.query(
            `SELECT COUNT(*)::int AS count FROM appointments
             WHERE user_id = $1 AND service_id = $2 AND status = 'cart' AND order_id IS NULL`,
            [req.user.user_id, serviceId]
        );
        if (count.rows[0].count >= 20) {
            return res.status(400).json({ error: 'Нельзя добавить больше 20 штук одной услуги' });
        }

        const price = calcPrice(service.price, service.service_discount, req.user.personal_discount);
        await pool.query(
            `INSERT INTO appointments (user_id, service_id, status, final_price) VALUES ($1, $2, 'cart', $3)`,
            [req.user.user_id, serviceId, price]
        );
        res.json({ message: 'Добавлено в корзину' });
    } catch (error) {
        fail(res, error, 'Ошибка при добавлении в корзину');
    }
});

app.delete('/api/cart/:serviceId', requireClient, async (req, res) => {
    try {
        const serviceId = toId(req.params.serviceId);
        if (!serviceId) return res.status(400).json({ error: 'Некорректный номер услуги' });

        if (req.query.one === 'true') {
            await pool.query(
                `DELETE FROM appointments WHERE appointment_id = (
                    SELECT appointment_id FROM appointments
                    WHERE user_id = $1 AND service_id = $2 AND status = 'cart' AND order_id IS NULL
                    ORDER BY appointment_id DESC LIMIT 1
                )`,
                [req.user.user_id, serviceId]
            );
        } else {
            await pool.query(
                `DELETE FROM appointments WHERE user_id = $1 AND service_id = $2 AND status = 'cart' AND order_id IS NULL`,
                [req.user.user_id, serviceId]
            );
        }
        res.json({ message: 'Удалено из корзины' });
    } catch (error) {
        fail(res, error, 'Ошибка при удалении');
    }
});


const ORDERS_SELECT = `
    SELECT o.order_id, o.delivery_address,
           to_char(o.delivery_date, 'YYYY-MM-DD') AS delivery_date,
           o.order_status, o.total_price,
           to_char(o.order_created_at, 'YYYY-MM-DD HH24:MI') AS created_at,
           u.user_name, u.email, u.phone,
           COALESCE(
               json_agg(json_build_object('service_name', i.service_name, 'quantity', i.quantity, 'total_price', i.total_price)
                        ORDER BY i.service_name) FILTER (WHERE i.service_name IS NOT NULL),
               '[]'::json
           ) AS items
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    LEFT JOIN (
        SELECT a.order_id, s.service_id, s.service_name, COUNT(*)::int AS quantity, SUM(a.final_price) AS total_price
        FROM appointments a
        JOIN services s ON a.service_id = s.service_id
        WHERE a.order_id IS NOT NULL
        GROUP BY a.order_id, s.service_id, s.service_name
    ) i ON i.order_id = o.order_id`;
const ORDERS_GROUP = ` GROUP BY o.order_id, u.user_id ORDER BY o.order_id DESC`;

app.post('/api/orders', requireClient, async (req, res) => {
    const address = normalizeSpaces(req.body.delivery_address);
    const date = text(req.body.delivery_date).trim();

    const addressProblem = addressError(address);
    if (addressProblem) return res.status(400).json({ error: addressProblem });
    const dateProblem = deliveryDateError(date);
    if (dateProblem) return res.status(400).json({ error: dateProblem });

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        await refreshCartPrices(client, req.user.user_id, req.user.personal_discount);
        const items = await client.query(
            `SELECT appointment_id, final_price FROM appointments
             WHERE user_id = $1 AND status = 'cart' AND order_id IS NULL
             FOR UPDATE`,
            [req.user.user_id]
        );
        if (items.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Корзина пуста' });
        }

        const total = Math.round(items.rows.reduce((sum, row) => sum + Number(row.final_price), 0) * 100) / 100;
        const order = await client.query(
            `INSERT INTO orders (user_id, delivery_address, delivery_date, total_price)
             VALUES ($1, $2, $3, $4) RETURNING order_id`,
            [req.user.user_id, address, date, total]
        );
        const orderId = order.rows[0].order_id;

        await client.query(
            `UPDATE appointments SET status = 'paid', order_id = $1 WHERE appointment_id = ANY($2::int[])`,
            [orderId, items.rows.map(row => row.appointment_id)]
        );
        await client.query(
            `INSERT INTO payments (appointment_id, amount)
             SELECT appointment_id, final_price FROM appointments WHERE order_id = $1 AND final_price > 0`,
            [orderId]
        );
        await client.query(
            'UPDATE users SET default_address = $1 WHERE user_id = $2 AND default_address IS NULL',
            [address, req.user.user_id]
        );

        await client.query('COMMIT');
        res.json({ total, items_count: items.rows.length });
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        fail(res, error, 'Ошибка при оформлении заказа');
    } finally {
        if (client) client.release();
    }
});

app.get('/api/orders', requireClient, async (req, res) => {
    try {
        const result = await pool.query(`${ORDERS_SELECT} WHERE o.user_id = $1 ${ORDERS_GROUP}`, [req.user.user_id]);
        res.json(result.rows);
    } catch (error) {
        fail(res, error, 'Ошибка при получении заказов');
    }
});

app.put('/api/orders/:id/cancel', requireClient, async (req, res) => {
    try {
        const orderId = toId(req.params.id);
        if (!orderId) return res.status(400).json({ error: 'Некорректный номер заказа' });

        const result = await pool.query('SELECT order_status FROM orders WHERE order_id = $1 AND user_id = $2', [orderId, req.user.user_id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Заказ не найден' });
        if (result.rows[0].order_status !== 'Новый') {
            return res.status(400).json({ error: 'Отменить можно только заказ со статусом «Новый»' });
        }

        await pool.query(`UPDATE orders SET order_status = 'Отменён' WHERE order_id = $1`, [orderId]);
        res.json({ message: 'Заказ отменён' });
    } catch (error) {
        fail(res, error, 'Ошибка при отмене заказа');
    }
});

app.get('/api/admin/orders', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`${ORDERS_SELECT} ${ORDERS_GROUP}`);
        res.json(result.rows);
    } catch (error) {
        fail(res, error, 'Ошибка при получении заказов');
    }
});

app.put('/api/admin/orders/:id', requireAdmin, async (req, res) => {
    try {
        const orderId = toId(req.params.id);
        if (!orderId) return res.status(400).json({ error: 'Некорректный номер заказа' });

        const status = normalizeSpaces(req.body.order_status);
        const address = normalizeSpaces(req.body.delivery_address);
        const date = text(req.body.delivery_date).trim();

        if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'Выберите статус из списка' });
        const addressProblem = addressError(address);
        if (addressProblem) return res.status(400).json({ error: addressProblem });
        if (!isValidDateString(date)) return res.status(400).json({ error: 'Некорректная дата доставки' });

        const result = await pool.query(
            `UPDATE orders SET order_status = $1, delivery_address = $2, delivery_date = $3
             WHERE order_id = $4 RETURNING order_id`,
            [status, address, date, orderId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Заказ не найден' });
        res.json({ message: 'Заказ сохранён' });
    } catch (error) {
        fail(res, error, 'Ошибка при сохранении заказа');
    }
});

app.delete('/api/admin/orders/:id', requireAdmin, async (req, res) => {
    try {
        const orderId = toId(req.params.id);
        if (!orderId) return res.status(400).json({ error: 'Некорректный номер заказа' });

        const result = await pool.query('DELETE FROM orders WHERE order_id = $1 RETURNING order_id', [orderId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Заказ не найден' });
        res.json({ message: 'Заказ удалён' });
    } catch (error) {
        fail(res, error, 'Ошибка при удалении заказа');
    }
});


app.get('/api/users', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.user_id, u.user_name, u.email, u.phone, u.default_address, u.personal_discount,
                    r.role_name, COUNT(o.order_id)::int AS orders_count
             FROM users u
             JOIN roles r ON u.role_id = r.role_id
             LEFT JOIN orders o ON o.user_id = u.user_id
             GROUP BY u.user_id, r.role_name
             ORDER BY u.user_id`
        );
        res.json(result.rows);
    } catch (error) {
        fail(res, error, 'Ошибка при получении пользователей');
    }
});

app.put('/api/users/:id', requireAdmin, async (req, res) => {
    try {
        const userId = toId(req.params.id);
        if (!userId) return res.status(400).json({ error: 'Некорректный номер пользователя' });

        const { error, values } = validateProfileBody(req.body);
        if (error) return res.status(400).json({ error });

        const result = await pool.query(
            `UPDATE users SET user_name = $1, email = $2, phone = $3, default_address = $4
             WHERE user_id = $5 RETURNING user_id`,
            [values.name, values.email, values.phone, values.address, userId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
        res.json({ message: 'Данные пользователя сохранены' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Этот адрес электронной почты уже занят другим пользователем' });
        }
        fail(res, error, 'Ошибка при сохранении данных');
    }
});

app.put('/api/users/:id/discount', requireAdmin, async (req, res) => {
    try {
        const userId = toId(req.params.id);
        if (!userId) return res.status(400).json({ error: 'Некорректный номер пользователя' });
        const discount = Number(req.body.discount);
        if (!isValidDiscount(discount)) {
            return res.status(400).json({ error: `Скидка должна быть целым числом от 0 до ${MAX_DISCOUNT}` });
        }

        const target = await pool.query(
            'SELECT r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1',
            [userId]
        );
        if (target.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
        if (target.rows[0].role_name === 'admin') {
            return res.status(400).json({ error: 'Администратору скидка не назначается' });
        }

        const result = await pool.query(
            'UPDATE users SET personal_discount = $1 WHERE user_id = $2 RETURNING user_id, personal_discount',
            [discount, userId]
        );
        res.json(result.rows[0]);
    } catch (error) {
        fail(res, error, 'Ошибка при сохранении скидки');
    }
});

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
    try {
        const userId = toId(req.params.id);
        if (!userId) return res.status(400).json({ error: 'Некорректный номер пользователя' });
        if (userId === req.user.user_id) {
            return res.status(400).json({ error: 'Нельзя удалить свою учётную запись' });
        }

        const target = await pool.query(
            'SELECT r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1',
            [userId]
        );
        if (target.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
        if (target.rows[0].role_name === 'admin') {
            return res.status(400).json({ error: 'Учётную запись администратора удалить нельзя' });
        }

        await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
        res.json({ message: 'Пользователь удалён' });
    } catch (error) {
        fail(res, error, 'Ошибка при удалении пользователя');
    }
});


app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Такого адреса нет на сервере' });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(400).json({ error: 'Некорректный запрос' });
});

async function checkDatabase() {
    try {
        await pool.query('SELECT 1');
        const result = await pool.query(
            `SELECT
                (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('orders', 'reviews'))::int AS tables,
                (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('phone', 'default_address'))::int AS columns`
        );
        if (result.rows[0].tables < 2 || result.rows[0].columns < 2) {
            console.error('ВНИМАНИЕ: база данных не обновлена. Выполните файл migration.sql (или database.sql) в базе данных.');
        } else {
            console.log('База данных подключена и готова к работе');
        }
    } catch (error) {
        console.error('НЕ УДАЛОСЬ ПОДКЛЮЧИТЬСЯ К БАЗЕ ДАННЫХ: ' + (error.message || error.code));
        console.error('Проверьте, что PostgreSQL запущен и что в файле backend/.env верно указаны база, пользователь, пароль и порт.');
    }
}

const server = app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    checkDatabase();
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Порт ${PORT} уже занят: где-то ещё запущена старая копия сервера. Закройте её (Ctrl+C в другом терминале) и запустите снова.`);
    } else {
        console.error('Сервер не запустился:', error.message);
    }
    process.exit(1);
});
