import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getProjects } from '../api';
import { FolderKanban, Plus, Clock, ArrowRight, Activity } from 'lucide-react';
import CreateProjectModal from './CreateProjectModal';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'internal';

    // RBAC: Проверяем роль текущего пользователя
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userRole = currentUser.profile?.role;
    // Только Администратор и Главный менеджер могут создавать проекты
    const canCreateProject = userRole === 'ADMIN' || userRole === 'GENERAL_MANAGER';

    const fetchProjects = async () => {
        try {
            const response = await getProjects();
            const data = response.data;

            // ЖЕЛЕЗОБЕТОННАЯ ПРОВЕРКА МАССИВА
            if (Array.isArray(data)) {
                setProjects(data);
            } else if (data && Array.isArray(data.results)) {
                setProjects(data.results);
            } else {
                setProjects([]);
            }
        } catch (error) {
            console.error("Не удалось загрузить проекты", error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    if (loading) return <div>Загрузка проектов...</div>;

    // ГАРАНТИЯ МАССИВА
    const safeProjects = Array.isArray(projects) ? projects : [];

    // Фильтруем проекты в зависимости от выбранного таба
    const filteredProjects = safeProjects.filter(p => {
        if (activeTab === 'all') return true;
        if (activeTab === 'internal') return p.project_type === 'INTERNAL';
        if (activeTab === 'external') return p.project_type === 'EXTERNAL';
        if (activeTab === 'closed') return p.status === 'CLOSED';
        return true;
    });

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ flex: 1 }}></div>

                {canCreateProject && (
                    <button
                        className="btn btn-primary"
                        style={{ boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={20} /> Новый проект
                    </button>
                )}
            </div>

            {showCreateModal && (
                <CreateProjectModal
                    onClose={() => setShowCreateModal(false)}
                    onProjectCreated={() => { fetchProjects(); }}
                />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredProjects.map(project => (
                    <div
                        key={project.id}
                        className="biz-card project-card-wide"
                        onClick={() => navigate(`/projects/${project.id}`)}
                        style={{
                            padding: '1.5rem 2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid #f3f4f6',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            gap: '2rem'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 2 }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: '16px',
                                background: project.status === 'CLOSED' ? '#f3f4f6' : '#e0e7ff',
                                color: project.status === 'CLOSED' ? '#9ca3af' : '#4f46e5',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <FolderKanban size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.4rem', fontWeight: '700', color: '#111827' }}>
                                    {project.name}
                                </h3>
                                <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {project.description || "Описание отсутствует..."}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '2rem', flex: 1, justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#111827' }}>{project.stages?.length || 0}</div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Этапов</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#111827' }}><Activity size={18} /></div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>В работе</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1, justifyContent: 'flex-end' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <span className="badge" style={{
                                    background: project.status === 'CLOSED' ? '#f3f4f6' : '#f0fdf4',
                                    color: project.status === 'CLOSED' ? '#4b5563' : '#166534'
                                }}>
                                    {project.status === 'CLOSED' ? 'Закрыт' : 'Активен'}
                                </span>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem', color: '#9ca3af' }}>
                                    <Clock size={14} />
                                    <span>{new Date(project.updated_at || project.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div style={{ color: '#9ca3af', padding: '0.5rem', borderRadius: '50%', background: '#f9fafb' }}>
                                <ArrowRight size={20} />
                            </div>
                        </div>
                    </div>
                ))}

                {filteredProjects.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '5rem', color: '#9ca3af', background: '#f9fafb', borderRadius: '24px', border: '1px dashed #e5e7eb' }}>
                        <FolderKanban size={48} style={{ opacity: 0.3, marginBottom: '1rem', margin: '0 auto' }} />
                        <h3 style={{ color: '#4b5563', marginBottom: '0.5rem' }}>Проектов в этой категории нет</h3>
                        <p>Самое время создать новый проект!</p>
                    </div>
                )}
            </div>

            <style>{`
                .project-card-wide:hover {
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
                    transform: translateY(-2px);
                    border-color: #e5e7eb !important;
                }
            `}</style>
        </div>
    );
};

export default Projects;