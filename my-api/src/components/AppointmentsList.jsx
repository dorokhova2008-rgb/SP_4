import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, getCategories } from '../api/appointments';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { calcPrice, formatPrice, getCouponName } from '../utils/price';
import { getServiceImage } from '../utils/images';
import { useNotice } from '../utils/useNotice';
import Toast from './Toast';
import ReviewsModal from './ReviewsModal';
import QuickLinks from './QuickLinks';
 export default function AppointmentsList() {
    const { user } = useContext(AuthContext);
    const { cart, addItem, decreaseItem } = useContext(CartContext);
    const navigate = useNavigate();

    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [reviewService, setReviewService] = useState(null);
    const [notice, showNotice] = useNotice();

    useEffect(() => {
        loadData();
    }, []);
     async function loadData(silent = false) {
        try {
            if (!silent) setLoading(true);
            const [servicesData, categoriesData] = await Promise.all([
                getServices(),
                getCategories()
            ]);
            setServices(servicesData);
            setCategories(categoriesData);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Не удалось загрузить услуги. Проверьте подключение к серверу.');
        } finally {
            setLoading(false);
        }
    }
     function getQuantity(serviceId) {
        const item = cart.find(i => i.service_id === serviceId);
        return item ? item.quantity : 0;
    }
     async function handleAdd(service) {
        if (!user) {
            navigate('/login', { state: { from: '/', message: 'Чтобы добавить услугу в корзину, войдите в аккаунт' } });
            return;
        }
        try {
            setBusyId(service.service_id);
            const wasEmpty = getQuantity(service.service_id) === 0;
            await addItem(service.service_id);
            if (wasEmpty) {
                showNotice('success', `«${service.service_name}» добавлена в корзину`);
            }
        } catch (err) {
            console.error(err);
            showNotice('error', err.message || 'Ошибка при добавлении');
        } finally {
            setBusyId(null);
        }
    }

    async function handleRemoveOne(service) {
        try {
            setBusyId(service.service_id);
            await decreaseItem(service.service_id);
        } catch (err) {
            console.error(err);
            showNotice('error', err.message || 'Ошибка при удалении');
        } finally {
            setBusyId(null);
        }
    }
     function handleCategoryChange(categoryName) {
        if (selectedCategories.includes(categoryName)) {
            setSelectedCategories(selectedCategories.filter(name => name !== categoryName));
        } else {
            setSelectedCategories([...selectedCategories, categoryName]);
        }
    }

    function resetFilters() {
        setSelectedCategories([]);
        setMinPrice('');
        setMaxPrice('');
    }

    const isAdmin = user && user.role_name === 'admin';
    const personalDiscount = user && !isAdmin ? user.personal_discount : 0;

    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);
    const priceError =
        (min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0))
            ? 'Цена должна быть числом не меньше 0'
            : min !== null && max !== null && min > max
                ? 'Цена «от» не может быть больше цены «до»'
                : null;

    const filteredServices = services.filter(service => {
        if (selectedCategories.length > 0 && !selectedCategories.includes(service.category_name)) return false;
        if (priceError) return true;
        const price = calcPrice(service.price, service.service_discount, personalDiscount);
        if (min !== null && price < min) return false;
        if (max !== null && price > max) return false;
        return true;
    });

    const hasFilters = selectedCategories.length > 0 || minPrice !== '' || maxPrice !== '';

    if (loading) return <div className="state">Загрузка услуг...</div>;
    if (error) {
        return (
            <div className="state state-error">
                <h2>{error}</h2>
                <button className="btn btn-primary" onClick={() => loadData()}>Попробовать снова</button>
            </div>
        );
    }

    return (
        <div>
            <Toast notice={notice} />

            <QuickLinks />

            <div className="layout">
                <aside className="aside">
                    <h3>Категории</h3>
                    {categories.map(category => (
                        <label key={category.category_name} className="checkbox-row">
                            <input 
                                type="checkbox" 
                                checked={selectedCategories.includes(category.category_name)}
                                onChange={() => handleCategoryChange(category.category_name)}
                            />
                            <span className="checkbox-name">{category.category_name}</span>
                            <span className="checkbox-count">{category.services_count}</span>
                        </label>
                    ))}

                    <h3 className="aside-title">Цена, ₽</h3>
                    <div className="price-filter">
                        <input
                            type="number"
                            min="0"
                            placeholder="от"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className={priceError ? 'invalid' : ''}
                            aria-label="Цена от"
                        />
                        <input
                            type="number"
                            min="0"
                            placeholder="до"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className={priceError ? 'invalid' : ''}
                            aria-label="Цена до"
                        />
                    </div>
                    {priceError && <div className="field-error">{priceError}</div>}

                    {hasFilters && (
                        <button className="btn btn-ghost btn-small aside-reset" onClick={resetFilters}>
                            Сбросить фильтры
                        </button>
                    )}
                </aside>

                <div className="content">
                    <h1>Каталог услуг</h1>

                    {isAdmin && (
                        <p className="muted">Вы вошли как администратор: заказы оформляют клиенты, услугами, скидками и отзывами можно управлять в админ-панели.</p>
                    )}

                    {filteredServices.length === 0 && (
                        <p className="muted">По выбранным условиям услуг не найдено. Измените фильтры.</p>
                    )}

                    <div className="grid">
                        {filteredServices.map((service) => {
                            const price = Number(service.price);
                            const discount = service.service_discount;
                            const finalPrice = calcPrice(price, discount, personalDiscount);
                            const quantity = getQuantity(service.service_id);
                            const busy = busyId === service.service_id;

                            return (
                                <div key={service.service_id} className="card">
                                    <div className="card-img">
                                        <img src={getServiceImage(service.service_name, service.category_name)} alt={service.service_name} />
                                        {discount > 0 && <span className="badge">−{discount}%</span>}
                                    </div>

                                    <div className="card-body">
                                        <span className="card-category">{service.category_name}</span>
                                        <h3>{service.service_name}</h3>
                                        <p>{service.service_description}</p>
                                        <p className="muted">Длительность: {service.duration_minutes} мин.</p>
                                        <p className="muted">
                                            {service.reviews_count > 0
                                                ? `Оценка: ${service.rating_avg} из 5 (отзывов: ${service.reviews_count})`
                                                : 'Отзывов пока нет'}
                                        </p>
                                        <button className="btn btn-ghost btn-wide reviews-btn" onClick={() => setReviewService(service)}>
                                            Отзывы ({service.reviews_count})
                                        </button>
                                    </div>

                                    <div className="card-footer">
                                        <div className="price-row">
                                            {finalPrice < price && <span className="old-price">{formatPrice(price)}</span>}
                                            <span className="price">{formatPrice(finalPrice)}</span>
                                        </div>
                                        {personalDiscount > 0 && (
                                            <div className="coupon-note">
                                                Купон «{getCouponName(personalDiscount)}»: −{personalDiscount}%
                                            </div>
                                        )}

                                        {!isAdmin && (
                                            <>
                                                {quantity === 0 ? (
                                                    <button 
                                                        className="btn btn-primary btn-wide"
                                                        onClick={() => handleAdd(service)}
                                                        disabled={busy}
                                                    >
                                                        {busy ? 'Добавляем...' : 'В корзину'}
                                                    </button>
                                                ) : (
                                                    <div className="counter">
                                                        <button 
                                                            className="btn btn-danger counter-btn" 
                                                            onClick={() => handleRemoveOne(service)} 
                                                            disabled={busy}
                                                            aria-label="Убрать одну штуку"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="counter-value">{quantity} шт.</span>
                                                        <button 
                                                            className="btn btn-primary counter-btn" 
                                                            onClick={() => handleAdd(service)} 
                                                            disabled={busy}
                                                            aria-label="Добавить ещё одну"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {reviewService && (
                <ReviewsModal
                    service={reviewService}
                    onClose={() => setReviewService(null)}
                    onChanged={() => loadData(true)}
                />
            )}
        </div>
    );
}
