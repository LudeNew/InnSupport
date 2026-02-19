
import { useEffect, useState } from 'react';
import { getDashboardStats } from '../api';
import { Ticket, Clock, CheckCircle2, Link } from 'lucide-react';

const Dashboard = () => {
    const [data, setData] = useState({
        stats: { assigned_count: 0, total_projects: 0, my_worked_minutes_today: 0 },
        assigned_tickets: [],
        recent_logs: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getDashboardStats();
                setData(response.data);
            } catch (error) {
                console.error("Не удалось загрузить данные дашборда", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div>Загрузка...</div>;

    const formatMinutes = (minutes) => {
        if (!minutes) return "0ч 0м";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}ч ${m}м`;
    };

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                <div className="biz-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ background: '#f3f4f6', padding: '0.8rem', borderRadius: '14px', color: '#1f2937' }}>
                            <Ticket size={24} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '600' }}>+12%</span>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.5rem' }}>
                        {data.stats.assigned_count}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Назначено задач</div>
                </div>

                <div className="biz-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ background: '#fefce8', padding: '0.8rem', borderRadius: '14px', color: '#a16207' }}>
                            <Clock size={24} />
                        </div>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.5rem' }}>
                        {formatMinutes(data.stats.my_worked_minutes_today)}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Время сегодня</div>
                </div>

                <div className="biz-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ background: '#f0fdf4', padding: '0.8rem', borderRadius: '14px', color: '#15803d' }}>
                            <CheckCircle2 size={24} />
                        </div>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.5rem' }}>
                        85%
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Эффективность</div>
                </div>

                <div className="biz-card" style={{ background: '#111827', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '14px', color: 'white' }}>
                            <Link size={24} />
                        </div>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.5rem' }}>
                        {data.stats.total_projects}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: '500' }}>Активных проектов</div>
                </div>
            </div>

            {/* Split View */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* My Tasks */}
                <div className="biz-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>Мои текущие задачи</h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>Показать все</div>
                    </div>

                    {data.assigned_tickets.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem 0' }}>Задач нет. Отличная работа!</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {data.assigned_tickets.map(ticket => (
                                <div key={ticket.id} style={{
                                    padding: '1rem',
                                    background: '#f9fafb',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: '1px solid transparent',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: '12px',
                                            background: ticket.status === 'IN_PROGRESS' ? '#eff6ff' : 'white',
                                            color: ticket.status === 'IN_PROGRESS' ? '#1d4ed8' : '#9ca3af',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 'bold', fontSize: '0.9rem',
                                            border: '1px solid rgba(0,0,0,0.05)'
                                        }}>
                                            #{ticket.id}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', marginBottom: '0.2rem', fontSize: '0.95rem' }}>{ticket.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {ticket.project_details?.name || 'Проект'} • {ticket.priority}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`badge status-${ticket.status.toLowerCase().replace('_', '')}`} style={{ fontSize: '0.7rem' }}>
                                        {ticket.status === 'IN_PROGRESS' ? 'В работе' : ticket.status === 'DONE' ? 'Готово' : ticket.status === 'REVIEW' ? 'На проверке' : 'Открыто'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Activity Feed */}
                <div className="biz-card">
                    <h3>Активность</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                        {data.recent_logs.map((log, i) => (
                            <div key={i} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                                {/* Timeline Line */}
                                {i !== data.recent_logs.length - 1 && (
                                    <div style={{ position: 'absolute', left: 16, top: 32, bottom: -24, width: 2, background: '#f3f4f6' }}></div>
                                )}

                                <div style={{
                                    width: 34, height: 34, borderRadius: '50%', background: '#f3f4f6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0, zIndex: 1
                                }}>
                                    {log.user_details?.username?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '0.2rem' }}>
                                        <span style={{ fontWeight: '600' }}>{log.user_details?.username}</span> затрекал {log.time_spent_minutes}м в <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>#{log.ticket}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
