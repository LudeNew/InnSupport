import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createProjectRelease, getStages } from '../api';

const CreateReleaseModal = ({ projectId, onClose, onReleaseCreated }) => {
    const [formData, setFormData] = useState({
        project: projectId,
        name: '',
        version: '',
        release_date: '',
        status: 'DRAFT',
        stages: []
    });
    const [availableStages, setAvailableStages] = useState([]);

    useEffect(() => {
        getStages(projectId).then(res => {
            setAvailableStages(res.data.results || res.data || []);
        });
    }, [projectId]);

    const handleStageToggle = (stageId) => {
        setFormData(prev => {
            const stages = prev.stages.includes(stageId)
                ? prev.stages.filter(id => id !== stageId)
                : [...prev.stages, stageId];
            return { ...prev, stages };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createProjectRelease(formData);
            onReleaseCreated();
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="biz-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Новый релиз</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Название релиза</label>
                        <input type="text" className="input-clean" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Например: Осеннее обновление" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Версия</label>
                            <input type="text" className="input-clean" required value={formData.version} onChange={e => setFormData({ ...formData, version: e.target.value })} placeholder="v1.2.0" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Дата выхода</label>
                            <input type="date" className="input-clean" required value={formData.release_date} onChange={e => setFormData({ ...formData, release_date: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Включить этапы в релиз</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                            {availableStages.length === 0 ? <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Нет этапов</span> : availableStages.map(stage => (
                                <label key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.stages.includes(stage.id)} onChange={() => handleStageToggle(stage.id)} />
                                    {stage.name}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn" style={{ flex: 1, background: '#f3f4f6' }} onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Создать релиз</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default CreateReleaseModal;