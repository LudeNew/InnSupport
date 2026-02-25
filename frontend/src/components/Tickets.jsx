import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTickets, startTimer, stopTimer, getUsers, getProjects } from '../api';
import { ListTodo, Play, Square, Clock, Plus, Filter, SortAsc, SortDesc, X, AlertOctagon } from 'lucide-react';
import CreateTicketModal from './CreateTicketModal';

const priorityLabels = {
    'LOW': 'Низкий',
    'MEDIUM': 'Средний',
    'HIGH': 'Высокий',
    'CRITICAL': 'Критический'
};

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [filterAssignee, setFilterAssignee] = useState('');
    const [filterProject, setFilterProject] = useState('');

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'open';

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userRole = currentUser?.profile?.role;
    const canCreateTicket = userRole && userRole !== 'EXECUTOR';

    const fetchData = async () => {
        try {
            const [tRes, uRes, pRes] = await Promise.all([getTickets(), getUsers(), getProjects()]);
            setTickets(Array.isArray(tRes.data) ? tRes.data : (tRes.data.results || []));
            setUsers(Array.isArray(uRes.data) ? uRes.data : (uRes.data.results || []));
            setProjects(Array.isArray(pRes.data) ? pRes.data : (pRes.data.results || []));
        } catch (error) { console.error("Ошибка загрузки", error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleTimer = async (ticket) => {
        setActionLoading(ticket.id);
        try {
            if (ticket.active_timer) await stopTimer(ticket.id);
            else await startTimer(ticket.id, {});
            await fetchData();
        } catch (error) { alert("Убедитесь, что внутри задачи выбран тип работ."); } finally { setActionLoading(null); }
    };

    if (loading) return <div>Загрузка задач...</div>;

    const safeTickets = Array.isArray(tickets) ? tickets : [];

    let filteredTickets = safeTickets.filter(t => {
        if (activeTab === 'open') return ['OPEN', 'IN_PROGRESS', 'REVIEW'].includes(t.status);
        if (activeTab === 'inprogress') return t.status === 'IN_PROGRESS';
        if (activeTab === 'review') return t.status === 'REVIEW';
        if (activeTab === 'done') return t.status === 'DONE';
        return true;
    });

    if (filterAssignee) filteredTickets = filteredTickets.filter(t => t.assignee === parseInt(filterAssignee));
    if (filterProject) filteredTickets = filteredTickets.filter(t => t.project === parseInt(filterProject));

    filteredTickets.sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
        if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sortBy === 'priority') {
            const weights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
            return (weights[b.priority] || 0) - (weights[a.priority] || 0);
        }
        return 0;
    });

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setShowFilters(!showFilters)} className="input-clean" style={{ padding: '0.6rem 1rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: showFilters ? '#e0e7ff' : 'white', color: showFilters ? '#4f46e5' : '#374151', border: showFilters ? '1px solid #4f46e5' : '1px solid #e5e7eb' }}>
                        <Filter size={16} /> Фильтры {(filterAssignee || filterProject) && <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }}></span>}
                    </button>
                    <button onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : sortBy === 'oldest' ? 'priority' : 'newest')} className="input-clean" style={{ padding: '0.6rem 1rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        {sortBy === 'newest' ? <SortDesc size={16} /> : sortBy === 'oldest' ? <SortAsc size={16} /> : <Filter size={16} color="#f59e0b" />}
                        {sortBy === 'newest' ? 'Сначала новые' : sortBy === 'oldest' ? 'Сначала старые' : 'По приоритету'}
                    </button>
                </div>
                {canCreateTicket && (
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}><Plus size={18} /> Новая задача</button>
                )}
            </div>

            {showFilters && (
                <div className="biz-card" style={{ marginBottom: '2rem', padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-end', background: '#f9fafb' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Проект</label>
                        <select className="input-clean" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                            <option value="">Все проекты</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Исполнитель</label>
                        <select className="input-clean" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
                            <option value="">Все исполнители</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.first_name || u.username}</option>)}
                        </select>
                    </div>
                    <button onClick={() => { setFilterProject(''); setFilterAssignee(''); }} style={{ padding: '0.8rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', color: '#dc2626' }} title="Сбросить">
                        <X size={20} />
                    </button>
                </div>
            )}

            {showCreateModal && <CreateTicketModal onClose={() => setShowCreateModal(false)} onTicketCreated={fetchData} />}

            <div className="biz-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', fontWeight: '600', color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span style={{ flex: 3.5 }}>Название и Детали задачи</span><span style={{ flex: 1.2 }}>Статус</span><span style={{ flex: 1.2 }}>Приоритет</span><span style={{ flex: 1.5 }}>Исполнитель</span><span style={{ flex: 0.8, textAlign: 'right' }}>Действия</span>
                </div>

                {filteredTickets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>В данной категории задач пока нет</div>
                ) : (
                    filteredTickets.map(ticket => {
                        const assigneeName = ticket.assignee_details ? (ticket.assignee_details.first_name || ticket.assignee_details.username) : "Не назначен";
                        const isActive = !!ticket.active_timer;
                        const isCritical = ticket.priority === 'CRITICAL';

                        const rowBackground = isActive ? '#f0fdf4' : isCritical ? '#fff1f2' : 'transparent';
                        const rowBorderLeft = isActive ? '4px solid #22c55e' : isCritical ? '4px solid #ef4444' : '4px solid transparent';

                        return (
                            <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #f9fafb', display: 'flex', alignItems: 'center', fontSize: '0.95rem', transition: 'all 0.2s', background: rowBackground, borderLeft: rowBorderLeft, cursor: 'pointer' }} className={!isActive && !isCritical ? "ticket-row-hover" : ""}>

                                <div style={{ flex: 3.5, display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: isActive ? '#dcfce7' : isCritical ? '#fecaca' : '#f3f4f6', color: isActive ? '#15803d' : isCritical ? '#dc2626' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                                        {isActive ? <Clock size={18} className="animate-spin-slow" /> : isCritical ? <AlertOctagon size={18} /> : <ListTodo size={18} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', color: isCritical ? '#991b1b' : '#111827', marginBottom: '0.3rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {ticket.title}
                                        </div>

                                        {/* ИСПРАВЛЕНО: Чистые, минималистичные метки через точку */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: '#6b7280' }}>
                                            <span style={{ fontWeight: '600' }}>#{ticket.id}</span>

                                            {ticket.project_details && (
                                                <><span>•</span><span>{ticket.project_details.name}</span></>
                                            )}

                                            {ticket.stage_details && (
                                                <><span>•</span><span>{ticket.stage_details.name}</span></>
                                            )}

                                            {ticket.tags_details?.length > 0 && <span>•</span>}
                                            {ticket.tags_details?.map(tag => (
                                                <span key={tag.id} style={{ color: tag.color, fontWeight: '500' }}>
                                                    #{tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ flex: 1.2 }}>
                                    <span style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', background: ticket.status === 'IN_PROGRESS' ? '#eff6ff' : ticket.status === 'DONE' ? '#f0fdf4' : isCritical ? 'transparent' : '#f9fafb', color: ticket.status === 'IN_PROGRESS' ? '#1d4ed8' : ticket.status === 'DONE' ? '#15803d' : isCritical ? '#991b1b' : '#4b5563', border: isCritical && ticket.status !== 'DONE' ? '1px solid #fecaca' : 'none' }}>
                                        {ticket.status === 'IN_PROGRESS' ? 'В работе' : ticket.status === 'DONE' ? 'Готово' : ticket.status === 'REVIEW' ? 'На проверке' : 'Открыто'}
                                    </span>
                                </div>
                                <div style={{ flex: 1.2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: isCritical ? '#ef4444' : ticket.priority === 'HIGH' ? '#f97316' : ticket.priority === 'MEDIUM' ? '#f59e0b' : '#10b981' }}></div>
                                    <span style={{ fontWeight: isCritical ? 'bold' : 'normal', color: isCritical ? '#ef4444' : 'inherit' }}>
                                        {priorityLabels[ticket.priority] || ticket.priority}
                                    </span>
                                </div>
                                <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: isCritical ? '#fecaca' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: isCritical ? '#dc2626' : '#6b7280' }}>
                                        {ticket.assignee_details?.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <span style={{ color: isCritical ? '#991b1b' : 'inherit' }}>{assigneeName}</span>
                                </div>
                                <div style={{ flex: 0.8, textAlign: 'right' }}>
                                    <button onClick={(e) => { e.stopPropagation(); handleTimer(ticket); }} disabled={actionLoading === ticket.id} style={{ background: isActive ? '#fecaca' : '#f3f4f6', color: isActive ? '#dc2626' : '#374151', border: 'none', borderRadius: '8px', width: 36, height: 36, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {isActive ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <style>{`.ticket-row-hover:hover { background: #f9fafb !important; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default Tickets;