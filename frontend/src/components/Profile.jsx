import { useEffect, useState } from 'react';
import { getDashboardStats, getCurrentUser, getSkills, updateProfile, getTickets, getWorkLogs } from '../api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Edit3, Briefcase, Ticket, Clock, CheckCircle2, Target, FolderKanban, Star, X, ChevronLeft, ChevronRight, Send, Gitlab, Github, Megaphone, Share2, Phone, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [tickets, setTickets] = useState([]);

    const [showEdit, setShowEdit] = useState(false);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [editForm, setEditForm] = useState({ skills: [], email: '', phone_number: '', tg_link: '', tg_channel_link: '', gitlab_link: '', github_link: '' });
    const [avatarFile, setAvatarFile] = useState(null);
    const [newSkill, setNewSkill] = useState({ skill_id: '', level: 'BASE' });

    const [analyticsData, setAnalyticsData] = useState({ tickets: [], logs: [] });
    const [analyticsPeriod, setAnalyticsPeriod] = useState('week');
    const [periodOffset, setPeriodOffset] = useState(0);
    const [selectedTaskMonth, setSelectedTaskMonth] = useState(''); // Для табов задач

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const fetchData = async () => {
        try {
            const [userRes, statsRes, skillsRes] = await Promise.all([
                getCurrentUser(), getDashboardStats(), getSkills()
            ]);

            const userData = userRes.data;
            setUser(userData);
            setStats(statsRes.data.stats);
            setTickets(Array.isArray(statsRes.data.assigned_tickets) ? statsRes.data.assigned_tickets : []);
            setAvailableSkills(Array.isArray(skillsRes.data) ? skillsRes.data : []);

            setEditForm({
                skills: userData.profile?.skills || [],
                email: userData.email || '',
                phone_number: userData.profile?.phone_number || '',
                tg_link: userData.profile?.tg_link || '',
                tg_channel_link: userData.profile?.tg_channel_link || '',
                gitlab_link: userData.profile?.gitlab_link || '',
                github_link: userData.profile?.github_link || ''
            });

            if (activeTab === 'statistics' || activeTab === 'tasks') {
                const [tRes, lRes] = await Promise.all([getTickets(), getWorkLogs()]);
                const allTickets = Array.isArray(tRes.data) ? tRes.data : (tRes.data.results || []);
                const allLogs = Array.isArray(lRes.data) ? lRes.data : (lRes.data.results || []);

                setAnalyticsData({
                    tickets: allTickets.filter(t => t.assignee === userData.id),
                    logs: allLogs.filter(l => l.user === userData.id)
                });
            }
        } catch (e) { console.error("Ошибка загрузки профиля", e); }
    };

    useEffect(() => { fetchData(); }, [activeTab]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        const skillsToSave = editForm.skills.map(s => ({ skill_id: s.skill || s.skill_id, level: s.level }));
        formData.append('skills', JSON.stringify(skillsToSave));
        formData.append('email', editForm.email);
        formData.append('phone_number', editForm.phone_number);
        formData.append('tg_link', editForm.tg_link);
        formData.append('tg_channel_link', editForm.tg_channel_link);
        formData.append('gitlab_link', editForm.gitlab_link);
        formData.append('github_link', editForm.github_link);

        if (avatarFile) formData.append('avatar', avatarFile);

        try {
            const res = await updateProfile(formData);
            localStorage.setItem('currentUser', JSON.stringify(res.data));
            setShowEdit(false);
            fetchData();
        } catch (error) { alert('Ошибка при сохранении профиля'); }
    };

    const addSkillToForm = () => {
        if (!newSkill.skill_id) return;
        if (editForm.skills.find(s => (s.skill === parseInt(newSkill.skill_id) || s.skill_id === newSkill.skill_id))) return;
        const skillObj = availableSkills.find(s => s.id === parseInt(newSkill.skill_id));
        setEditForm({ ...editForm, skills: [...editForm.skills, { skill_id: newSkill.skill_id, skill_details: skillObj, level: newSkill.level }] });
        setNewSkill({ skill_id: '', level: 'BASE' });
    };

    const removeSkillFromForm = (idToRemove) => {
        setEditForm({ ...editForm, skills: editForm.skills.filter(s => (s.skill !== idToRemove && s.skill_id !== idToRemove)) });
    };

    if (!user || !stats) return <div>Загрузка профиля...</div>;

    const fullName = user.last_name ? `${user.last_name} ${user.first_name}` : user.username;
    const formatMinutes = (m) => `${Math.floor(m / 60)}ч ${m % 60}м`;

    const getSkillStyle = (level) => {
        if (level === 'EXPERT') return { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce' };
        if (level === 'ADVANCED') return { bg: '#fefce8', border: '#fde047', text: '#a16207' };
        return { bg: '#ffffff', border: '#e5e7eb', text: '#374151' };
    };

    const priorityWeight = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    const sortedTickets = [...tickets].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    const skillWeight = { 'EXPERT': 3, 'ADVANCED': 2, 'BASE': 1 };
    const sortedSkills = [...(user.profile?.skills || [])].sort((a, b) => skillWeight[b.level] - skillWeight[a.level]);

    const canSeeRole = user.profile?.role === 'ADMIN' || user.profile?.role === 'GENERAL_MANAGER';

    // Группировка всех задач по месяцам для вкладки "Задачи"
    const groupedTasks = {};
    if (activeTab === 'tasks') {
        const allTasksSorted = [...analyticsData.tickets].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        allTasksSorted.forEach(t => {
            const date = new Date(t.created_at);
            const monthYear = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
            const capitalizedMonth = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
            if (!groupedTasks[capitalizedMonth]) groupedTasks[capitalizedMonth] = [];
            groupedTasks[capitalizedMonth].push(t);
        });
    }
    const availableMonths = Object.keys(groupedTasks);
    const activeTaskMonth = (selectedTaskMonth && availableMonths.includes(selectedTaskMonth)) ? selectedTaskMonth : availableMonths[0];

    // --- ЛОГИКА ДЛЯ ГРАФИКОВ ---
    const ticketStatusData = [
        { name: 'Открыто', value: analyticsData.tickets.filter(t => t.status === 'OPEN').length, color: '#9ca3af' },
        { name: 'В работе', value: analyticsData.tickets.filter(t => t.status === 'IN_PROGRESS').length, color: '#3b82f6' },
        { name: 'На проверке', value: analyticsData.tickets.filter(t => t.status === 'REVIEW').length, color: '#f59e0b' },
        { name: 'Готово', value: analyticsData.tickets.filter(t => t.status === 'DONE').length, color: '#10b981' },
    ].filter(d => d.value > 0);

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
            monday.setDate(today.getDate() + diffToMonday + (periodOffset * 7));
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

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* ШАПКА ПРОФИЛЯ */}
            <div className="biz-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    {user.profile?.avatar ? (
                        <img src={user.profile.avatar} alt="avatar" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '4px solid #f3f4f6' }} />
                    ) : (
                        <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold', border: '4px solid #f3f4f6' }}>
                            {user.first_name ? user.first_name[0].toUpperCase() : user.username[0].toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#111827' }}>{fullName}</h1>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', color: '#6b7280', fontSize: '0.95rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f3f4f6', padding: '0.3rem 0.8rem', borderRadius: '8px', width: 'fit-content', color: '#374151', fontWeight: '500' }}>
                                <Briefcase size={16} /> {user.profile?.department_details?.name || 'Отдел не указан'}
                            </span>
                            {canSeeRole && (
                                <span style={{ marginLeft: '0.2rem' }}>Роль: {user.profile?.role === 'ADMIN' ? 'Администратор' : 'Главный менеджер'}</span>
                            )}
                        </div>
                    </div>
                </div>
                <button className="btn" onClick={() => setShowEdit(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #e5e7eb' }}>
                    <Edit3 size={18} /> Настройки профиля
                </button>
            </div>

            {/* ВКЛАДКА: ПРОФИЛЬ (ОБЗОР) */}
            {activeTab === 'overview' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <div className="biz-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}><div style={{ background: '#f3f4f6', padding: '0.8rem', borderRadius: '14px', color: '#1f2937' }}><Ticket size={24} /></div></div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.4rem', color: '#111827' }}>{stats.my_assigned_count}</div>
                            <div style={{ color: '#111827', fontSize: '0.95rem', fontWeight: '600' }}>Открытые задачи</div>
                        </div>
                        <div className="biz-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}><div style={{ background: '#eff6ff', padding: '0.8rem', borderRadius: '14px', color: '#3b82f6' }}><Clock size={24} /></div></div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.4rem', color: '#111827' }}>{formatMinutes(stats.my_worked_minutes_today)}</div>
                            <div style={{ color: '#111827', fontSize: '0.95rem', fontWeight: '600' }}>Отработано сегодня</div>
                        </div>
                        <div className="biz-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}><div style={{ background: '#f0fdf4', padding: '0.8rem', borderRadius: '14px', color: '#15803d' }}><CheckCircle2 size={24} /></div></div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, marginBottom: '0.4rem', color: '#111827' }}>{stats.my_completed_tasks_month}</div>
                            <div style={{ color: '#111827', fontSize: '0.95rem', fontWeight: '600' }}>Закрыто за месяц</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* НАВЫКИ */}
                            <div className="biz-card">
                                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Star size={20} color="#f59e0b" /> Ключевые навыки</h3>
                                {sortedSkills.length === 0 ? <p style={{ color: '#9ca3af' }}>Навыки пока не добавлены.</p> : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                        {sortedSkills.map(s => {
                                            const style = getSkillStyle(s.level);
                                            return (
                                                <div key={s.id} style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text, padding: '0.5rem 1rem', borderRadius: '99px', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    {s.skill_details?.name}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* ЗАДАЧИ В ФОКУСЕ */}
                            <div className="biz-card">
                                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={20} color="#4f46e5" /> Мои задачи в фокусе</h3>
                                {sortedTickets.length === 0 ? <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Нет активных задач</div> : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {sortedTickets.map(ticket => (
                                            <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} style={{ padding: '1rem 1.2rem', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e7eb', cursor: 'pointer' }} className="ticket-card-hover">
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? '#ef4444' : ticket.priority === 'MEDIUM' ? '#f59e0b' : '#10b981' }}></div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.95rem', color: '#111827' }}>{ticket.title}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ fontWeight: '500' }}>#{ticket.id}</span><span>•</span><span>{ticket.project_details?.name || 'Проект'}</span><span>•</span>
                                                            <span style={{ color: ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? '#ef4444' : '#6b7280', fontWeight: '500' }}>{ticket.priority}</span>
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
                        </div>

                        {/* ПРАВАЯ КОЛОНКА */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* СОЦИАЛЬНЫЕ СЕТИ (ПОДНЯТЫ ВВЕРХ) */}
                            <div className="biz-card">
                                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#111827' }}><Share2 size={20} color="#3b82f6" /> Связь и ресурсы</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                    {/* Номер телефона и Почта в самом верху */}
                                    {user.profile?.phone_number ? <a href={`tel:${user.profile.phone_number}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#10b981', textDecoration: 'none', fontWeight: '500' }}><div style={{ padding: '0.5rem', background: '#ecfdf5', borderRadius: '8px' }}><Phone size={18} /></div> {user.profile.phone_number}</a> : null}
                                    {user.email ? <a href={`mailto:${user.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#ef4444', textDecoration: 'none', fontWeight: '500' }}><div style={{ padding: '0.5rem', background: '#fef2f2', borderRadius: '8px' }}><Mail size={18} /></div> {user.email}</a> : null}

                                    {/* Остальные соцсети */}
                                    {user.profile?.tg_link ? <a href={user.profile.tg_link} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}><div style={{ padding: '0.5rem', background: '#eff6ff', borderRadius: '8px' }}><Send size={18} /></div> Telegram</a> : null}
                                    {user.profile?.tg_channel_link ? <a href={user.profile.tg_channel_link} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#8b5cf6', textDecoration: 'none', fontWeight: '500' }}><div style={{ padding: '0.5rem', background: '#f5f3ff', borderRadius: '8px' }}><Megaphone size={18} /></div> Личный канал</a> : null}
                                    {user.profile?.gitlab_link ? <a href={user.profile.gitlab_link} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#f97316', textDecoration: 'none', fontWeight: '500' }}><div style={{ padding: '0.5rem', background: '#fff7ed', borderRadius: '8px' }}><Gitlab size={18} /></div> GitLab</a> : null}
                                    {user.profile?.github_link ? <a href={user.profile.github_link} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#111827', textDecoration: 'none', fontWeight: '500' }}><div style={{ padding: '0.5rem', background: '#f3f4f6', borderRadius: '8px' }}><Github size={18} /></div> GitHub</a> : null}

                                    {!user.profile?.phone_number && !user.email && !user.profile?.tg_link && !user.profile?.tg_channel_link && !user.profile?.gitlab_link && !user.profile?.github_link && (
                                        <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Контакты не указаны</div>
                                    )}
                                </div>
                            </div>

                            {/* ПРОЕКТЫ (ОПУЩЕНЫ ВНИЗ) */}
                            <div className="biz-card">
                                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FolderKanban size={20} color="#10b981" /> Вовлеченность в проекты</h3>
                                {user.profile?.involved_projects_details?.length === 0 ? <p style={{ color: '#9ca3af' }}>Не привязан к проектам.</p> : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {user.profile?.involved_projects_details?.map(p => (
                                            <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', cursor: 'pointer' }} className="ticket-card-hover">
                                                <div style={{ fontWeight: 'bold', color: '#111827', marginBottom: '0.3rem' }}>{p.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                    Статус: <span style={{ color: p.status === 'ACTIVE' ? '#10b981' : '#6b7280', fontWeight: p.status === 'ACTIVE' ? '600' : 'normal' }}>{p.status === 'ACTIVE' ? 'Активен' : 'Закрыт'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ВКЛАДКА: ЗАДАЧИ (С КНОПКАМИ МЕСЯЦЕВ) */}
            {activeTab === 'tasks' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {availableMonths.length === 0 ? (
                        <div className="biz-card" style={{ textAlign: 'center', color: '#9ca3af', padding: '4rem' }}>У вас пока не было задач.</div>
                    ) : (
                        <>
                            {/* КНОПКИ ВЫБОРА МЕСЯЦА */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                {availableMonths.map(month => (
                                    <button
                                        key={month}
                                        onClick={() => setSelectedTaskMonth(month)}
                                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: activeTaskMonth === month ? '#4f46e5' : 'white', color: activeTaskMonth === month ? 'white' : '#4b5563', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                    >
                                        {month} <span style={{ opacity: 0.7, fontWeight: 'normal', fontSize: '0.85rem' }}>({groupedTasks[month].length})</span>
                                    </button>
                                ))}
                            </div>

                            {/* СПИСОК ЗАДАЧ ДЛЯ ВЫБРАННОГО МЕСЯЦА */}
                            {activeTaskMonth && groupedTasks[activeTaskMonth] && (
                                <div className="biz-card">
                                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Задачи за {activeTaskMonth.toLowerCase()}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {groupedTasks[activeTaskMonth].map(ticket => (
                                            <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} style={{ padding: '1rem 1.5rem', background: '#f9fafb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e7eb', cursor: 'pointer' }} className="ticket-card-hover">
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? '#ef4444' : ticket.priority === 'MEDIUM' ? '#f59e0b' : '#10b981' }}></div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.95rem', color: '#111827' }}>{ticket.title}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ fontWeight: '500' }}>#{ticket.id}</span><span>•</span><span>{ticket.project_details?.name || 'Проект'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.3rem 0.8rem', borderRadius: '20px', background: ticket.status === 'IN_PROGRESS' ? '#eff6ff' : ticket.status === 'DONE' ? '#f0fdf4' : ticket.status === 'REVIEW' ? '#fefce8' : '#fff', color: ticket.status === 'IN_PROGRESS' ? '#1d4ed8' : ticket.status === 'DONE' ? '#15803d' : ticket.status === 'REVIEW' ? '#a16207' : '#4b5563', border: ticket.status === 'OPEN' ? '1px solid #e5e7eb' : 'none' }}>
                                                    {ticket.status === 'IN_PROGRESS' ? 'В работе' : ticket.status === 'DONE' ? 'Готово' : ticket.status === 'REVIEW' ? 'На проверке' : 'Открыто'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ВКЛАДКА: СТАТИСТИКА */}
            {activeTab === 'statistics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', background: '#f3f4f6', padding: '0.3rem', borderRadius: '12px' }}>
                            <button onClick={() => { setAnalyticsPeriod('week'); setPeriodOffset(0); }} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: analyticsPeriod === 'week' ? 'white' : 'transparent', color: analyticsPeriod === 'week' ? '#111827' : '#6b7280', fontWeight: '600', cursor: 'pointer', boxShadow: analyticsPeriod === 'week' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Неделя</button>
                            <button onClick={() => { setAnalyticsPeriod('month'); setPeriodOffset(0); }} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: analyticsPeriod === 'month' ? 'white' : 'transparent', color: analyticsPeriod === 'month' ? '#111827' : '#6b7280', fontWeight: '600', cursor: 'pointer', boxShadow: analyticsPeriod === 'month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Месяц</button>
                            <button onClick={() => { setAnalyticsPeriod('year'); setPeriodOffset(0); }} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: analyticsPeriod === 'year' ? 'white' : 'transparent', color: analyticsPeriod === 'year' ? '#111827' : '#6b7280', fontWeight: '600', cursor: 'pointer', boxShadow: analyticsPeriod === 'year' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>Год</button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button onClick={() => setPeriodOffset(p => p - 1)} className="btn" style={{ padding: '0.4rem 0.8rem', background: 'white', border: '1px solid #e5e7eb', color: '#374151' }}><ChevronLeft size={18} /></button>
                            <button onClick={() => setPeriodOffset(0)} className="btn" style={{ padding: '0.4rem 1rem', background: 'white', border: '1px solid #e5e7eb', color: periodOffset === 0 ? '#9ca3af' : '#111827' }} disabled={periodOffset === 0}>Текущий период</button>
                            <button onClick={() => setPeriodOffset(p => p + 1)} className="btn" style={{ padding: '0.4rem 0.8rem', background: 'white', border: '1px solid #e5e7eb', color: '#374151' }}><ChevronRight size={18} /></button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                        <div className="biz-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0' }}>Личное затраченное время (часы)</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                                    <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="biz-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0' }}>Статусы моих задач</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={ticketStatusData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                                        {ticketStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
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

            {/* МОДАЛКА НАСТРОЕК ПРОФИЛЯ */}
            {showEdit && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="biz-card" style={{ width: '600px', maxWidth: '90%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ margin: '0 0 1.5rem 0' }}>Настройки профиля</h2>
                        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Фото профиля (Аватар)</label>
                                <input type="file" accept="image/*" className="input-clean" style={{ padding: '0.5rem' }} onChange={e => setAvatarFile(e.target.files[0])} />
                            </div>

                            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>Связь и ресурсы</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div><label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.3rem' }}>Email</label><input type="email" className="input-clean" placeholder="mail@example.com" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
                                    <div><label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.3rem' }}>Номер телефона</label><input type="text" className="input-clean" placeholder="+7 999 000 00 00" value={editForm.phone_number} onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })} /></div>
                                    <div><label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.3rem' }}>Telegram (ссылка)</label><input type="text" className="input-clean" placeholder="https://t.me/username" value={editForm.tg_link} onChange={e => setEditForm({ ...editForm, tg_link: e.target.value })} /></div>
                                    <div><label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.3rem' }}>Личный канал (ссылка)</label><input type="text" className="input-clean" placeholder="https://..." value={editForm.tg_channel_link} onChange={e => setEditForm({ ...editForm, tg_channel_link: e.target.value })} /></div>
                                    <div><label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.3rem' }}>GitLab (ссылка)</label><input type="text" className="input-clean" placeholder="https://gitlab.com/..." value={editForm.gitlab_link} onChange={e => setEditForm({ ...editForm, gitlab_link: e.target.value })} /></div>
                                    <div><label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.3rem' }}>GitHub (ссылка)</label><input type="text" className="input-clean" placeholder="https://github.com/..." value={editForm.github_link} onChange={e => setEditForm({ ...editForm, github_link: e.target.value })} /></div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>Управление навыками</label>

                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <select className="input-clean" style={{ flex: 2 }} value={newSkill.skill_id} onChange={e => setNewSkill({ ...newSkill, skill_id: e.target.value })}>
                                        <option value="">Выберите навык...</option>
                                        {availableSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <select className="input-clean" style={{ flex: 1 }} value={newSkill.level} onChange={e => setNewSkill({ ...newSkill, level: e.target.value })}>
                                        <option value="BASE">Базовый</option>
                                        <option value="ADVANCED">Продвинутый</option>
                                        <option value="EXPERT">Высший</option>
                                    </select>
                                    <button type="button" className="btn btn-primary" onClick={addSkillToForm}>Добавить</button>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                    {editForm.skills.map((s, idx) => {
                                        const style = getSkillStyle(s.level);
                                        const skillId = s.skill || s.skill_id;
                                        return (
                                            <div key={idx} style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text, padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {s.skill_details?.name || availableSkills.find(as => as.id === parseInt(skillId))?.name}
                                                <button type="button" onClick={() => removeSkillFromForm(skillId)} style={{ background: 'none', border: 'none', color: style.text, cursor: 'pointer', padding: 0, display: 'flex' }}><X size={14} /></button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, background: '#f3f4f6' }} onClick={() => setShowEdit(false)}>Отмена</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Сохранить изменения</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`.ticket-card-hover:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important; border-color: #d1d5db !important; }`}</style>
        </div>
    );
};

export default Profile;