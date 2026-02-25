import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getUsers } from '../api';
import { Mail, Send, Code, Bug, Palette, Briefcase, Headphones, Users as UsersIcon, ArrowRight, Target } from 'lucide-react';

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

const Team = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'all';

    useEffect(() => {
        getUsers().then(res => {
            setUsers(Array.isArray(res.data) ? res.data : (res.data.results || []));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div>Загрузка команды...</div>;

    const filteredUsers = (Array.isArray(users) ? users : []).filter(u => {
        if (activeTab === 'all') return true;
        const depts = (u.profile?.departments_details || []).map(link => link.department_details?.name?.toLowerCase() || '');
        if (activeTab === 'dev') return depts.some(d => d.includes('разраб'));
        if (activeTab === 'qa') return depts.some(d => d.includes('тест'));
        if (activeTab === 'design') return depts.some(d => d.includes('дизайн'));
        if (activeTab === 'management') return depts.some(d => d.includes('менедж'));
        if (activeTab === 'support') return depts.some(d => d.includes('поддерж'));
        return true;
    });

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                {filteredUsers.map(user => {
                    const hasAvatar = !!user.profile?.avatar;

                    return (
                        // ИСПРАВЛЕНИЕ ЗДЕСЬ: Возвращен правильный путь /team/${user.id}
                        <div key={user.id} onClick={() => navigate(`/team/${user.id}`)} className="biz-card hover-lift" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', transition: 'all 0.2s', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#f3f4f6', overflow: 'hidden', border: '2px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {hasAvatar ? <img src={user.profile.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UsersIcon size={30} color="#9ca3af" />}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: user.active_tickets_count > 0 ? '#eff6ff' : '#f9fafb', color: user.active_tickets_count > 0 ? '#2563eb' : '#9ca3af', padding: '0.3rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' }}>
                                        <Target size={12} /> Задач: {user.active_tickets_count || 0}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.2rem' }}>{user.first_name || user.username} {user.last_name || ''}</h3>
                                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>@{user.username}</div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                                        {user.profile?.departments_details?.map(link => {
                                            const level = getLevelConfig(link.level);
                                            const dept = link.department_details;
                                            return (
                                                <div key={link.id} style={{ display: 'inline-flex', alignItems: 'stretch', background: level.bg, border: `1px solid ${level.color}30`, borderRadius: '6px', overflow: 'hidden', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                    <div style={{ background: level.color, color: 'white', padding: '0.2rem 0.5rem', textTransform: 'uppercase' }}>{level.label}</div>
                                                    <div style={{ padding: '0.2rem 0.6rem', color: level.color, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        {getDepartmentIcon(dept?.name)} {dept?.name}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>
                                        {user.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> {user.email}</div>}
                                        {user.profile?.tg_link && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0ea5e9', fontWeight: '500' }}><Send size={14} /> Telegram</div>}
                                    </div>
                                </div>
                            </div>
                            <div style={{ color: '#9ca3af', padding: '0.5rem', borderRadius: '50%', background: '#f9fafb' }}><ArrowRight size={20} /></div>
                        </div>
                    );
                })}
            </div>
            <style>{`.hover-lift:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border-color: #e5e7eb !important; }`}</style>
        </div>
    );
};
export default Team;