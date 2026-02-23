import { useEffect, useState } from 'react';
import { getProjects, getUsers, getTickets, getWorkLogs } from '../api';
import { PieChart, Clock, FolderKanban, Users, Activity, TrendingUp } from 'lucide-react';

const Reports = () => {
    const [data, setData] = useState({ projects: [], users: [], tickets: [], logs: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Запрашиваем все нужные данные параллельно для скорости
                const [projRes, usersRes, ticketsRes, logsRes] = await Promise.all([
                    getProjects(), getUsers(), getTickets(), getWorkLogs()
                ]);

                setData({
                    projects: projRes.data,
                    users: usersRes.data,
                    tickets: ticketsRes.data,
                    logs: logsRes.data
                });
            } catch (error) {
                console.error("Ошибка при загрузке данных для отчетов", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    if (loading) return <div>Формируем отчеты...</div>;

    // --- АГРЕГАЦИЯ ДАННЫХ ---

    // 1. Общее время
    const totalMinutes = data.logs.reduce((acc, log) => acc + log.time_spent_minutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);

    // 2. Время по проектам
    const timeByProject = data.projects.map(project => {
        // Находим ID всех задач этого проекта
        const projectTicketIds = data.tickets.filter(t => t.project === project.id).map(t => t.id);
        // Считаем время по логам, которые привязаны к этим задачам
        const minutes = data.logs
            .filter(log => projectTicketIds.includes(log.ticket))
            .reduce((acc, log) => acc + log.time_spent_minutes, 0);
        return { ...project, minutes };
    }).filter(p => p.minutes > 0).sort((a, b) => b.minutes - a.minutes); // Сортируем по убыванию

    // 3. Время по сотрудникам
    const timeByUser = data.users.map(user => {
        const minutes = data.logs
            .filter(log => log.user === user.id)
            .reduce((acc, log) => acc + log.time_spent_minutes, 0);
        return { ...user, minutes };
    }).filter(u => u.minutes > 0).sort((a, b) => b.minutes - a.minutes);

    // Вспомогательная функция форматирования времени
    const formatTime = (mins) => `${Math.floor(mins / 60)}ч ${mins % 60}м`;

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: '#e0e7ff', color: '#4f46e5', padding: '0.8rem', borderRadius: '12px' }}>
                    <PieChart size={28} />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#111827' }}>Аналитика и Отчеты</h1>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>Сводка по затраченному времени и эффективности.</p>
                </div>
            </div>

            {/* Верхние виджеты */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div className="biz-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ background: '#fefce8', padding: '1rem', borderRadius: '14px', color: '#a16207' }}><Clock size={28} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: 1, marginBottom: '0.2rem' }}>{totalHours}ч</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Всего затрекано</div>
                    </div>
                </div>
                <div className="biz-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '14px', color: '#15803d' }}><TrendingUp size={28} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: 1, marginBottom: '0.2rem' }}>{data.tickets.filter(t => t.status === 'DONE').length}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Задач выполнено</div>
                    </div>
                </div>
                <div className="biz-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '14px', color: '#4b5563' }}><Activity size={28} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', lineHeight: 1, marginBottom: '0.2rem' }}>{data.logs.length}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Записей в логах</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Отчет по проектам */}
                <div className="biz-card">
                    <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FolderKanban size={20} /> Распределение по проектам
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {timeByProject.length === 0 ? <p style={{ color: '#9ca3af' }}>Нет данных</p> :
                            timeByProject.map((project, idx) => {
                                const percentage = Math.round((project.minutes / totalMinutes) * 100);
                                return (
                                    <div key={project.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                            <span style={{ fontWeight: '600', color: '#374151' }}>{project.name}</span>
                                            <span style={{ fontWeight: '600', color: '#111827' }}>{formatTime(project.minutes)} <span style={{ color: '#9ca3af', fontWeight: '400' }}>({percentage}%)</span></span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${percentage}%`, height: '100%', background: idx % 2 === 0 ? '#4f46e5' : '#0ea5e9', borderRadius: '4px' }}></div>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>

                {/* Отчет по сотрудникам */}
                <div className="biz-card">
                    <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={20} /> Время по сотрудникам
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {timeByUser.length === 0 ? <p style={{ color: '#9ca3af' }}>Нет данных</p> :
                            timeByUser.map((user) => (
                                <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f9fafb' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {user.username[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.2rem' }}>{user.first_name || user.username} {user.last_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{user.profile?.department_details?.name || 'Без отдела'}</div>
                                    </div>
                                    <div style={{ fontWeight: '700', color: '#4f46e5', fontSize: '1.1rem' }}>
                                        {formatTime(user.minutes)}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Reports;