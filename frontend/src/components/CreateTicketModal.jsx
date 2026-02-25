import { useState, useEffect } from 'react';
import { createTicket, getProjects, getUsers, getStages } from '../api';
import { X } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CreateTicketModal = ({ onClose, onTicketCreated, preselectedProject = null }) => {
    const [ticketData, setTicketData] = useState({
        title: '', description: '', project: preselectedProject || '', stage: '', priority: 'MEDIUM', assignee: ''
    });

    const [projects, setProjects] = useState([]);
    const [stages, setStages] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getProjects().then(res => setProjects(Array.isArray(res.data) ? res.data : (res.data.results || [])));
        getUsers().then(res => setUsers(Array.isArray(res.data) ? res.data : (res.data.results || [])));
    }, []);

    useEffect(() => {
        if (ticketData.project) {
            getStages(ticketData.project).then(res => setStages(Array.isArray(res.data) ? res.data : (res.data.results || [])));
        } else { setStages([]); }
    }, [ticketData.project]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSubmit = { ...ticketData };
            // ЖЕЛЕЗОБЕТОННАЯ ОЧИСТКА ДАННЫХ ДЛЯ DJANGO
            if (!dataToSubmit.assignee) dataToSubmit.assignee = null;
            if (!dataToSubmit.stage) dataToSubmit.stage = null;
            if (!dataToSubmit.project) return alert("Выберите проект!");

            await createTicket(dataToSubmit);
            onTicketCreated();
            onClose();
        } catch (error) {
            console.error(error.response?.data);
            alert(`Ошибка при создании: ${JSON.stringify(error.response?.data || error.message)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="biz-card" style={{ width: '700px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Новая задача</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Название задачи</label>
                        <input type="text" className="input-clean" required value={ticketData.title} onChange={e => setTicketData({ ...ticketData, title: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Проект</label>
                            <select className="input-clean" required disabled={!!preselectedProject} value={ticketData.project} onChange={e => setTicketData({ ...ticketData, project: e.target.value, stage: '' })}>
                                <option value="">Выберите проект...</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Этап (Необязательно)</label>
                            <select className="input-clean" value={ticketData.stage} onChange={e => setTicketData({ ...ticketData, stage: e.target.value })} disabled={!ticketData.project || stages.length === 0}>
                                <option value="">Без этапа</option>
                                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Исполнитель</label>
                            <select className="input-clean" value={ticketData.assignee} onChange={e => setTicketData({ ...ticketData, assignee: e.target.value })}>
                                <option value="">Не назначен</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.first_name || u.username}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Приоритет</label>
                            <select className="input-clean" value={ticketData.priority} onChange={e => setTicketData({ ...ticketData, priority: e.target.value })}>
                                <option value="LOW">Низкий</option><option value="MEDIUM">Средний</option><option value="HIGH">Высокий</option><option value="CRITICAL">Критический</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Описание</label>
                        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
                            <ReactQuill theme="snow" value={ticketData.description} onChange={val => setTicketData({ ...ticketData, description: val })} style={{ height: '150px', marginBottom: '40px' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn" style={{ flex: 1, background: '#f3f4f6' }} onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Создание...' : 'Создать задачу'}</button>
                    </div>
                </form>
            </div>
            <style>{`.ql-toolbar { border-radius: 12px 12px 0 0; border-color: #e5e7eb !important; background: #f9fafb; } .ql-container { border-radius: 0 0 12px 12px; border-color: #e5e7eb !important; }`}</style>
        </div>
    );
};
export default CreateTicketModal;