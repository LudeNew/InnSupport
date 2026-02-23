import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getProject, getTickets, getStages, getWorkLogs } from '../api';
import { ArrowLeft, Plus, LayoutList, CheckCircle2, ListTodo, Clock, Target, Layout, Palette, Code, Bug, Rocket } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import CreateStageModal from './CreateStageModal';
import CreateTicketModal from './CreateTicketModal';

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [project, setProject] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [stages, setStages] = useState([]);
    const [worklogs, setWorklogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showStageModal, setShowStageModal] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);

    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                const [projRes, ticketsRes, stagesRes, logsRes] = await Promise.all([
                    getProject(id),
                    getTickets(),
                    getStages(id),
                    getWorkLogs()
                ]);

                setProject(projRes.data);
                setStages(Array.isArray(stagesRes.data) ? stagesRes.data : (stagesRes.data.results || []));

                const allTickets = Array.isArray(ticketsRes.data) ? ticketsRes.data : (ticketsRes.data.results || []);
                const projTickets = allTickets.filter(t => t.project === parseInt(id));
                setTickets(projTickets);

                const allLogs = Array.isArray(logsRes.data) ? logsRes.data : (logsRes.data.results || []);
                const ticketIds = projTickets.map(t => t.id);
                setWorklogs(allLogs.filter(l => ticketIds.includes(l.ticket)));
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

    const doneTicketsCount = tickets.filter(t => t.status === 'DONE').length;
    const openTicketsCount = tickets.filter(t => t.status !== 'DONE').length;

    // Только активные этапы (новые сверху)
    const activeStages = stages
        .filter(s => s.status === 'ACTIVE')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Задачи: Активные сверху, закрытые снизу
    const sortedTickets = [...tickets].sort((a, b) => {
        const aActive = a.status !== 'DONE';
        const bActive = b.status !== 'DONE';
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    const getIconComponent = (iconName) => {
        switch (iconName) {
            case 'palette': return <Palette size={16} />;
            case 'code': return <Code size={16} />;
            case 'bug': return <Bug size={16} />;
            case 'rocket': return <Rocket size={16} />;
            default: return <Layout size={16} />;
        }
    };

    // Данные для графиков
    const ticketStatusData = [
        { name: 'Открыто', value: tickets.filter(t => t.status === 'OPEN').length, color: '#9ca3af' },
        { name: 'В работе', value: tickets.filter(t => t.status === 'IN_PROGRESS').length, color: '#3b82f6' },
        { name: 'На проверке', value: tickets.filter(t => t.status === 'REVIEW').length, color: '#f59e0b' },
        { name: 'Готово', value: tickets.filter(t => t.status === 'DONE').length, color: '#10b981' },
    ].filter(d => d.value > 0);

    const getChartData = () => {
        const today = new Date();
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today); d.setDate(today.getDate() - i);
            days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        }
        return days.map(date => {
            const mins = worklogs.filter(log => log.created_at.startsWith(date)).reduce((acc, log) => acc + log.time_spent_minutes, 0);
            const [yyyy, mm, dd] = date.split('-');
            return { date: `${dd}.${mm}`, hours: parseFloat((mins / 60).toFixed(1)) };
        });
    };
    const timeChartData = getChartData();

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* ЭТАЛОННАЯ ШАПКА ПРОЕКТА */}
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
                        <span className="badge" style={{ background: project.status === 'CLOSED' ? '#f3f4f6' : '#ecfdf5', color: project.status === 'CLOSED' ? '#4b5563' : '#10b981' }}>
                            {project.status === 'CLOSED' ? 'Закрыт' : 'Активен'}
                        </span>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0, maxWidth: '800px', lineHeight: '1.5' }}>
                        {project.description || "У этого проекта пока нет описания."}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setShowTicketModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Задача
                    </button>
                    <button onClick={() => setShowStageModal(true)} style={{ background: 'white', border: '1px solid #e5e7eb', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151' }} className="back-btn">
                        <LayoutList size={18} /> Новый этап
                    </button>
                </div>
            </div>

            {/* ЭТАЛОННАЯ СТАТИСТИКА ПРОЕКТА */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                <div className="biz-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ background: '#fefce8', padding: '1rem', borderRadius: '14px', color: '#a16207' }}><ListTodo size={28} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: 1, marginBottom: '0.2rem' }}>{tickets.length}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Всего задач</div>
                    </div>
                </div>
                <div className="biz-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '14px', color: '#4b5563' }}><Target size={28} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: 1, marginBottom: '0.2rem' }}>{openTicketsCount}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Открыто задач</div>
                    </div>
                </div>
                <div className="biz-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '14px', color: '#15803d' }}><CheckCircle2 size={28} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: 1, marginBottom: '0.2rem' }}>{doneTicketsCount}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Выполнено</div>
                    </div>
                </div>
                <div className="biz-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '14px', color: '#3b82f6' }}><Clock size={28} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: 1, marginBottom: '0.2rem' }}>{project.total_spent_hours || 0}ч</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Затрачено всего</div>
                    </div>
                </div>
            </div>

            {/* ЭТАЛОННАЯ СЕТКА (Отображается, если мы не на вкладке статистики) */}
            {activeTab !== 'statistics' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '1rem' }}>

                    {/* Этапы */}
                    <div className="biz-card">
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>Этапы проекта</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {activeStages.length === 0 ? (
                                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>Активные этапы еще не созданы</p>
                            ) : (
                                activeStages.map(stage => (
                                    <div key={stage.id} onClick={() => navigate(`/stages/${stage.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }} className="hover-lift">
                                        <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {getIconComponent(stage.icon)}
                                        </div>
                                        <span style={{ fontWeight: '600', color: '#374151' }}>{stage.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Задачи проекта */}
                    <div className="biz-card">
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>Задачи проекта</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {sortedTickets.length === 0 ? (
                                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>Нет задач</p>
                            ) : (
                                sortedTickets.map(ticket => (
                                    <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', cursor: 'pointer' }} className="hover-lift">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? '#ef4444' : ticket.priority === 'MEDIUM' ? '#f59e0b' : '#10b981' }}></div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#111827' }}>{ticket.title}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                    #{ticket.id} • {ticket.assignee_details?.username || 'Не назначен'}
                                                    {ticket.stage_details && ` • Этап: ${ticket.stage_details.name}`}
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.3rem 0.8rem', borderRadius: '20px', background: ticket.status === 'IN_PROGRESS' ? '#eff6ff' : ticket.status === 'DONE' ? '#f0fdf4' : ticket.status === 'REVIEW' ? '#fefce8' : '#f3f4f6', color: ticket.status === 'IN_PROGRESS' ? '#1d4ed8' : ticket.status === 'DONE' ? '#15803d' : ticket.status === 'REVIEW' ? '#a16207' : '#4b5563' }}>
                                            {ticket.status === 'IN_PROGRESS' ? 'В работе' : ticket.status === 'DONE' ? 'Готово' : ticket.status === 'REVIEW' ? 'На проверке' : 'Открыто'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            )}

            {/* Вкладка Статистика */}
            {activeTab === 'statistics' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                    <div className="biz-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>Затраченное время (последние 7 дней)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timeChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="biz-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>Распределение задач</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={ticketStatusData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                                    {ticketStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {showStageModal && <CreateStageModal projectId={project.id} onClose={() => setShowStageModal(false)} onStageCreated={fetchData} />}
            {showTicketModal && <CreateTicketModal preselectedProject={project.id} onClose={() => setShowTicketModal(false)} onTicketCreated={fetchData} />}

            <style>{`
                .back-btn:hover { background: #f3f4f6 !important; }
                .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-color: #d1d5db !important; }
            `}</style>
        </div>
    );
};

export default ProjectDetail;