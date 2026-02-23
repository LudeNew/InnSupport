import { useState, useEffect } from 'react';
import { getProjects, getUsers, createTicket } from '../api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CreateTicketModal = ({ onClose, onTicketCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState(''); // Теперь это HTML строка
    const [project, setProject] = useState('');
    const [assignee, setAssignee] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [loading, setLoading] = useState(false);

    const [projectsList, setProjectsList] = useState([]);
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        getProjects().then(res => setProjectsList(res.data));
        getUsers().then(res => setUsersList(res.data));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createTicket({
                title,
                description, // Отправляем форматированный HTML
                project: project || null,
                assignee: assignee || null,
                priority
            });
            onTicketCreated();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Ошибка при создании задачи");
        } finally {
            setLoading(false);
        }
    };

    // Настройки панели инструментов редактора
    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
            ['link', 'code-block'],
            ['clean']
        ],
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content biz-card" onClick={e => e.stopPropagation()} style={{ width: '700px', maxWidth: '90%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ margin: '0 0 1.5rem 0' }}>Новая задача</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Название</label>
                        <input type="text" className="input-clean" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Описание</label>
                        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
                            <ReactQuill
                                theme="snow"
                                value={description}
                                onChange={setDescription}
                                modules={quillModules}
                                style={{ height: '200px', marginBottom: '40px' }} // Отступ снизу для тулбара
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Проект</label>
                            <select className="input-clean" value={project} onChange={e => setProject(e.target.value)} required>
                                <option value="">Выберите проект...</option>
                                {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Исполнитель</label>
                            <select className="input-clean" value={assignee} onChange={e => setAssignee(e.target.value)}>
                                <option value="">Не назначен</option>
                                {usersList.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Приоритет</label>
                        <select className="input-clean" value={priority} onChange={e => setPriority(e.target.value)}>
                            <option value="LOW">Низкий</option>
                            <option value="MEDIUM">Средний</option>
                            <option value="HIGH">Высокий</option>
                            <option value="CRITICAL">Критический</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn" style={{ flex: 1, background: '#f3f4f6' }} onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>Создать задачу</button>
                    </div>
                </form>
            </div>

            <style>{`
                .ql-toolbar { border-radius: 12px 12px 0 0; border-color: #e5e7eb !important; background: #f9fafb; }
                .ql-container { border-radius: 0 0 12px 12px; border-color: #e5e7eb !important; font-family: inherit; font-size: 1rem; }
            `}</style>
        </div>
    );
};

export default CreateTicketModal;