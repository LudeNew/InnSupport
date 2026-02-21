import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../api';
import { Ticket, Clock, CheckCircle2, Link, Calendar as CalendarIcon } from 'lucide-react';

const Dashboard = () => {
    const [data, setData] = useState({
        stats: { assigned_count: 0, total_projects: 0, my_worked_minutes_today: 0, completed_tasks_month: 0 },
        assigned_tickets: [],
        recent_logs: []
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getDashboardStats();
                const resData = response.data || {};

                // ЖЕЛЕЗОБЕТОННАЯ ПРОВЕРКА ДАННЫХ
                setData({
                    stats: {
                        assigned_count: resData.stats?.assigned_count || 0,
                        total_projects: resData.stats?.total_projects || 0,
                        my_worked_minutes_today: resData.stats?.my_worked_minutes_today || 0,
                        completed_tasks_month: 24 // Моковая метрика
                    },
                    assigned_tickets: Array.isArray(resData.assigned_tickets) ? resData.assigned_tickets : [],
                    recent_logs: Array.isArray(resData.recent_logs) ? resData.recent_logs : []
                });
            } catch (error) {
                console.error("Не удалось загрузить данные дашборда", error);
                // Защита от падения при ошибке сервера
                setData({
                    stats: { assigned_count: 0, total_projects: 0, my_worked_minutes_today: 0, completed_tasks_month: 0 },
                    assigned_tickets: [],
                    recent_logs: []
                });
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div>Загрузка дашборда...</div>;

    const formatMinutes = (minutes) => {
        if (!minutes) return "0ч 0м";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}ч ${m}м`;
    };

    const companyEvents = [
        { id: 1, title: 'Запуск нового функционала', content: 'Сегодня мы выкатили релиз новой версии системы управления проектами. Ознакомьтесь с документацией.', date: '2026-02-20', author: 'Admin' },
        { id: 2, title: 'Собрание отдела разработки', content: 'Напоминаем, что в пятницу в 16:00 пройдет общее демо результатов спринта.', date: '2026-02-18', author: 'HR Team' },
    ];

    // Гарантируем массивы для рендера
    const safeTickets = Array.isArray(data.assigned_tickets) ? data.assigned_tickets : [];
    const safeLogs = Array.isArray(data.recent_logs) ? data.recent_logs : [];

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: '#111827' }}>Добро пожаловать в рабочее пространство</h1>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>Вот что происходит в ваших проектах сегодня.</p>
            </div>

            {/* ВКЛАДКА: ОБЗОР */}
            {activeTab === 'overview' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                        <div className="biz-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ background: '#f3f4f6', padding: '0.8rem', borderRadius: '14px', color: '#1f2937' }}><Ticket size={24} /></div>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.5rem', color: '#111827' }}>
                                {data.stats.assigned_count}
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Мои открытые задачи</div>
                        </div>

                        <div className="biz-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ background: '#fefce8', padding: '0.8rem', borderRadius: '14px', color: '#a16207' }}><Clock size={24} /></div>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.5rem', color: '#111827' }}>
                                {formatMinutes(data.stats.my_worked_minutes_today)}
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Отработано сегодня</div>
                        </div>

                        <div className="biz-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ background: '#f0fdf4', padding: '0.8rem', borderRadius: '14px', color: '#15803d' }}><CheckCircle2 size={24} /></div>
                                <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '600', background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>За месяц</span>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.5rem', color: '#111827' }}>
                                {data.stats.completed_tasks_month}
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Закрыто задач</div>
                        </div>

                        <div className="biz-card" style={{ background: '#4f46e5', color: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.8rem', borderRadius: '14px', color: 'white' }}><Link size={24} /></div>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.5rem' }}>
                                {data.stats.total_projects}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: '500' }}>Активных проектов</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                        <div className="biz-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0 }}>Задачи в фокусе</h3>
                            </div>

                            {safeTickets.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #e5e7eb' }}>
                                    <Ticket size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                                    <p style={{ margin: 0 }}>На вас нет активных задач. Отличная работа!</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {safeTickets.map(ticket => (
                                        <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} style={{ padding: '1rem 1.2rem', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e7eb', transition: 'all 0.2s', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} className="ticket-card-hover">
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? '#ef4444' : ticket.priority === 'MEDIUM' ? '#f59e0b' : '#10b981' }}></div>
                                                <div>
                                                    <div style={{ fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.95rem', color: '#111827' }}>{ticket.title}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontWeight: '500' }}>#{ticket.id}</span>
                                                        <span>•</span>
                                                        <span>{ticket.project_details?.name || 'Проект'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.3rem 0.8rem', borderRadius: '20px', background: ticket.status === 'IN_PROGRESS' ? '#eff6ff' : '#f3f4f6', color: ticket.status === 'IN_PROGRESS' ? '#1d4ed8' : '#4b5563' }}>
                                                {ticket.status === 'IN_PROGRESS' ? 'В работе' : 'Открыто'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="biz-card">
                            <h3 style={{ margin: '0 0 1.5rem 0' }}>Недавняя активность</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {safeLogs.length === 0 && <p style={{ color: '#9ca3af' }}>Нет недавней активности</p>}
                                {safeLogs.map((log, i) => (
                                    <div key={log.id || i} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                                        {i !== safeLogs.length - 1 && <div style={{ position: 'absolute', left: 16, top: 32, bottom: -24, width: 2, background: '#f3f4f6' }}></div>}
                                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0, zIndex: 1 }}>
                                            {log.user_details?.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '0.2rem', color: '#374151' }}>
                                                <span style={{ fontWeight: '600', color: '#111827' }}>{log.user_details?.username || 'Сотрудник'}</span> затрекал {log.time_spent_minutes}м в <span style={{ fontWeight: '600', color: '#4f46e5', cursor: 'pointer' }} onClick={() => navigate(`/tickets/${log.ticket}`)}>#{log.ticket}</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ВКЛАДКА: АНАЛИТИКА */}
            {activeTab === 'analytics' && (
                <div className="biz-card" style={{ minHeight: '400px' }}>
                    <h2 style={{ margin: '0 0 1.5rem 0' }}>Продуктивность по дням</h2>
                    <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Здесь будет выводиться график распределения затраченного времени и выполненных задач.</p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '250px', padding: '1rem', borderBottom: '2px solid #e5e7eb', borderLeft: '2px solid #e5e7eb' }}>
                        {[40, 70, 45, 90, 60, 30, 80].map((height, i) => (
                            <div key={i} style={{ flex: 1, background: '#4f46e5', height: `${height}%`, borderRadius: '4px 4px 0 0', opacity: 0.8, transition: 'height 0.3s' }}></div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', color: '#9ca3af', fontSize: '0.8rem' }}>
                        <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
                    </div>
                </div>
            )}

            {/* ВКЛАДКА: СОБЫТИЯ */}
            {activeTab === 'events' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {companyEvents.map(event => (
                        <div key={event.id} className="biz-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, color: '#111827', fontSize: '1.2rem' }}>{event.title}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#6b7280', fontSize: '0.85rem' }}><CalendarIcon size={14} /><span>{event.date}</span></div>
                            </div>
                            <p style={{ color: '#4b5563', lineHeight: '1.6', margin: '0 0 1rem 0' }}>{event.content}</p>
                            <div style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontWeight: 'bold' }}>{event.author[0]}</div>
                                Автор: {event.author}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .ticket-card-hover:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
                    border-color: #d1d5db !important;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;