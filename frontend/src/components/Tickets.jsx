import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTickets, startTimer, stopTimer } from '../api';
import { ListTodo, Play, Square, Clock, Plus, Filter, SortAsc } from 'lucide-react';
import CreateTicketModal from './CreateTicketModal';

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'new';

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userRole = currentUser?.profile?.role;
    const canCreateTicket = userRole && userRole !== 'EXECUTOR';

    const fetchTickets = async () => {
        try {
            const response = await getTickets();
            const data = response.data;

            // ЖЕЛЕЗОБЕТОННАЯ ПРОВЕРКА:
            // Если пришел обычный массив
            if (Array.isArray(data)) {
                setTickets(data);
            }
            // Если бэкенд вдруг включил пагинацию и вернул { results: [...] }
            else if (data && Array.isArray(data.results)) {
                setTickets(data.results);
            }
            // В любом другом случае сбрасываем в пустой массив
            else {
                setTickets([]);
            }
        } catch (error) {
            console.error("Не удалось загрузить задачи", error);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleTimer = async (ticket) => {
        setActionLoading(ticket.id);
        try {
            if (ticket.active_timer) {
                await stopTimer(ticket.id);
            } else {
                await startTimer(ticket.id, {});
            }
            await fetchTickets();
        } catch (error) {
            alert("Убедитесь, что внутри задачи выбран тип работ.");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div>Загрузка задач...</div>;

    // ГАРАНТИЯ: safeTickets всегда будет массивом, даже если useState сломался
    const safeTickets = Array.isArray(tickets) ? tickets : [];

    // Теперь .filter() никогда не вызовет ошибку
    const filteredTickets = safeTickets.filter(t => {
        if (activeTab === 'new') return t.status === 'OPEN';
        if (activeTab === 'inprogress') return t.status === 'IN_PROGRESS';
        if (activeTab === 'review') return t.status === 'REVIEW';
        if (activeTab === 'done') return t.status === 'DONE';
        return true;
    });

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="input-clean" style={{ padding: '0.6rem 1rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <Filter size={16} /> Фильтр
                    </div>
                    <div className="input-clean" style={{ padding: '0.6rem 1rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <SortAsc size={16} /> Сортировка
                    </div>
                </div>
                {canCreateTicket && (
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> Новая задача
                    </button>
                )}
            </div>

            {showCreateModal && <CreateTicketModal onClose={() => setShowCreateModal(false)} onTicketCreated={fetchTickets} />}

            <div className="biz-card" style={{ padding: '0' }}>
                <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', fontWeight: '600', color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span style={{ flex: 3 }}>Название задачи</span>
                    <span style={{ flex: 1.5 }}>Статус</span>
                    <span style={{ flex: 1.5 }}>Приоритет</span>
                    <span style={{ flex: 1.5 }}>Исполнитель</span>
                    <span style={{ flex: 1, textAlign: 'right' }}>Действия</span>
                </div>

                {filteredTickets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
                        В данной категории задач пока нет
                    </div>
                ) : (
                    filteredTickets.map(ticket => {
                        const assigneeName = ticket.assignee_details ? (ticket.assignee_details.first_name || ticket.assignee_details.username) : "Не назначен";
                        const isActive = !!ticket.active_timer;
                        return (
                            <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #f9fafb', display: 'flex', alignItems: 'center', fontSize: '0.95rem', transition: 'background 0.2s', background: isActive ? '#f0fdf4' : 'transparent', cursor: 'pointer' }} className="ticket-row-hover">
                                <div style={{ flex: 3, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: isActive ? '#dcfce7' : '#f3f4f6', color: isActive ? '#15803d' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {isActive ? <Clock size={18} className="animate-spin-slow" /> : <ListTodo size={18} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.2rem' }}>{ticket.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>#{ticket.id} • {ticket.project_details?.name || 'Без проекта'}</div>
                                    </div>
                                </div>
                                <div style={{ flex: 1.5 }}>
                                    <span style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', background: ticket.status === 'IN_PROGRESS' ? '#eff6ff' : ticket.status === 'DONE' ? '#f0fdf4' : '#f9fafb', color: ticket.status === 'IN_PROGRESS' ? '#1d4ed8' : ticket.status === 'DONE' ? '#15803d' : '#4b5563' }}>
                                        {ticket.status === 'IN_PROGRESS' ? 'В работе' : ticket.status === 'DONE' ? 'Готово' : ticket.status === 'REVIEW' ? 'На проверке' : 'Открыто'}
                                    </span>
                                </div>
                                <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? '#ef4444' : ticket.priority === 'MEDIUM' ? '#f59e0b' : '#10b981' }}></div>
                                    <span>{ticket.priority}</span>
                                </div>
                                <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>{ticket.assignee_details?.username?.[0]?.toUpperCase() || '?'}</div>
                                    <span>{assigneeName}</span>
                                </div>
                                <div style={{ flex: 1, textAlign: 'right' }}>
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