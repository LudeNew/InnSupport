
import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, ListTodo, ClipboardList, Clock, Settings, LogOut, ChevronDown } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Tickets from './components/Tickets';
import Team from './components/Team';
import Login from './components/Login';

// 4. Each section will have subsections displayed in a upper floating menu
const SubNavigation = ({ location }) => {
    const path = location.pathname;

    // Define subsections for each main route
    const subsections = {
        '/': [
            { label: 'Обзор', path: '/' },
            { label: 'Аналитика', path: '/analytics' },
            { label: 'События', path: '/events' }
        ],
        '/projects': [
            { label: 'Внутренние', path: '/projects?type=internal' },
            { label: 'Внешние', path: '/projects?type=external' },
            { label: 'Закрытые', path: '/projects?status=closed' }
        ],
        '/tickets': [
            { label: 'Новые', path: '/tickets?status=new' },
            { label: 'В работе', path: '/tickets?status=inprogress' },
            { label: 'На проверке', path: '/tickets?status=review' },
            { label: 'Переоткрытые', path: '/tickets?status=reopened' },
            { label: 'Завершенные', path: '/tickets?status=done' }
        ],
        '/team': [
            { label: 'Разработка', path: '/team?dept=dev' },
            { label: 'Тестирование', path: '/team?dept=qa' },
            { label: 'Менеджмент', path: '/team?dept=pm' },
            { label: 'Дизайн', path: '/team?dept=design' },
            { label: 'Тех. поддержка', path: '/team?dept=support' }
        ]
    };

    const currentSubs = subsections[path] || subsections['/'];

    return (
        <div className="top-bar-container">
            <h2 style={{ margin: 0 }}>
                {path === '/' ? 'Дашборд' :
                    path === '/projects' ? 'Проекты' :
                        path === '/tickets' ? 'Задачи' :
                            path === '/team' ? 'Команда' : 'Раздел'}
            </h2>

            <div className="subsection-menu">
                {currentSubs?.map((sub, idx) => (
                    <div
                        key={idx}
                        className={`sub-link ${idx === 0 ? 'active' : ''}`}
                        onClick={() => { }}
                    >
                        {sub.label}
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.5rem', background: 'white', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Settings size={20} color="var(--text-muted)" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'white', padding: '0.4rem 0.8rem 0.4rem 0.4rem', borderRadius: '99px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>A</div>
                    <ChevronDown size={14} color="var(--text-muted)" />
                </div>
            </div>
        </div>
    );
};

const SidebarIcon = ({ to, icon, label }) => {
    const location = useLocation();
    const active = location.pathname === to;

    return (
        <Link
            to={to}
            className={`nav-item ${active ? 'active' : ''}`}
            data-label={label}
        >
            {icon}
        </Link>
    );
};

function App() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    if (isLoginPage) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
            </Routes>
        );
    }

    // Auth Check
    if (!localStorage.getItem('token')) {
        return <Login />;
    }

    return (
        <div className="app-container">
            {/* 1. Floating Sidebar - Icons Only */}
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
                    <button
                        className="nav-item"
                        data-label="Выход"
                        style={{ border: 'none', background: 'transparent' }}
                        onClick={() => {
                            localStorage.removeItem('token');
                            window.location.reload();
                        }}
                    >
                        <LogOut size={22} strokeWidth={1.5} />
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="content-area">
                {/* Upper Floating Header/Menu */}
                <SubNavigation location={location} />

                {/* Scrollable Canvas */}
                <div className="page-canvas">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/tickets" element={<Tickets />} />
                        <Route path="/team" element={<Team />} />
                        <Route path="*" element={<div>Страница не найдена</div>} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default App;
