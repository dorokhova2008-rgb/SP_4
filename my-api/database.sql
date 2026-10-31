DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

CREATE TABLE roles (
    role_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id INT NOT NULL REFERENCES roles(role_id),

    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    default_address VARCHAR(255),

    personal_discount INT NOT NULL DEFAULT 0 CHECK (personal_discount >= 0 AND personal_discount <= 100),
    user_created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    category_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_description TEXT
);

CREATE TABLE services (
    service_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    category_id INT NOT NULL REFERENCES categories(category_id),

    service_name VARCHAR(150) NOT NULL,
    service_description TEXT,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),

    service_discount INT NOT NULL DEFAULT 0 CHECK (service_discount >= 0 AND service_discount <= 100)
);

CREATE TABLE orders (
    order_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    delivery_address VARCHAR(255) NOT NULL,
    delivery_date DATE NOT NULL,
    order_status VARCHAR(30) NOT NULL DEFAULT 'Новый'
        CHECK (order_status IN ('Новый', 'В обработке', 'Доставлен', 'Отменён')),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    order_created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
    appointment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    service_id INT NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
    order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,

    status VARCHAR(30) NOT NULL DEFAULT 'cart',
    final_price DECIMAL(10,2) NOT NULL CHECK (final_price >= 0),

    appointment_created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    payment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    appointment_id INT NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,

    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'card',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'success'
);

CREATE TABLE reviews (
    review_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    service_id INT NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,

    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    review_created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, service_id)
);

INSERT INTO roles (role_name) VALUES ('admin'), ('client');

INSERT INTO users (role_id, email, password, user_name, phone, default_address, personal_discount) VALUES
(1, 'admin@shop.ru', 'admin123', 'Администратор Сайта', '+79000000000', NULL, 0),
(2, 'client@shop.ru', 'client123', 'Иван Петров', '+79001234567', 'г. Санкт-Петербург, наб. Робеспьера, д. 12', 10);

INSERT INTO categories (category_name, category_description) VALUES
('Яхты', 'Прогулки на роскошных яхтах'),
('Катера', 'Быстрые и маневренные катера'),
('Гидроциклы', 'Скорость и драйв на воде');

INSERT INTO services (category_id, service_name, service_description, duration_minutes, price, service_discount) VALUES
(1, 'Аренда яхты "Мечта"', 'Роскошная яхта для вечеринок', 180, 50000.00, 0),
(1, 'Аренда яхты "Звезда"', 'Просторная яхта для фотосессий', 240, 80000.00, 15),
(1, 'Аренда яхты "Бриз"', 'Небольшая яхта для романтического вечера', 120, 30000.00, 0),
(1, 'Аренда яхты "Океан"', 'Огромная яхта с экипажем', 360, 150000.00, 0),
(2, 'Катер "Ветер"', 'Быстрый катер для прогулок', 60, 15000.00, 0),
(2, 'Катер "Волна"', 'Спортивный катер для водных лыж', 120, 25000.00, 20),
(2, 'Катер "Шторм"', 'Мощный катер для компаний', 90, 20000.00, 0),
(3, 'Гидроцикл "Стрела"', 'Скоростной гидроцикл', 30, 8000.00, 0),
(3, 'Гидроцикл "Форсаж"', 'Мощный гидроцикл для двоих', 30, 10000.00, 10),
(3, 'Гидроцикл "Тайфун"', 'Экстремальный гидроцикл', 45, 12000.00, 0);

INSERT INTO reviews (user_id, service_id, rating, review_text) VALUES
(2, 1, 5, 'Отличная яхта, команда вежливая, праздник прошёл на высшем уровне.'),
(2, 5, 4, 'Быстрый катер, прогулка понравилась. Хотелось бы побольше времени.');

SELECT * FROM roles;
SELECT * FROM users;
SELECT * FROM categories;
SELECT * FROM services;
