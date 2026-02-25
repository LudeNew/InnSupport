import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUsers, getTickets, getWorkLogs } from '../api';
import { ArrowLeft, ArrowRight, Mail, Send, Phone, Clock, Code, Bug, Palette, Briefcase, Headphones, Users as UsersIcon, ListTodo, CheckCircle2, Star } from 'lucide-react';

const getDepartmentIcon = (deptName) => {
    if (!deptName) return <UsersIcon size={16} />;
    const name = deptName.toLowerCase();
    if (name.includes('разраб')) return <Code size={16} />;
    if (name.includes('тест')) return <Bug size={16} />;
    if (name.includes('дизайн')) return <Palette size={16} />;
    if (name.includes('менедж')) return <Briefcase size={16} />;
    if (name.includes('поддерж')) return <Headphones size={16} />;
    return <UsersIcon size={16} />;
};

const getLevelConfig = (level) => {
    switch (level) {
        case 'MAIN': return { color: '#7e22ce', bg: '#f3e8ff', label: 'Main' };
        case 'MASTER': return { color: '#d97706', bg: '#fef3c7', label: 'Master' };
        default: return { color: '#4b5563', bg: '#f3f4f6', label: 'Basic' };
    }
};

const getSkillStyle = (level) => {
    if (level === 'EXPERT') return { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce' };
    if (level === 'ADVANCED') return { bg: '#fefce8', border: '#fde047', text: '#a16207' };
    return { bg: '#ffffff', border: '#e5e7eb', text: '#374151' };
};

const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [workLogs, setWorkLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('week');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [uRes, tRes, lRes] = await Promise.all([getUsers(), getTickets(), getWorkLogs()]);
                const found = (uRes.data.results || uRes.data).find(u => u.id === parseInt(id));
                setUser(found);
                setTickets((tRes.data.results || tRes.data).filter(t => t.assignee === parseInt(id)));
                setWorkLogs((lRes.data.results || lRes.data).filter(l => l.user === parseInt(id)));
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchData();
    }, [id]);

    if (loading || !user) return <div>Загрузка...</div>;

    const activeTickets = tickets.filter(t => t.status !== 'DONE');
    const doneTickets = tickets.filter(t => t.status === 'DONE');

    const getFilteredTime = () => {
        const now = new Date();
        const filtered = workLogs.filter(log => {
            const d = new Date(log.created_at);
            if (timeFilter === 'day') return d.toDateString() === now.toDateString();
            if (timeFilter === 'week') return d >= new Date(now.setDate(now.getDate() - 7));
            if (timeFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            return d.getFullYear() === now.getFullYear();
        });
        let mins = filtered.reduce((acc, l) => acc + l.time_spent_minutes, 0);
        mins += Math.floor(filtered.reduce((acc, l) => acc + (l.time_spent_seconds || 0), 0) / 60);
        return { h: Math.floor(mins / 60), m: mins % 60 };
    };
    const time = getFilteredTime();

    const hasAvatar = !!user.profile?.avatar;
    const sortedSkills = [...(user.profile?.skills || [])].sort((a, b) => (b.level === 'EXPERT' ? 3 : b.level === 'ADVANCED' ? 2 : 1) - (a.level === 'EXPERT' ? 3 : a.level === 'ADVANCED' ? 2 : 1));

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate('/team')} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '0.8rem', cursor: 'pointer' }}><ArrowLeft size={20} /></button>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Карточка сотрудника</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* ЛЕВАЯ КОЛОНКА */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="biz-card" style={{ textAlign: 'center' }}>
                        <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#f3f4f6', margin: '0 auto 1.5rem auto', overflow: 'hidden', border: '3px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {hasAvatar ? <img src={user.profile.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UsersIcon size={50} color="#9ca3af" />}
                        </div>
                        <h2 style={{ margin: '0 0 0.3rem 0' }}>{user.first_name || user.username} {user.last_name || ''}</h2>
                        <div style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1.5rem' }}>@{user.username}</div>

                        {/* ИНДИВИДУАЛЬНЫЕ МЕТКИ ОТДЕЛОВ */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                            {user.profile?.departments_details?.map(link => {
                                const level = getLevelConfig(link.level);
                                const dept = link.department_details;
                                return (
                                    <div key={link.id} style={{ display: 'inline-flex', alignItems: 'stretch', background: level.bg, border: `1px solid ${level.color}30`, borderRadius: '6px', overflow: 'hidden', fontSize: '0.8rem', fontWeight: '600' }}>
                                        <div style={{ background: level.color, color: 'white', padding: '0.2rem 0.5rem', textTransform: 'uppercase', fontSize: '0.7rem' }}>{level.label}</div>
                                        <div style={{ padding: '0.2rem 0.7rem', color: level.color, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>{getDepartmentIcon(dept?.name)} {dept?.name}</div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* КНОПКА ПЕРЕХОДА В ПРОФИЛЬ */}
                        <button onClick={() => navigate(`/profile/${user.id}`)} style={{ width: '100%', background: '#e0e7ff', color: '#4f46e5', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} className="btn-hover-indigo">
                            Смотреть публичный профиль <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="biz-card">
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>Контакты</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ background: '#f3f4f6', padding: '0.5rem', borderRadius: '8px' }}><Phone size={18} color="#6b7280" /></div> {user.profile?.phone_number || 'Не указан'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ background: '#f3f4f6', padding: '0.5rem', borderRadius: '8px' }}><Mail size={18} color="#6b7280" /></div> {user.email || 'Не указан'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><div style={{ background: '#e0f2fe', padding: '0.5rem', borderRadius: '8px' }}><Send size={18} color="#0ea5e9" /></div> {user.profile?.tg_link ? <a href={user.profile.tg_link} target="_blank" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: '600' }}>Telegram</a> : 'Не указан'}</div>
                        </div>
                    </div>

                    <div className="biz-card">
                        <h3 style={{ margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Star size={20} color="#f59e0b" /> Ключевые навыки</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                            {sortedSkills.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Навыки не указаны</p> : sortedSkills.map(s => {
                                const st = getSkillStyle(s.level);
                                return <div key={s.id} style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.text, padding: '0.4rem 0.8rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '600' }}>{s.skill_details?.name}</div>
                            })}
                        </div>
                    </div>
                </div>

                {/* ПРАВАЯ КОЛОНКА */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* БЛОКИ ЗАДАЧ ВЕРНУЛИСЬ НАВЕРХ */}
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div className="biz-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '1rem', borderRadius: '12px' }}><ListTodo size={24} /></div>
                            <div><div style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1 }}>{activeTickets.length}</div><div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Задач в работе</div></div>
                        </div>
                        <div className="biz-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#f0fdf4', color: '#15803d', padding: '1rem', borderRadius: '12px' }}><CheckCircle2 size={24} /></div>
                            <div><div style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1 }}>{doneTickets.length}</div><div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Выполнено всего</div></div>
                        </div>
                    </div>

                    {/* БЛОК ВРЕМЕНИ */}
                    <div className="biz-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={20} color="#0ea5e9" /> Затраченное время</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{time.h}<span style={{ fontSize: '1.2rem', color: '#6b7280' }}>ч</span> {time.m}<span style={{ fontSize: '1.2rem', color: '#6b7280' }}>м</span></div>
                        </div>
                        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '0.2rem' }}>
                            {['day', 'week', 'month', 'year'].map(p => <button key={p} onClick={() => setTimeFilter(p)} style={{ border: 'none', background: timeFilter === p ? 'white' : 'transparent', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', boxShadow: timeFilter === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>{p === 'day' ? 'День' : p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Год'}</button>)}
                        </div>
                    </div>

                    {/* АКТИВНЫЕ ЗАДАЧИ */}
                    <div className="biz-card">
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>Текущие задачи ({activeTickets.length})</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {activeTickets.length === 0 ? <p style={{ color: '#9ca3af', textAlign: 'center' }}>Задач нет</p> : activeTickets.map(t => (
                                <div key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer' }} className="hover-lift">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.priority === 'HIGH' || t.priority === 'CRITICAL' ? '#ef4444' : '#10b981' }}></div>
                                        <div><div style={{ fontWeight: '600' }}>{t.title}</div><div style={{ fontSize: '0.8rem', color: '#6b7280' }}>#{t.id} • {t.project_details?.name}</div></div>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.3rem 0.8rem', borderRadius: '20px', background: t.status === 'IN_PROGRESS' ? '#eff6ff' : '#fefce8', color: t.status === 'IN_PROGRESS' ? '#1d4ed8' : '#a16207' }}>
                                        {t.status === 'IN_PROGRESS' ? 'В работе' : t.status === 'REVIEW' ? 'На проверке' : 'Открыто'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <style>{`.hover-lift:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-color: #d1d5db !important; } .btn-hover-indigo:hover { background: #c7d2fe !important; }`}</style>
        </div>
    );
};
export default UserDetail;