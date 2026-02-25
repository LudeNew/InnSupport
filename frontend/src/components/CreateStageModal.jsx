import { useState } from 'react';
import { createStage } from '../api';
import { X, Layout, Code, Palette, Bug, Rocket } from 'lucide-react';

const CreateStageModal = ({ onClose, onStageCreated, projectId }) => {
    const [stageData, setStageData] = useState({
        name: '',
        description: '',
        icon: 'layout',
        deadline: '',
        priority: 'MEDIUM',
        project: projectId
    });
    const [loading, setLoading] = useState(false);

    const iconsList = [
        { id: 'layout', comp: <Layout size={20} />, label: 'Общее' },
        { id: 'palette', comp: <Palette size={20} />, label: 'Дизайн' },
        { id: 'code', comp: <Code size={20} />, label: 'Разработка' },
        { id: 'bug', comp: <Bug size={20} />, label: 'Тестирование' },
        { id: 'rocket', comp: <Rocket size={20} />, label: 'Релиз' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSubmit = { ...stageData };
            if (!dataToSubmit.deadline) delete dataToSubmit.deadline;
            await createStage(dataToSubmit);
            onStageCreated();
            onClose();
        } catch (error) {
            alert('Ошибка при создании этапа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="biz-card" style={{ width: '600px', maxWidth: '90%', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Новый этап проекта</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Название этапа</label>
                        <input type="text" className="input-clean" required value={stageData.name} onChange={e => setStageData({ ...stageData, name: e.target.value })} />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Иконка процесса</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {iconsList.map(icon => (
                                <div
                                    key={icon.id}
                                    onClick={() => setStageData({ ...stageData, icon: icon.id })}
                                    style={{ padding: '0.8rem', borderRadius: '12px', border: `2px solid ${stageData.icon === icon.id ? '#4f46e5' : '#e5e7eb'}`, background: stageData.icon === icon.id ? '#e0e7ff' : 'white', color: stageData.icon === icon.id ? '#4f46e5' : '#6b7280', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flex: 1, transition: 'all 0.2s' }}
                                >
                                    {icon.comp}
                                    <span style={{ fontSize: '0.75rem', fontWeight: stageData.icon === icon.id ? 'bold' : 'normal' }}>{icon.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Дедлайн</label>
                            <input type="date" className="input-clean" value={stageData.deadline} onChange={e => setStageData({ ...stageData, deadline: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Приоритет</label>
                            <select className="input-clean" value={stageData.priority} onChange={e => setStageData({ ...stageData, priority: e.target.value })}>
                                <option value="LOW">Низкий</option>
                                <option value="MEDIUM">Средний</option>
                                <option value="HIGH">Высокий</option>
                                <option value="CRITICAL">Критический</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Описание и цели этапа</label>
                        <textarea className="input-clean" rows="3" value={stageData.description} onChange={e => setStageData({ ...stageData, description: e.target.value })}></textarea>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn" style={{ flex: 1, background: '#f3f4f6' }} onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Создание...' : 'Создать этап'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default CreateStageModal;