import { useState, useEffect } from 'react';
import { getCategories } from '../../api/appointments';
import { addCategory, updateCategory, deleteCategory } from '../../api/admin';
import { validateCategory, normalizeSpaces, getNetworkMessage } from '../../utils/validation';
import { useNotice } from '../../utils/useNotice';
import Toast from '../Toast';
 export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [formError, setFormError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [notice, showNotice] = useNotice();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setCategories(await getCategories());
            setError(null);
        } catch (err) {
            console.error(err);
            setError(getNetworkMessage(err));
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setEditingId(null);
        setName('');
        setDescription('');
        setFormError(null);
    }

    function startEdit(category) {
        setEditingId(category.category_id);
        setName(category.category_name);
        setDescription(category.category_description || '');
        setFormError(null);
    }
     async function handleSubmit(e) {
        e.preventDefault();

        const otherNames = categories.filter(c => c.category_id !== editingId).map(c => c.category_name);
        const problem = validateCategory(name, description, otherNames);
        setFormError(problem);
        if (problem) return;

        try {
            setSaving(true);
            if (editingId) {
                await updateCategory(editingId, normalizeSpaces(name), normalizeSpaces(description));
            } else {
                await addCategory(normalizeSpaces(name), normalizeSpaces(description));
            }
            resetForm();
            await loadData();
            showNotice('success', editingId ? 'Категория сохранена' : 'Категория добавлена и появилась в фильтре каталога');
        } catch (err) {
            console.error(err);
            setFormError(getNetworkMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(category) {
        if (!window.confirm(`Удалить категорию «${category.category_name}»?`)) return;
        try {
            await deleteCategory(category.category_id);
            if (editingId === category.category_id) resetForm();
            await loadData();
            showNotice('success', 'Категория удалена');
        } catch (err) {
            console.error(err);
            showNotice('error', getNetworkMessage(err));
        }
    }

    if (loading) return <div className="state">Загрузка данных...</div>;
    if (error) {
        return (
            <div className="state state-error">
                <h2>{error}</h2>
                <button className="btn btn-primary" onClick={loadData}>Попробовать снова</button>
            </div>
        );
    }

    return (
        <section className="panel">
            <Toast notice={notice} />
            <h2>Категории</h2>

            <form onSubmit={handleSubmit} className="inline-form" noValidate>
                <input
                    type="text"
                    placeholder="Название категории"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={formError ? 'invalid' : ''}
                    maxLength={50}
                />
                <input
                    type="text"
                    placeholder="Описание (необязательно)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={200}
                />
                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Добавить категорию'}
                </button>
                {editingId && <button type="button" className="btn btn-ghost" onClick={resetForm}>Отмена</button>}
            </form>
            {formError && <div className="field-error">{formError}</div>}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Название</th><th>Описание</th><th>Услуг</th><th></th></tr>
                    </thead>
                    <tbody>
                        {categories.map(c => (
                            <tr key={c.category_id}>
                                <td>{c.category_name}</td>
                                <td className="wrap">{c.category_description}</td>
                                <td>{c.services_count}</td>
                                <td className="actions">
                                    <button className="btn btn-primary btn-small" onClick={() => startEdit(c)}>Изменить</button>
                                    <button
                                        className="btn btn-danger btn-small"
                                        onClick={() => handleDelete(c)}
                                        disabled={c.services_count > 0}
                                        title={c.services_count > 0 ? 'Нельзя удалить категорию, в которой есть услуги' : ''}
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="muted">Удалить можно только категорию без услуг.</p>
        </section>
    );
}
