
import { useEffect, useState } from 'react';
import { getTickets, startTimer, stopTimer } from '../api';
import { ListTodo, Play, Square, Clock, Plus, Filter, SortAsc } from 'lucide-react';
import CreateTicketModal from './CreateTicketModal';

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchTickets = async () => {
        try {
            const response = await getTickets();
            setTickets(response.data);
        } catch (error) {
            console.error("Не удалось загрузить задачи");
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
            if (ticket.active_timer_id) {
                await stopTimer(ticket.id);
            } else {
                await startTimer(ticket.id);
            }
            await fetchTickets();
        } catch (error) {
            console.error("Ошибка таймера", error);
            alert("Не удалось обновить таймер.");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div>Загрузка задач...</div>;

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
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus size={18} /> Новая задача
                </button>
            </div>

            {showCreateModal && (
                <CreateTicketModal
                    onClose={() => setShowCreateModal(false)}
                    onTicketCreated={() => { fetchTickets(); }}
                />
            )}

            <div className="biz-card" style={{ padding: '0' }}>
                {/* Header Row */}
                <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', fontWeight: '600', color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span style={{ flex: 3 }}>Название задачи</span>
                    <span style={{ flex: 1.5 }}>Статус</span>
                    <span style={{ flex: 1.5 }}>Приоритет</span>
                    <span style={{ flex: 1.5 }}>Исполнитель</span>
                    <span style={{ flex: 1, textAlign: 'right' }}>Действия</span>
                </div>

                {tickets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                        Задач пока нет
                    </div>
                ) : (
                    tickets.map(ticket => {
                        const assigneeName = ticket.assignee_details ? (ticket.assignee_details.first_name || ticket.assignee_details.username) : "Не назначен";
                        const projectName = ticket.project_details?.name || 'Без проекта';
                        const isActive = !!ticket.active_timer_id;

                        return (
                            <div key={ticket.id} style={{
                                padding: '1.2rem 1.5rem',
                                borderBottom: '1px solid #f9fafb',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '0.95rem',
                                transition: 'background 0.2s',
                                background: isActive ? '#f0fdf4' : 'transparent', // Highlight active
                                cursor: 'pointer'
                            }} className="ticket-row-hover">

                                <div style={{ flex: 3, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: '10px',
                                        background: isActive ? '#dcfce7' : '#f3f4f6',
                                        color: isActive ? '#15803d' : '#6b7280',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        {isActive ? <Clock size={18} className="animate-spin-slow" /> : <ListTodo size={18} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.2rem' }}>
                                            {ticket.title}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                            #{ticket.id} • {projectName}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ flex: 1.5 }}>
                                    <span style={{
                                        padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600',
                                        background: ticket.status === 'IN_PROGRESS' ? '#eff6ff' : ticket.status === 'DONE' ? '#f0fdf4' : '#f9fafb',
                                        color: ticket.status === 'IN_PROGRESS' ? '#1d4ed8' : ticket.status === 'DONE' ? '#15803d' : '#4b5563'
                                    }}>
                                        {ticket.status === 'IN_PROGRESS' ? 'В работе' : ticket.status === 'DONE' ? 'Готово' : ticket.status === 'REVIEW' ? 'На проверке' : 'Открыто'}
                                    </span>
                                </div>

                                <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? '#ef4444' : ticket.priority === 'MEDIUM' ? '#f59e0b' : '#10b981' }}></div>
                                    <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                                        {ticket.priority === 'HIGH' ? 'Высокий' : ticket.priority === 'CRITICAL' ? 'Критический' : ticket.priority === 'MEDIUM' ? 'Средний' : 'Низкий'}
                                    </span>
                                </div>

                                <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: '#6b7280' }}>
                                        {ticket.assignee_details?.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <span style={{ fontSize: '0.9rem', color: '#374151' }}>{assigneeName}</span>
                                </div>

                                <div style={{ flex: 1, textAlign: 'right' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleTimer(ticket); }}
                                        disabled={actionLoading === ticket.id}
                                        style={{
                                            background: isActive ? '#fecaca' : '#f3f4f6',
                                            color: isActive ? '#dc2626' : '#374151',
                                            border: 'none',
                                            borderRadius: '8px',
                                            width: 36, height: 36,
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {actionLoading === ticket.id ? (
                                            <div className="spinner" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                        ) : isActive ? (
                                            <Square size={16} fill="currentColor" />
                                        ) : (
                                            <Play size={16} fill="currentColor" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .ticket-row-hover:hover { background: #f9fafb !important; }
            `}</style>
        </div>
    );
};

export default Tickets;
