import { Link } from 'react-router-dom';
 export default function NotFound() {
    return (
        <div className="state">
            <h2>Страница не найдена</h2>
            <p className="muted">Такого адреса на сайте нет. Возможно, ссылка устарела или в ней ошибка.</p>
            <Link to="/" className="btn btn-primary">Перейти в каталог</Link>
        </div>
    );
}
