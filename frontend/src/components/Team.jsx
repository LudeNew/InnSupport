import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getUsers } from '../api';
import { Mail, Briefcase, ChevronRight } from 'lucide-react';

const Team = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'all';

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getUsers();
                const data = response.data;

                // ЖЕЛЕЗОБЕТОННАЯ ПРОВЕРКА МАССИВА
                if (Array.isArray(data)) {
                    setUsers(data);
                } else if (data && Array.isArray(data.results)) {
                    setUsers(data.results);
                } else {
                    setUsers([]);
                }
            } catch (error) {
                console.error("Не удалось загрузить команду", error);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    if (loading) return <div>Загрузка команды...</div>;

    const departmentMap = {
        'dev': 'Разработка',
        'qa': 'Тестирование',
        'design': 'Дизайн'
    };

    // ГАРАНТИЯ МАССИВА
    const safeUsers = Array.isArray(users) ? users : [];

    const filteredUsers = safeUsers.filter(user => {
        if (activeTab === 'all') return true;
        const depName = user.profile?.department_details?.name || '';
        return depName === departmentMap[activeTab];
    });

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                {filteredUsers.map(user => (
                    <div
                        key={user.id}
                        className="biz-card team-card-hover"
                        onClick={() => navigate(`/team/${user.id}`)}
                        style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid #f3f4f6', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                                <div style={{
                                    width: 70, height: 70, borderRadius: '50%',
                                    background: '#e0e7ff', color: '#4f46e5',
                                    fontSize: '1.8rem', fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: '#111827' }}>
                                        {user.first_name || user.username} {user.last_name || ''}
                                    </h3>
                                    <p style={{ margin: '0.3rem 0 0 0', color: '#6b7280', fontSize: '0.95rem' }}>@{user.username}</p>
                                </div>
                            </div>
                        </div>

                        {user.profile?.department_details && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#f3f4f6', padding: '0.4rem 0.8rem', borderRadius: '8px', alignSelf: 'flex-start', color: '#4b5563', fontSize: '0.85rem', fontWeight: '600' }}>
                                <Briefcase size={16} /> {user.profile.department_details.name}
                            </div>
                        )}

                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#4b5563' }}>
                                <Mail size={18} />
                                <span>{user.email || 'Почта не указана'}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', color: '#9ca3af' }}>
                            <ChevronRight size={20} />
                        </div>
                    </div>
                ))}

                {filteredUsers.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', color: '#9ca3af', background: '#f9fafb', borderRadius: '24px', border: '1px dashed #e5e7eb' }}>
                        <Briefcase size={48} style={{ opacity: 0.3, marginBottom: '1rem', margin: '0 auto' }} />
                        <h3 style={{ color: '#4b5563' }}>В этом отделе пока нет сотрудников</h3>
                    </div>
                )}
            </div>

            <style>{`
                .team-card-hover:hover {
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
                    transform: translateY(-2px);
                    border-color: #e5e7eb !important;
                }
            `}</style>
        </div>
    );
};

export default Team;