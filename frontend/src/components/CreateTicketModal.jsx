
import { useState, useEffect } from 'react';
import { getProjects, getUsers, getTags, createTicket } from '../api';
import { X, Save, AlertCircle } from 'lucide-react';

const CreateTicketModal = ({ onClose, onTicketCreated }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'OPEN',
        project: '',
        assignee: '',
        tags: []
    });

    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [projectsRes, usersRes] = await Promise.all([
                    getProjects(),
                    getUsers()
                ]);
                setProjects(projectsRes.data);
                setUsers(usersRes.data);

                // Default project
                if (Array.isArray(projectsRes.data) && projectsRes.data.length > 0) {
                    setFormData(prev => ({ ...prev, project: projectsRes.data[0].id }));
                }
            } catch (err) {
                console.error("Не удалось загрузить данные формы", err);
                setError("Ошибка загрузки данных.");
            }
        };
        fetchMetadata();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!formData.title || !formData.project) {
                throw new Error("Заголовок и Проект обязательны.");
            }

            await createTicket({
                ...formData,
                project: parseInt(formData.project),
                assignee: formData.assignee ? parseInt(formData.assignee) : null
            });

            onTicketCreated();
            onClose();
        } catch (err) {
            console.error("Ошибка при создании тикета", err);
            setError(err.message || "Не удалось создать задачу.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <div className="biz-card" style={{
                width: '100%', maxWidth: '600px',
                padding: '2.5rem',
                background: 'white',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                position: 'relative',
                border: '1px solid #e5e7eb'
            }} onClick={e => e.stopPropagation()}>

                <button onClick={onClose} style={{ position: 'absolute', top: '2rem', right: '2rem', padding: '0.6rem', borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer' }}>
                    <X size={20} color="#374151" />
                </button>

                <h2 style={{ marginBottom: '2rem', marginTop: 0, color: '#111827' }}>Новая задача</h2>

                {error && (
                    <div style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', gap: '0.8rem', alignItems: 'center', fontSize: '0.9rem' }}>
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>Название</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="input-clean"
                            placeholder="Например: Исправить баг авторизации"
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>Описание</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="input-clean"
                            rows={4}
                            placeholder="Детальное описание..."
                            style={{ resize: 'vertical', minHeight: '100px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>Проект</label>
                            <select name="project" value={formData.project} onChange={handleChange} className="input-clean" required>
                                {Array.isArray(projects) && projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>Статус</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="input-clean">
                                <option value="OPEN">Открыто</option>
                                <option value="IN_PROGRESS">В работе</option>
                                <option value="REVIEW">На проверке</option>
                                <option value="DONE">Готово</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>Приоритет</label>
                            <select name="priority" value={formData.priority} onChange={handleChange} className="input-clean">
                                <option value="LOW">Низкий</option>
                                <option value="MEDIUM">Средний</option>
                                <option value="HIGH">Высокий</option>
                                <option value="CRITICAL">Критический</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>Исполнитель</label>
                            <select name="assignee" value={formData.assignee} onChange={handleChange} className="input-clean">
                                <option value="">Не назначен</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.username} ({u.first_name})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Создание...' : 'Создать задачу'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTicketModal;
