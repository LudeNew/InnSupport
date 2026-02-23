import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUsers, getTickets } from '../api';
import { ArrowLeft, Mail, Briefcase, ListTodo, CheckCircle2 } from 'lucide-react';

const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [userTickets, setUserTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Получаем всех пользователей и ищем нужного (либо можно добавить API метод get_user(id))
                const usersRes = await getUsers();
                const foundUser = usersRes.data.find(u => u.id === parseInt(id));
                setUser(foundUser);

                // Получаем задачи и фильтруем те, где исполнитель - этот юзер
                const ticketsRes = await getTickets();
                const assigned = ticketsRes.data.filter(t => t.assignee === parseInt(id));
                setUserTickets(assigned);
            } catch (error) {
                console.error("Ошибка при загрузке профиля сотрудника", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id]);

    if (loading) return <div>Загрузка профиля...</div>;
    if (!user) return <div>Сотрудник не найден.</div>;

    const activeTickets = userTickets.filter(t => t.status !== 'DONE');
    const doneTickets = userTickets.filter(t => t.status === 'DONE');

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Навигация */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate('/team')} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.6rem', cursor: 'pointer', display: 'flex' }}>
                    <ArrowLeft size={18} />
                </button>
                <span style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111827' }}>Профиль сотрудника</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>

                {/* ЛЕВАЯ КОЛОНКА: Инфо о сотруднике */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="biz-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                        <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#4f46e5', color: 'white', fontSize: '2.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            {user.username[0].toUpperCase()}
                        </div>
                        <h2 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>{user.first_name || user.username} {user.last_name || ''}</h2>
                        <p style={{ color: '#6b7280', margin: '0 0 1.5rem 0' }}>@{user.username}</p>

                        {user.profile?.department_details && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '12px', color: '#374151', fontWeight: '600', marginBottom: '1.5rem' }}>
                                <Briefcase size={18} /> {user.profile.department_details.name}
                            </div>
                        )}

                        {user.profile?.bio && (
                            <p style={{ color: '#4b5563', fontStyle: 'italic', lineHeight: '1.5', background: '#f9fafb', padding: '1rem', borderRadius: '12px', margin: 0 }}>
                                "{user.profile.bio}"
                            </p>
                        )}
                    </div>

                    <div className="biz-card">
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>Контакты</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#4b5563' }}>
                            <div style={{ background: '#f3f4f6', padding: '0.6rem', borderRadius: '50%' }}><Mail size={18} /></div>
                            <span>{user.email || 'Не указан'}</span>
                        </div>
                    </div>
                </div>

                {/* ПРАВАЯ КОЛОНКА: Задачи */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div className="biz-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '1rem', borderRadius: '12px' }}><ListTodo size={24} /></div>
                            <div>
                                <div style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1 }}>{activeTickets.length}</div>
                                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Задач в работе</div>
                            </div>
                        </div>
                        <div className="biz-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#f0fdf4', color: '#15803d', padding: '1rem', borderRadius: '12px' }}><CheckCircle2 size={24} /></div>
                            <div>
                                <div style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1 }}>{doneTickets.length}</div>
                                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Выполнено всего</div>
                            </div>
                        </div>
                    </div>

                    <div className="biz-card">
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>Текущие задачи</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {activeTickets.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Сотрудник сейчас свободен от задач</div>
                            ) : (
                                activeTickets.map(ticket => (
                                    <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)} style={{ padding: '1rem 1.2rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }} className="user-ticket-hover">
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? '#ef4444' : '#10b981' }}></div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#111827', marginBottom: '0.2rem' }}>{ticket.title}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>#{ticket.id} • {ticket.project_details?.name || 'Проект'}</div>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.3rem 0.8rem', borderRadius: '20px', background: ticket.status === 'IN_PROGRESS' ? '#eff6ff' : '#f3f4f6', color: ticket.status === 'IN_PROGRESS' ? '#1d4ed8' : '#4b5563' }}>
                                            {ticket.status === 'IN_PROGRESS' ? 'В работе' : 'Открыто'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <style>{`.user-ticket-hover:hover { border-color: #d1d5db !important; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }`}</style>
        </div>
    );
};

export default UserDetail;