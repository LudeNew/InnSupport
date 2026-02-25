import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getProject, getTickets, getStages, getWorkLogs, getProjectReleases, publishProjectRelease } from '../api';
import { ArrowLeft, Plus, LayoutList, CheckCircle2, ListTodo, Clock, Target, Layout, Palette, Code, Bug, Rocket, FolderKanban, Globe, Gitlab, Figma } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import CreateStageModal from './CreateStageModal';
import CreateTicketModal from './CreateTicketModal';
import CreateReleaseModal from './CreateReleaseModal';

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [project, setProject] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [stages, setStages] = useState([]);
    const [releases, setReleases] = useState([]);
    const [worklogs, setWorklogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showStageModal, setShowStageModal] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('Все');

    const fetchProjectData = useCallback(async () => {
        try {
            const [projRes, ticketsRes, stagesRes, logsRes, releasesRes] = await Promise.all([
                getProject(id), getTickets(), getStages(id), getWorkLogs(), getProjectReleases(id)
            ]);

            setProject(projRes.data);
            setStages(Array.isArray(stagesRes.data) ? stagesRes.data : (stagesRes.data.results || []));
            setReleases(Array.isArray(releasesRes.data) ? releasesRes.data : (releasesRes.data.results || []));

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
    }, [id]);

    useEffect(() => { fetchProjectData(); }, [fetchProjectData]);

    const handlePublishRelease = async (releaseId) => {
        if (window.confirm("Вы уверены, что хотите выпустить этот релиз?")) {
            try {
                await publishProjectRelease(releaseId);
                fetchProjectData();
            } catch (e) { console.error(e); }
        }
    };

    if (loading) return <div>Загрузка проекта...</div>;
    if (!project) return <div>Проект не найден.</div>;

    const doneTicketsCount = tickets.filter(t => t.status === 'DONE').length;
    const openTicketsCount = tickets.filter(t => t.status !== 'DONE').length;

    const getIconComponent = (iconName) => {
        switch (iconName) {
            case 'palette': return <Palette size={16} />;
            case 'code': return <Code size={16} />;
            case 'bug': return <Bug size={16} />;
            case 'rocket': return <Rocket size={16} />;
            default: return <Layout size={16} />;
        }
    };

    const allSortedStages = [...stages].sort((a, b) => {
        if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
        if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
        return new Date(b.created_at) - new Date(a.created_at);
    });
    const activeStages = allSortedStages.filter(s => s.status === 'ACTIVE');

    const priorityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const ticketsSortedByPriority = [...tickets].sort((a, b) => {
        if (a.status === 'DONE' && b.status !== 'DONE') return 1;
        if (a.status !== 'DONE' && b.status === 'DONE') return -1;
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    });

    const ticketsSortedByDate = [...tickets].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const groupedTicketsByMonth = ticketsSortedByDate.reduce((acc, t) => {
        const date = new Date(t.created_at);
        const monthYear = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
        const capitalized = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
        if (!acc[capitalized]) acc[capitalized] = [];
        acc[capitalized].push(t);
        return acc;
    }, {});

    const availableMonths = ['Все', ...Object.keys(groupedTicketsByMonth)];

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

    const renderTicket = (ticket) => (
        <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', cursor: 'pointer', marginBottom: '0.8rem' }} className="hover-lift">
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
    );

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* ШАПКА И КНОПКИ */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                <button onClick={() => navigate('/projects')} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', transition: 'all 0.2s' }} className="back-btn">
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '1rem' }}>
                        {project.website_link && (
                            <a href={project.website_link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4b5563', textDecoration: 'none', background: 'white', border: '1px solid #e5e7eb', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }} className="hover-lift">
                                <Globe size={16} color="#3b82f6" /> Сайт проекта
                            </a>
                        )}
                        {project.gitlab_link && (
                            <a href={project.gitlab_link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4b5563', textDecoration: 'none', background: 'white', border: '1px solid #e5e7eb', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }} className="hover-lift">
                                <Gitlab size={16} color="#f97316" /> GitLab
                            </a>
                        )}
                        {project.figma_link && (
                            <a href={project.figma_link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4b5563', textDecoration: 'none', background: 'white', border: '1px solid #e5e7eb', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }} className="hover-lift">
                                <Figma size={16} color="#a855f7" /> Figma
                            </a>
                        )}
                    </div>
                </div>
                {/* ИСПРАВЛЕННЫЕ КНОПКИ */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                    <button onClick={() => setShowTicketModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Задача
                    </button>
                    <button onClick={() => setShowStageModal(true)} style={{ background: 'white', border: '1px solid #e5e7eb', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151' }} className="hover-lift">
                        <LayoutList size={18} /> Новый этап
                    </button>
                    <button onClick={() => setShowReleaseModal(true)} style={{ background: 'white', border: '1px solid #e5e7eb', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151' }} className="hover-lift">
                        <Rocket size={18} /> Новый релиз
                    </button>
                </div>
            </div>

            {/* СТАТИСТИКА */}
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

            {/* ВКЛАДКА: ОБЩЕЕ (Добавлены Релизы проекта) */}
            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '1rem' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* ИСПРАВЛЕНИЕ: БЛОК РЕЛИЗОВ В КАРТОЧКЕ */}
                        <div className="biz-card">
                            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Rocket size={20} color="#4f46e5" /> Релизы проекта
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {releases.length === 0 ? (
                                    <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem 0', margin: 0, fontSize: '0.9rem' }}>Запланированных релизов нет</p>
                                ) : (
                                    releases.slice(0, 3).map(release => (
                                        <div key={release.id} onClick={() => navigate(`?tab=releases`)} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="hover-lift">
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#111827', fontSize: '1rem' }}>{release.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.2rem' }}>v{release.version}</div>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '0.3rem 0.6rem', borderRadius: '8px', background: release.status === 'PUBLISHED' ? '#ecfdf5' : '#fffbeb', color: release.status === 'PUBLISHED' ? '#10b981' : '#d97706' }}>
                                                {release.status === 'PUBLISHED' ? 'Выпущен' : 'В планах'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="biz-card">
                            <h3 style={{ margin: '0 0 1.5rem 0' }}>Активные этапы</h3>
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
                    </div>

                    <div className="biz-card">
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>Задачи (по приоритету)</h3>
                        <div>
                            {ticketsSortedByPriority.length === 0 ? (
                                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>Нет задач</p>
                            ) : (
                                ticketsSortedByPriority.map(renderTicket)
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ВКЛАДКА: ЭТАПЫ */}
            {activeTab === 'stages' && (
                <div className="biz-card" style={{ marginTop: '1rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0' }}>Все этапы проекта</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {allSortedStages.length === 0 ? (
                            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>У проекта пока нет этапов</p>
                        ) : (
                            allSortedStages.map(stage => (
                                <div key={stage.id} onClick={() => navigate(`/stages/${stage.id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: stage.status === 'CLOSED' ? '#f9fafb' : 'white', borderRadius: '12px', border: '1px solid #e5e7eb', cursor: 'pointer', opacity: stage.status === 'CLOSED' ? 0.7 : 1 }} className="hover-lift">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '10px', background: stage.status === 'CLOSED' ? '#e5e7eb' : '#e0e7ff', color: stage.status === 'CLOSED' ? '#6b7280' : '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {getIconComponent(stage.icon)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#111827', fontSize: '1.1rem' }}>{stage.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.2rem' }}>Создан: {new Date(stage.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <span className="badge" style={{ background: stage.status === 'CLOSED' ? '#f3f4f6' : '#ecfdf5', color: stage.status === 'CLOSED' ? '#4b5563' : '#10b981' }}>
                                        {stage.status === 'CLOSED' ? 'Закрыт' : 'Активен'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ВКЛАДКА: ЗАДАЧИ */}
            {activeTab === 'tickets' && (
                <div className="biz-card" style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Задачи проекта</h3>
                    </div>
                    {Object.keys(groupedTicketsByMonth).length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            {availableMonths.map(month => (
                                <button key={month} onClick={() => setSelectedMonth(month)} style={{ background: selectedMonth === month ? '#111827' : '#f3f4f6', color: selectedMonth === month ? 'white' : '#4b5563', border: 'none', padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    {month}
                                </button>
                            ))}
                        </div>
                    )}
                    <div>
                        {Object.keys(groupedTicketsByMonth).length === 0 ? (
                            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0', margin: 0 }}>В проекте еще нет задач</p>
                        ) : (
                            Object.entries(groupedTicketsByMonth).map(([month, ticketsInMonth]) => {
                                if (selectedMonth !== 'Все' && selectedMonth !== month) return null;
                                return (
                                    <div key={month} style={{ marginBottom: '2rem' }}>
                                        {selectedMonth === 'Все' && <h4 style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.8rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.4rem' }}>{month}</h4>}
                                        {ticketsInMonth.map(renderTicket)}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* ВКЛАДКА: РЕЛИЗЫ */}
            {activeTab === 'releases' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                    {releases.length === 0 ? (
                        <div className="biz-card"><p style={{ color: '#9ca3af', textAlign: 'center', margin: 0, padding: '2rem 0' }}>Релизов пока нет</p></div>
                    ) : (
                        releases.map(release => {
                            const totalTix = release.stages_details?.reduce((acc, stage) => acc + (stage.total_tickets_count || 0), 0) || 0;
                            const doneTix = release.stages_details?.reduce((acc, stage) => acc + (stage.done_tickets_count || 0), 0) || 0;
                            const openTix = release.stages_details?.reduce((acc, stage) => acc + (stage.open_tickets_count || 0), 0) || 0;
                            const progress = totalTix === 0 ? 0 : Math.round((doneTix / totalTix) * 100);

                            return (
                                <div key={release.id} className="biz-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#111827' }}>{release.name}</h3>
                                                <span className="badge" style={{ background: '#f3f4f6', color: '#4b5563', fontWeight: 'bold' }}>v{release.version}</span>
                                                <span className="badge" style={{ background: release.status === 'PUBLISHED' ? '#ecfdf5' : '#fffbeb', color: release.status === 'PUBLISHED' ? '#10b981' : '#d97706' }}>
                                                    {release.status === 'PUBLISHED' ? 'Выпущен' : 'В планах'}
                                                </span>
                                            </div>
                                            <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                                                Запланирован на: <span style={{ fontWeight: '500' }}>{release.release_date ? new Date(release.release_date).toLocaleDateString() : 'Не указана'}</span>
                                            </div>
                                        </div>
                                        {release.status !== 'PUBLISHED' && (
                                            <button onClick={() => handlePublishRelease(release.id)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                                                <Rocket size={16} /> Выпустить релиз
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                            <span style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>Готовность релиза</span>
                                            <span style={{ fontWeight: '800', color: progress === 100 ? '#10b981' : '#4f46e5' }}>{progress}%</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
                                            <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#10b981' : '#4f46e5', transition: 'width 0.8s ease' }}></div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={16} color="#10b981" /> {doneTix} выполнено</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Target size={16} color="#ef4444" /> {openTix} осталось</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 style={{ margin: '0 0 0.8rem 0', color: '#4b5563', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Этапы в релизе:</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {release.stages_details?.length === 0 ? (
                                                <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Этапы не привязаны</span>
                                            ) : (
                                                release.stages_details?.map(stage => (
                                                    <div key={stage.id} onClick={() => navigate(`/stages/${stage.id}`)} style={{ background: 'white', border: '1px solid #e5e7eb', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="hover-lift">
                                                        <LayoutList size={14} color="#4f46e5" /> {stage.name}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* ВКЛАДКА: СТАТИСТИКА */}
            {activeTab === 'statistics' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                    <div className="biz-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>Затраченное время (последние 7 дней)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timeChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} cursor={{ fill: 'transparent' }} />
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

            {showStageModal && <CreateStageModal projectId={project.id} onClose={() => setShowStageModal(false)} onStageCreated={fetchProjectData} />}
            {showTicketModal && <CreateTicketModal preselectedProject={project.id} onClose={() => setShowTicketModal(false)} onTicketCreated={fetchProjectData} />}
            {showReleaseModal && <CreateReleaseModal projectId={project.id} onClose={() => setShowReleaseModal(false)} onReleaseCreated={fetchProjectData} />}

            <style>{`
                .back-btn:hover { background: #f3f4f6 !important; }
                .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-color: #d1d5db !important; }
            `}</style>
        </div>
    );
};

export default ProjectDetail;