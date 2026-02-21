import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, ListTodo, ClipboardList, Clock, Settings, LogOut, ChevronDown, Bell, Check } from 'lucide-react';

import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Tickets from './components/Tickets';
import Team from './components/Team';
import Login from './components/Login';

import ProjectDetail from './components/ProjectDetail';
import TicketDetail from './components/TicketDetail';
import UserDetail from './components/UserDetail';
import Reports from './components/Reports';

import { getCurrentUser, getNotifications, markAllNotificationsRead } from './api';

const SubNavigation = ({ location }) => {
    const path = location.pathname;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const currentTab = searchParams.get('tab') || 'overview';

    // Инициализируем уведомления как пустой массив
    const [notifications, setNotifications] = useState([]);
    const [showNotifMenu, setShowNotifMenu] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('token')) {
            getNotifications().then(res => {
                // Всегда проверяем, что данные - это массив
                if (Array.isArray(res.data)) {
                    setNotifications(res.data);
                } else {
                    setNotifications([]);
                }
            }).catch(() => setNotifications([]));
        }
    }, [location.pathname]);

    // Безопасная фильтрация
    const unreadCount = Array.isArray(notifications)
        ? notifications.filter(n => !n.is_read).length
        : 0;

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (e) {
            console.error("Ошибка обновления уведомлений", e);
        }
    };

    const handleNotificationClick = (link) => {
        setShowNotifMenu(false);
        if (link) navigate(link);
    };

    const subsections = {
        '/': [
            { label: 'Обзор', tab: 'overview' },
            { label: 'Аналитика', tab: 'analytics' },
            { label: 'События', tab: 'events' }
        ],
        '/projects': [
            { label: 'Внутренние', tab: 'internal' },
            { label: 'Внешние', tab: 'external' },
            { label: 'Все', tab: 'all' }
        ],
        '/tickets': [
            { label: 'Новые', tab: 'new' },
            { label: 'В работе', tab: 'inprogress' },
            { label: 'На проверке', tab: 'review' },
            { label: 'Завершенные', tab: 'done' }
        ],
        '/team': [
            { label: 'Все', tab: 'all' },
            { label: 'Разработка', tab: 'dev' },
            { label: 'Тестирование', tab: 'qa' },
            { label: 'Дизайн', tab: 'design' }
        ]
    };

    const currentSubs = subsections[path] || subsections['/'];

    return (
        <div className="top-bar-container" style={{ position: 'relative' }}>
            <h2 style={{ margin: 0 }}>
                {path === '/' ? 'Дашборд' :
                    path === '/projects' ? 'Проекты' :
                        path === '/tickets' ? 'Задачи' :
                            path === '/team' ? 'Команда' :
                                path === '/reports' ? 'Отчеты' : 'Раздел'}
            </h2>

            <div className="subsection-menu">
                {currentSubs?.map((sub, idx) => {
                    const isActive = currentTab === sub.tab || (!searchParams.get('tab') && idx === 0);
                    return (
                        <div key={idx} className={`sub-link ${isActive ? 'active' : ''}`} onClick={() => navigate(`${path}?tab=${sub.tab}`)} style={{ cursor: 'pointer' }}>
                            {sub.label}
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

                <div style={{ position: 'relative' }}>
                    <div onClick={() => setShowNotifMenu(!showNotifMenu)} style={{ padding: '0.5rem', background: 'white', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                        <Bell size={20} color="var(--text-muted)" />
                        {unreadCount > 0 && (
                            <div style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                {unreadCount}
                            </div>
                        )}
                    </div>

                    {showNotifMenu && (
                        <div className="biz-card" style={{ position: 'absolute', top: '110%', right: 0, width: '350px', zIndex: 1000, padding: 0, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
                                <h4 style={{ margin: 0 }}>Уведомления</h4>
                                {unreadCount > 0 && (
                                    <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600' }}>
                                        <Check size={14} /> Прочитано
                                    </button>
                                )}
                            </div>
                            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                {(!Array.isArray(notifications) || notifications.length === 0) ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>Нет новых уведомлений</div>
                                ) : (
                                    notifications.map(notif => (
                                        <div key={notif.id} onClick={() => handleNotificationClick(notif.link)} style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6', background: notif.is_read ? 'white' : '#eff6ff', cursor: 'pointer', transition: 'background 0.2s' }}>
                                            <div style={{ fontSize: '0.9rem', color: '#111827', marginBottom: '0.3rem' }}>{notif.message}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{new Date(notif.created_at).toLocaleString()}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: '0.5rem', background: 'white', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Settings size={20} color="var(--text-muted)" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'white', padding: '0.4rem 0.8rem 0.4rem 0.4rem', borderRadius: '99px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>A</div>
                    <ChevronDown size={14} color="var(--text-muted)" />
                </div>
            </div>
            {showNotifMenu && <div onClick={() => setShowNotifMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}></div>}
        </div>
    );
};

const SidebarIcon = ({ to, icon, label }) => {
    const location = useLocation();
    const active = location.pathname === to;
    return <Link to={to} className={`nav-item ${active ? 'active' : ''}`} data-label={label}>{icon}</Link>;
};

function App() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    useEffect(() => {
        if (localStorage.getItem('token')) {
            getCurrentUser().then(res => {
                if (res.data) localStorage.setItem('currentUser', JSON.stringify(res.data));
            }).catch(console.error);
        }
    }, [location.pathname]);

    if (isLoginPage) return <Routes><Route path="/login" element={<Login />} /></Routes>;
    if (!localStorage.getItem('token')) return <Login />;

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="brand-icon">I</div>
                <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <SidebarIcon to="/" icon={<LayoutDashboard size={22} />} label="Дашборд" />
                    <SidebarIcon to="/projects" icon={<FolderKanban size={22} />} label="Проекты" />
                    <SidebarIcon to="/tickets" icon={<ListTodo size={22} />} label="Задачи" />
                    <SidebarIcon to="/team" icon={<Users size={22} />} label="Команда" />
                    <SidebarIcon to="/reports" icon={<ClipboardList size={22} />} label="Отчеты" />
                </nav>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <button className="nav-item" data-label="Выход" style={{ border: 'none', background: 'transparent' }} onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}>
                        <LogOut size={22} strokeWidth={1.5} />
                    </button>
                </div>
            </aside>
            <main className="content-area">
                <SubNavigation location={location} />
                <div className="page-canvas">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/projects/:id" element={<ProjectDetail />} />
                        <Route path="/tickets" element={<Tickets />} />
                        <Route path="/tickets/:id" element={<TicketDetail />} />
                        <Route path="/team" element={<Team />} />
                        <Route path="/team/:id" element={<UserDetail />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="*" element={<div>Страница не найдена</div>} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default App;