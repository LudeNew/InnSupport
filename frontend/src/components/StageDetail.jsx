import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getStage, getTickets, updateStage, getWorkLogs } from '../api';
import { ArrowLeft, CheckCircle2, ListTodo, Clock, Target, Palette, Code, Bug, Rocket, Layout, XCircle, FolderKanban } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const StageDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'tasks';

    const [stage, setStage] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [worklogs, setWorklogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [stageRes, ticketsRes, logsRes] = await Promise.all([
                getStage(id), getTickets(), getWorkLogs()
            ]);

            setStage(stageRes.data);

            const allTickets = Array.isArray(ticketsRes.data) ? ticketsRes.data : (ticketsRes.data.results || []);
            const stageTickets = allTickets.filter(t => t.stage === parseInt(id));
            setTickets(stageTickets);

            const allLogs = Array.isArray(logsRes.data) ? logsRes.data : (logsRes.data.results || []);
            const ticketIds = stageTickets.map(t => t.id);
            setWorklogs(allLogs.filter(l => ticketIds.includes(l.ticket)));
        } catch (error) {
            console.error("Ошибка загрузки этапа", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    const handleCloseStage = async () => {
        if (window.confirm("Вы уверены, что хотите закрыть этот этап?")) {
            await updateStage(id, { status: 'CLOSED' });
            fetchData();
        }
    };

    if (loading) return <div>Загрузка этапа...</div>;
    if (!stage) return <div>Этап не найден.</div>;

    const doneTicketsCount = tickets.filter(t => t.status === 'DONE').length;
    const openTicketsCount = tickets.filter(t => t.status !== 'DONE').length;
    const spentHours = stage.spent_hours || 0;

    // Пункт 8: Вычисляем прогресс
    const totalTicketsCount = tickets.length;
    const progressPercentage = totalTicketsCount === 0 ? 0 : Math.round((doneTicketsCount / totalTicketsCount) * 100);

    const sortedTickets = [...tickets].sort((a, b) => {
        const aActive = a.status !== 'DONE';
        const bActive = b.status !== 'DONE';
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    const getIconComponent = (iconName) => {
        switch (iconName) {
            case 'palette': return <Palette size={20} />;
            case 'code': return <Code size={20} />;
            case 'bug': return <Bug size={20} />;
            case 'rocket': return <Rocket size={20} />;
            default: return <Layout size={20} />;
        }
    };

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

            {/* ШАПКА ЭТАПА */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                <button onClick={() => navigate(`/projects/${stage.project}`)} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', transition: 'all 0.2s' }} className="back-btn">
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    {/* Пункт 7: Огромная кликабельная ссылка на Проект */}
                    <div onClick={() => navigate(`/projects/${stage.project}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', cursor: 'pointer', background: '#f9fafb', padding: '0.4rem 1rem 0.4rem 0.4rem', borderRadius: '99px', border: '1px solid #e5e7eb', transition: 'all 0.2s' }} className="hover-lift">
                        <div style={{ background: '#e0e7ff', padding: '0.4rem', borderRadius: '50%', color: '#4f46e5', display: 'flex' }}>
                            <FolderKanban size={16} />
                        </div>
                        <div style={{ fontSize: '1rem', color: '#374151', fontWeight: '600' }}>Проект: <span style={{ color: '#4f46e5' }}>{stage.project_name}</span></div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5' }}>
                            {getIconComponent(stage.icon)}
                        </div>
                        <h1 style={{ margin: 0, fontSize: '2rem', color: '#111827' }}>{stage.name}</h1>
                        <span className="badge" style={{ background: stage.status === 'CLOSED' ? '#f3f4f6' : '#ecfdf5', color: stage.status === 'CLOSED' ? '#4b5563' : '#10b981' }}>
                            {stage.status === 'CLOSED' ? 'Закрыт' : 'Активен'}
                        </span>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0, maxWidth: '800px', lineHeight: '1.5', marginTop: '1rem' }}>
                        {stage.description || "У этого этапа пока нет описания."}
                    </p>

                    {/* Пункт 8: Прогресс-бар этапа */}
                    <div style={{ marginTop: '2rem', background: '#f9fafb', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e5e7eb', maxWidth: '800px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                            <span style={{ fontWeight: '600', color: '#374151' }}>Прогресс выполнения</span>
                            <span style={{ fontWeight: '800', color: progressPercentage === 100 ? '#10b981' : '#4f46e5' }}>{progressPercentage}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${progressPercentage}%`, height: '100%', background: progressPercentage === 100 ? '#10b981' : '#4f46e5', transition: 'width 0.8s ease' }}></div>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={16} color="#10b981" /> {doneTicketsCount} выполнено</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Target size={16} color="#ef4444" /> {openTicketsCount} осталось</span>
                        </div>
                    </div>

                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {stage.status === 'ACTIVE' && (
                        <button onClick={handleCloseStage} className="btn" style={{ background: 'white', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                            <XCircle size={18} /> Закрыть этап
                        </button>
                    )}
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
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: 1, marginBottom: '0.2rem' }}>{spentHours}ч</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Затрачено часов</div>
                    </div>
                </div>
            </div>

            {/* СПИСКИ */}
            {activeTab !== 'statistics' && (
                <div className="biz-card" style={{ marginTop: '1rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0' }}>Задачи в рамках этапа</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {sortedTickets.length === 0 ? (
                            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0', margin: 0 }}>В этом этапе пока нет задач</p>
                        ) : (
                            sortedTickets.map(ticket => (
                                <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', cursor: 'pointer' }} className="hover-lift">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? '#ef4444' : ticket.priority === 'MEDIUM' ? '#f59e0b' : '#10b981' }}></div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#111827' }}>{ticket.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                #{ticket.id} • {ticket.assignee_details?.username || 'Не назначен'}
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
            )}

            {activeTab === 'statistics' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                    <div className="biz-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>Затраченное время этапа</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timeChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                {/* Тултип для графика */}
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

            <style>{`
                .back-btn:hover { background: #f3f4f6 !important; }
                .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-color: #d1d5db !important; }
            `}</style>
        </div>
    );
};

export default StageDetail;