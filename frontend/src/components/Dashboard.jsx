import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getDashboardStats, getCompanyEvents, createCompanyEvent, getTickets, getWorkLogs, getEventLabels } from '../api';
import { Ticket, Clock, CheckCircle2, Link, Calendar as CalendarIcon, Plus, Target, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Dashboard = () => {
    const [data, setData] = useState({
        stats: { my_assigned_count: 0, total_assigned_count: 0, my_worked_minutes_today: 0, total_worked_minutes_today: 0, my_completed_tasks_month: 0, total_completed_tasks_month: 0, total_projects: 0 },
        assigned_tickets: [],
        recent_logs: []
    });

    const [events, setEvents] = useState([]);
    const [eventLabels, setEventLabels] = useState([]);
    const [showEventModal, setShowEventModal] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', content: '', label: '' });

    const [analyticsData, setAnalyticsData] = useState({ tickets: [], logs: [] });
    const [analyticsPeriod, setAnalyticsPeriod] = useState('week'); // week, month, year
    const [periodOffset, setPeriodOffset] = useState(0); // Смещение для перелистывания календаря

    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userRole = currentUser.profile?.role;
    const canManageEvents = userRole === 'ADMIN' || userRole === 'GENERAL_MANAGER';

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const dashRes = await getDashboardStats();
                setData({
                    stats: dashRes.data.stats || {},
                    assigned_tickets: Array.isArray(dashRes.data.assigned_tickets) ? dashRes.data.assigned_tickets : [],
                    recent_logs: Array.isArray(dashRes.data.recent_logs) ? dashRes.data.recent_logs : []
                });

                if (activeTab === 'events') {
                    const [evRes, lblRes] = await Promise.all([getCompanyEvents(), getEventLabels()]);
                    setEvents(Array.isArray(evRes.data) ? evRes.data : (evRes.data.results || []));
                    const labels = Array.isArray(lblRes.data) ? lblRes.data : (lblRes.data.results || []);
                    setEventLabels(labels);
                    if (labels.length > 0) setNewEvent(prev => ({ ...prev, label: labels[0].id }));
                }

                if (activeTab === 'analytics') {
                    const [tRes, lRes] = await Promise.all([getTickets(), getWorkLogs()]);
                    setAnalyticsData({
                        tickets: Array.isArray(tRes.data) ? tRes.data : (tRes.data.results || []),
                        logs: Array.isArray(lRes.data) ? lRes.data : (lRes.data.results || [])
                    });
                }
            } catch (error) {
                console.error("Ошибка загрузки дашборда", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [activeTab]);

    const formatMinutes = (minutes) => `${Math.floor(minutes / 60)}ч ${minutes % 60}м`;

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            await createCompanyEvent({
                title: newEvent.title,
                content: newEvent.content,
                label: newEvent.label || null
            });
            setShowEventModal(false);
            const evRes = await getCompanyEvents();
            setEvents(Array.isArray(evRes.data) ? evRes.data : (evRes.data.results || []));
            setNewEvent({ title: '', content: '', label: eventLabels.length > 0 ? eventLabels[0].id : '' });
        } catch (error) { alert("Ошибка создания события"); }
    };

    // --- ОБЗОР: ПОДГОТОВКА ДАННЫХ ---
    const safeTickets = data.assigned_tickets;
    const safeLogs = data.recent_logs;

    // Сортировка задач по приоритету
    const priorityWeight = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    const sortedTickets = [...safeTickets].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    // Объединенная активность (Логи + Назначение задач) с сортировкой от новых к старым
    const activities = [
        ...safeLogs.map(log => ({ type: 'log', date: log.created_at, data: log })),
        ...safeTickets.map(ticket => ({ type: 'ticket', date: ticket.created_at, data: ticket }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);


    // --- АНАЛИТИКА: ПОДГОТОВКА ДАННЫХ ---
    const ticketStatusData = [
        { name: 'Открыто', value: analyticsData.tickets.filter(t => t.status === 'OPEN').length, color: '#9ca3af' },
        { name: 'В работе', value: analyticsData.tickets.filter(t => t.status === 'IN_PROGRESS').length, color: '#3b82f6' },
        { name: 'На проверке', value: analyticsData.tickets.filter(t => t.status === 'REVIEW').length, color: '#f59e0b' },
        { name: 'Готово', value: analyticsData.tickets.filter(t => t.status === 'DONE').length, color: '#10b981' },
    ].filter(d => d.value > 0);

    const handlePeriodChange = (period) => {
        setAnalyticsPeriod(period);
        setPeriodOffset(0); // Сбрасываем смещение при смене типа периода
    };

    const getChartData = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        if (analyticsPeriod === 'year') {
            const targetYear = currentYear + periodOffset;
            const months = [...Array(12)].map((_, i) => `${targetYear}-${String(i + 1).padStart(2, '0')}`);
            return months.map(m => {
                const mins = analyticsData.logs.filter(log => log.created_at.startsWith(m)).reduce((acc, log) => acc + log.time_spent_minutes, 0);
                const completed = analyticsData.tickets.filter(t => t.status === 'DONE' && t.updated_at?.startsWith(m)).length;
                const [year, month] = m.split('-');
                return { date: `${month}.${year.slice(2)}`, hours: parseFloat((mins / 60).toFixed(1)), completed };
            });
        }
        else if (analyticsPeriod === 'month') {
            const targetDate = new Date(currentYear, currentMonth + periodOffset, 1);
            const targetYearCalc = targetDate.getFullYear();
            const targetMonthCalc = targetDate.getMonth();
            const numDays = new Date(targetYearCalc, targetMonthCalc + 1, 0).getDate();

            const days = [];
            for (let i = 1; i <= numDays; i++) {
                const m = String(targetMonthCalc + 1).padStart(2, '0');
                const d = String(i).padStart(2, '0');
                days.push(`${targetYearCalc}-${m}-${d}`);
            }
            return days.map(date => {
                const mins = analyticsData.logs.filter(log => log.created_at.startsWith(date)).reduce((acc, log) => acc + log.time_spent_minutes, 0);
                const completed = analyticsData.tickets.filter(t => t.status === 'DONE' && t.updated_at?.startsWith(date)).length;
                const [yyyy, mm, dd] = date.split('-');
                return { date: `${dd}.${mm}`, hours: parseFloat((mins / 60).toFixed(1)), completed };
            });
        }
        else {
            const dayOfWeek = today.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const monday = new Date(today);
            monday.setDate(today.getDate() + diffToMonday + (periodOffset * 7)); // Учитываем смещение по неделям

            const days = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                days.push(`${yyyy}-${mm}-${dd}`);
            }

            return days.map(date => {
                const mins = analyticsData.logs.filter(log => log.created_at.startsWith(date)).reduce((acc, log) => acc + log.time_spent_minutes, 0);
                const completed = analyticsData.tickets.filter(t => t.status === 'DONE' && t.updated_at?.startsWith(date)).length;
                const [yyyy, mm, dd] = date.split('-');
                return { date: `${dd}.${mm}`, hours: parseFloat((mins / 60).toFixed(1)), completed };
            });
        }
    };

    const timeChartData = getChartData();

    // Кастомный тултип для графика
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'white', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#111827' }}>{label}</p>
                    <p style={{ margin: '0 0 0.3rem 0', color: '#4f46e5', fontSize: '0.9rem' }}>⏱ Отработано: {payload[0].value} ч.</p>
                    <p style={{ margin: 0, color: '#10b981', fontSize: '0.9rem' }}>✅ Закрыто задач: {payload[0].payload.completed}</p>
                </div>
            );
        }
        return null;
    };

    if (loading) return <div>Загрузка дашборда...</div>;

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: '#111827' }}>Добро пожаловать, {currentUser.first_name || currentUser.username}!</h1>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>Вот что происходит в рабочем пространстве сегодня.</p>
                </div>
                {activeTab === 'events' && canManageEvents && (
                    <button className="btn btn-primary" onClick={() => setShowEventModal(true)}><Plus size={18} /> Создать новость</button>
                )}
            </div>

            {/* ВКЛАДКА: ОБЗОР */}
            {activeTab === 'overview' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                        <div className="biz-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ background: '#f3f4f6', padding: '0.8rem', borderRadius: '14px', color: '#1f2937' }}><Ticket size={24} /></div>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.4rem', color: '#111827' }}>{data.stats.my_assigned_count}</div>
                            <div style={{ color: '#111827', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.4rem' }}>Мои открытые задачи</div>
                            <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Всего в компании: {data.stats.total_assigned_count}</div>
                        </div>

                        <div className="biz-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ background: '#eff6ff', padding: '0.8rem', borderRadius: '14px', color: '#3b82f6' }}><Clock size={24} /></div>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.4rem', color: '#111827' }}>{formatMinutes(data.stats.my_worked_minutes_today)}</div>
                            <div style={{ color: '#111827', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.4rem' }}>Отработано сегодня</div>
                            <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Всего за день: {formatMinutes(data.stats.total_worked_minutes_today)}</div>
                        </div>

                        <div className="biz-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ background: '#f0fdf4', padding: '0.8rem', borderRadius: '14px', color: '#15803d' }}><CheckCircle2 size={24} /></div>
                                <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600', background: '#dcfce7', padding: '0.3rem 0.6rem', borderRadius: '20px' }}>За месяц</span>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.4rem', color: '#111827' }}>{data.stats.my_completed_tasks_month}</div>
                            <div style={{ color: '#111827', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.4rem' }}>Закрыто задач</div>
                            <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Всего за месяц: {data.stats.total_completed_tasks_month}</div>
                        </div>

                        <div className="biz-card" style={{ background: '#4f46e5', color: 'white', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.8rem', borderRadius: '14px', color: 'white' }}><Link size={24} /></div>
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.8rem' }}>{data.stats.total_projects}</div>
                            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', fontWeight: '600' }}>Активных проектов</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                        <div className="biz-card">
                            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Target size={20} color="#4f46e5" /> Задачи в фокусе
                            </h3>
                            {sortedTickets.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af' }}>На вас нет активных задач. Отличная работа!</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {sortedTickets.map(ticket => (
                                        <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} style={{ padding: '1rem 1.2rem', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e7eb', transition: 'all 0.2s', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} className="ticket-card-hover">
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? '#ef4444' : ticket.priority === 'MEDIUM' ? '#f59e0b' : '#10b981' }}></div>
                                                <div>
                                                    <div style={{ fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.95rem', color: '#111827' }}>{ticket.title}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontWeight: '500' }}>#{ticket.id}</span>
                                                        <span>•</span>
                                                        <span>{ticket.project_details?.name || 'Проект'}</span>
                                                        <span>•</span>
                                                        <span style={{ color: ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? '#ef4444' : '#6b7280', fontWeight: '500' }}>
                                                            {ticket.priority === 'HIGH' ? 'Высокий' : ticket.priority === 'CRITICAL' ? 'Критический' : ticket.priority === 'MEDIUM' ? 'Средний' : 'Низкий'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.3rem 0.8rem', borderRadius: '20px', background: ticket.status === 'IN_PROGRESS' ? '#eff6ff' : ticket.status === 'REVIEW' ? '#fefce8' : '#f3f4f6', color: ticket.status === 'IN_PROGRESS' ? '#1d4ed8' : ticket.status === 'REVIEW' ? '#a16207' : '#4b5563' }}>
                                                {ticket.status === 'IN_PROGRESS' ? 'В работе' : ticket.status === 'REVIEW' ? 'На проверке' : 'Открыто'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="biz-card">
                            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={18} /> Ваша активность</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {activities.length === 0 && <p style={{ color: '#9ca3af' }}>Нет недавней активности</p>}
                                {activities.map((act, i) => {
                                    const isLog = act.type === 'log';
                                    return (
                                        <div key={act.type + act.data.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                                            {i !== activities.length - 1 && <div style={{ position: 'absolute', left: 16, top: 32, bottom: -24, width: 2, background: '#f3f4f6' }}></div>}
                                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: isLog ? '#4f46e5' : '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0, zIndex: 1 }}>
                                                {isLog ? act.data.user_details?.username?.[0]?.toUpperCase() : act.data.assignee_details?.username?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                {isLog ? (
                                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '0.2rem', color: '#374151' }}>
                                                        Вы затрекали {act.data.time_spent_minutes}м в <span style={{ fontWeight: '600', color: '#4f46e5', cursor: 'pointer' }} onClick={() => navigate(`/tickets/${act.data.ticket}`)}>#{act.data.ticket}</span>
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '0.2rem', color: '#374151' }}>
                                                        На вас назначена задача <span style={{ fontWeight: '600', color: '#10b981', cursor: 'pointer' }} onClick={() => navigate(`/tickets/${act.data.id}`)}>#{act.data.id}</span>
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                    {new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(act.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ВКЛАДКА: АНАЛИТИКА */}
            {activeTab === 'analytics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', background: '#f3f4f6', padding: '0.3rem', borderRadius: '12px' }}>
                            <button onClick={() => handlePeriodChange('week')} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: analyticsPeriod === 'week' ? 'white' : 'transparent', color: analyticsPeriod === 'week' ? '#111827' : '#6b7280', fontWeight: '600', cursor: 'pointer', boxShadow: analyticsPeriod === 'week' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Неделя</button>
                            <button onClick={() => handlePeriodChange('month')} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: analyticsPeriod === 'month' ? 'white' : 'transparent', color: analyticsPeriod === 'month' ? '#111827' : '#6b7280', fontWeight: '600', cursor: 'pointer', boxShadow: analyticsPeriod === 'month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Месяц</button>
                            <button onClick={() => handlePeriodChange('year')} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: analyticsPeriod === 'year' ? 'white' : 'transparent', color: analyticsPeriod === 'year' ? '#111827' : '#6b7280', fontWeight: '600', cursor: 'pointer', boxShadow: analyticsPeriod === 'year' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Год</button>
                        </div>

                        {/* Навигация по периодам */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button onClick={() => setPeriodOffset(p => p - 1)} className="btn" style={{ padding: '0.4rem 0.8rem', background: 'white', border: '1px solid #e5e7eb', color: '#374151' }}><ChevronLeft size={18} /></button>
                            <button onClick={() => setPeriodOffset(0)} className="btn" style={{ padding: '0.4rem 1rem', background: 'white', border: '1px solid #e5e7eb', color: periodOffset === 0 ? '#9ca3af' : '#111827' }} disabled={periodOffset === 0}>Текущий</button>
                            <button onClick={() => setPeriodOffset(p => p + 1)} className="btn" style={{ padding: '0.4rem 0.8rem', background: 'white', border: '1px solid #e5e7eb', color: '#374151' }}><ChevronRight size={18} /></button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                        <div className="biz-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0' }}>Затраченное время (часы)</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                                    <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="biz-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0' }}>Статусы всех задач</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={ticketStatusData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                                        {ticketStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                                {ticketStatusData.map(d => (
                                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#4b5563' }}>
                                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: d.color }}></div>
                                        {d.name} ({d.value})
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ВКЛАДКА: СОБЫТИЯ */}
            {activeTab === 'events' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {events.length === 0 && <div className="biz-card" style={{ textAlign: 'center', color: '#9ca3af', padding: '4rem' }}>Событий пока нет.</div>}
                    {events.map(event => (
                        <div key={event.id} className="biz-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div>
                                    {event.label_details && (
                                        <div style={{ display: 'inline-block', padding: '0.3rem 0.8rem', background: `${event.label_details.color}20`, color: event.label_details.color, borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                            {event.label_details.name}
                                        </div>
                                    )}
                                    <h2 style={{ margin: 0, color: '#111827', fontSize: '1.5rem' }}>{event.title}</h2>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#6b7280', fontSize: '0.85rem' }}><CalendarIcon size={16} /><span>{new Date(event.created_at).toLocaleDateString()}</span></div>
                            </div>

                            <div className="ql-snow" style={{ marginBottom: '2rem' }}>
                                <div className="ql-editor" style={{ padding: 0, color: '#374151', fontSize: '1rem', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: event.content }} />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', borderTop: '1px solid #f3f4f6', paddingTop: '1.5rem' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontWeight: 'bold', fontSize: '1.1rem' }}>{event.author_details?.username[0]?.toUpperCase()}</div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>{event.author_details?.first_name || event.author_details?.username}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{event.author_details?.profile?.role === 'ADMIN' ? 'Администратор' : 'Сотрудник'}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* МОДАЛКА ДОБАВЛЕНИЯ СОБЫТИЯ */}
            {showEventModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="biz-card" style={{ width: '700px', maxWidth: '90%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ margin: '0 0 1.5rem 0' }}>Новое событие</h2>
                        <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Заголовок</label>
                                <input type="text" className="input-clean" required value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Метка (Создается в админке)</label>
                                <select className="input-clean" value={newEvent.label} onChange={e => setNewEvent({ ...newEvent, label: e.target.value })}>
                                    <option value="">Без метки</option>
                                    {eventLabels.map(label => (
                                        <option key={label.id} value={label.id}>{label.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Текст события</label>
                                <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
                                    <ReactQuill
                                        theme="snow"
                                        value={newEvent.content}
                                        onChange={content => setNewEvent({ ...newEvent, content })}
                                        modules={{
                                            toolbar: [
                                                [{ 'header': [1, 2, 3, false] }],
                                                ['bold', 'italic', 'underline', 'strike'],
                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                ['link', 'clean']
                                            ]
                                        }}
                                        style={{ height: '200px', marginBottom: '40px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, background: '#f3f4f6' }} onClick={() => setShowEventModal(false)}>Отмена</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Опубликовать</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`
                .ticket-card-hover:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important; border-color: #d1d5db !important; }
                .ql-toolbar { border-radius: 12px 12px 0 0; border-color: #e5e7eb !important; background: #f9fafb; }
                .ql-container { border-radius: 0 0 12px 12px; border-color: #e5e7eb !important; font-family: inherit; font-size: 1rem; }
            `}</style>
        </div>
    );
};
export default Dashboard;