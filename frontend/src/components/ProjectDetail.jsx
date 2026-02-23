import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, getTickets } from '../api';
import { ArrowLeft, Plus, LayoutList, CheckCircle2, ListTodo, Clock } from 'lucide-react';

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                // Запрашиваем инфу о проекте
                const projRes = await getProject(id);
                setProject(projRes.data);

                // Запрашиваем задачи ТОЛЬКО для этого проекта (передаем project: id в параметры API)
                const ticketsRes = await getTickets();
                // Пока фильтруем на фронте (потом можно сделать на бэкенде через query параметры)
                const projectTickets = ticketsRes.data.filter(t => t.project === parseInt(id));
                setTickets(projectTickets);
            } catch (error) {
                console.error("Ошибка при загрузке проекта", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjectData();
    }, [id]);

    if (loading) return <div>Загрузка проекта...</div>;
    if (!project) return <div>Проект не найден.</div>;

    const doneTickets = tickets.filter(t => t.status === 'DONE').length;
    const progress = tickets.length === 0 ? 0 : Math.round((doneTickets / tickets.length) * 100);

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Шапка проекта */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                <button
                    onClick={() => navigate('/projects')}
                    style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', transition: 'all 0.2s' }}
                    className="back-btn"
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h1 style={{ margin: 0, fontSize: '2rem', color: '#111827' }}>{project.name}</h1>
                        <span className="badge" style={{ background: '#e0e7ff', color: '#4f46e5' }}>{project.project_type === 'INTERNAL' ? 'Внутренний' : 'Внешний'}</span>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0, maxWidth: '800px', lineHeight: '1.5' }}>
                        {project.description || "У этого проекта пока нет описания."}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Задача
                    </button>
                    <button style={{ background: 'white', border: '1px solid #e5e7eb', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <LayoutList size={18} /> Новый этап
                    </button>
                </div>
            </div>

            {/* Статистика проекта */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div className="biz-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ background: '#fefce8', padding: '1rem', borderRadius: '14px', color: '#a16207' }}><ListTodo size={28} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: 1, marginBottom: '0.2rem' }}>{tickets.length}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Всего задач</div>
                    </div>
                </div>
                <div className="biz-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '14px', color: '#15803d' }}><CheckCircle2 size={28} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: 1, marginBottom: '0.2rem' }}>{doneTickets}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Выполнено</div>
                    </div>
                </div>
                <div className="biz-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Прогресс</span>
                        <span style={{ fontWeight: '800', color: '#4f46e5' }}>{progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: '#4f46e5', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                    </div>
                </div>
            </div>

            {/* Списки этапов и задач */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '1rem' }}>

                {/* Этапы (Эпики) */}
                <div className="biz-card">
                    <h3 style={{ margin: '0 0 1.5rem 0' }}>Этапы проекта</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {project.stages?.length === 0 ? (
                            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>Этапы еще не созданы</p>
                        ) : (
                            project.stages.map((stage, idx) => (
                                <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{idx + 1}</div>
                                    <span style={{ fontWeight: '600', color: '#374151' }}>{stage.name}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Задачи проекта */}
                <div className="biz-card">
                    <h3 style={{ margin: '0 0 1.5rem 0' }}>Активные задачи</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {tickets.filter(t => t.status !== 'DONE').length === 0 ? (
                            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>Нет активных задач</p>
                        ) : (
                            tickets.filter(t => t.status !== 'DONE').map(ticket => (
                                <div key={ticket.id} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: ticket.priority === 'HIGH' ? '#ef4444' : '#f59e0b' }}></div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#111827' }}>{ticket.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>#{ticket.id} • {ticket.assignee_details?.username || 'Не назначен'}</div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.3rem 0.8rem', borderRadius: '20px', background: ticket.status === 'IN_PROGRESS' ? '#eff6ff' : '#f3f4f6', color: ticket.status === 'IN_PROGRESS' ? '#1d4ed8' : '#4b5563' }}>
                                        {ticket.status === 'IN_PROGRESS' ? 'В работе' : 'Открыто'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .back-btn:hover { background: #f3f4f6 !important; }
            `}</style>
        </div>
    );
};

export default ProjectDetail;