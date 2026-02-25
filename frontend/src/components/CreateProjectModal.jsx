
import { useState } from 'react';
import { createProject } from '../api';
import { X, Save, AlertCircle } from 'lucide-react';

const CreateProjectModal = ({ onClose, onProjectCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'ACTIVE',
        project_type: 'INTERNAL' // Default
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!formData.name) {
                throw new Error("Название проекта обязательно.");
            }

            await createProject(formData);

            onProjectCreated();
            onClose();
        } catch (err) {
            console.error("Ошибка при создании проекта", err);
            setError(err.message || "Не удалось создать проект.");
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
                width: '100%', maxWidth: '500px',
                padding: '2.5rem',
                background: 'white',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                position: 'relative',
                border: '1px solid #e5e7eb'
            }} onClick={e => e.stopPropagation()}>

                <button onClick={onClose} style={{ position: 'absolute', top: '2rem', right: '2rem', padding: '0.6rem', borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer' }}>
                    <X size={20} color="#374151" />
                </button>

                <h2 style={{ marginBottom: '2rem', marginTop: 0, color: '#111827' }}>Новый проект</h2>

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
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input-clean"
                            placeholder="Например: Редизайн сайта"
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
                            rows={3}
                            placeholder="Краткое описание проекта..."
                            style={{ resize: 'vertical', minHeight: '80px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>Тип</label>
                            <select name="project_type" value={formData.project_type} onChange={handleChange} className="input-clean">
                                <option value="INTERNAL">Внутренний</option>
                                <option value="EXTERNAL">Внешний</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>Статус</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="input-clean">
                                <option value="ACTIVE">Активен</option>
                                <option value="ARCHIVED">Архив</option>
                                <option value="CLOSED">Закрыт</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Создание...' : 'Создать проект'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
