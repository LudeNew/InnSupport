
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { Lock, User } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await login(username, password);
            localStorage.setItem('token', response.data.token);
            // Reload window to reset axios interceptors or navigate
            // Since axios interceptor reads from localStorage on each request, navigation is enough?
            // Actually, the interceptor is defined at module level. It reads localStorage inside the callback.
            // So just navigation is fine.
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Неверное имя пользователя или пароль');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute', // Override app-container layout
            top: 0, left: 0, zIndex: 1000
        }}>
            <div className="biz-card" style={{ width: '100%', maxWidth: '400px', padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: 64, height: 64, margin: '0 auto 1.5rem auto',
                        background: '#111827', color: 'white', borderRadius: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.8rem', fontWeight: '800'
                    }}>
                        I
                    </div>
                    <h1 style={{ fontSize: '1.8rem' }}>Вход в систему</h1>
                    <p style={{ marginTop: '0.5rem' }}>InnSupport Workspace</p>
                </div>

                {error && (
                    <div style={{
                        padding: '1rem', background: '#fee2e2', color: '#dc2626',
                        borderRadius: '12px', marginBottom: '1.5rem',
                        fontSize: '0.9rem', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ position: 'relative' }}>
                        <User size={20} color="#9ca3af" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            className="input-clean"
                            style={{ paddingLeft: '3rem' }}
                            placeholder="Имя пользователя"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={20} color="#9ca3af" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="password"
                            className="input-clean"
                            style={{ paddingLeft: '3rem' }}
                            placeholder="Пароль"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ justifyContent: 'center', marginTop: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '1rem' }}>
                        admin / admin12345
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
