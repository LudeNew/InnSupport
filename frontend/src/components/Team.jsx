
import { useState, useEffect } from 'react';
import { getUsers } from '../api';
import { Users, Mail, Phone, Calendar } from 'lucide-react';

const Team = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await getUsers();
                setUsers(response.data);
            } catch (error) {
                console.error("Не удалось загрузить команду");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    if (loading) return <div>Загрузка команды...</div>;

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                {users.map(user => (
                    <div key={user.id} className="biz-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: '50%',
                                background: '#111827',
                                color: 'white', fontSize: '1.6rem', fontWeight: 'bold',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {user.username[0].toUpperCase()}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#111827' }}>
                                    {user.first_name || user.username} {user.last_name || ''}
                                </h3>
                                <p style={{ margin: '0.3rem 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>@{user.username}</p>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#4b5563' }}>
                                <Mail size={16} />
                                <span>{user.email || 'Почта не указана'}</span>
                            </div>
                            {user.profile?.bio && (
                                <p style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic', marginTop: '0.5rem', lineHeight: '1.5' }}>
                                    "{user.profile.bio}"
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                {users.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
                        Сотрудников не найдено
                    </div>
                )}
            </div>
        </div>
    );
};

export default Team;
