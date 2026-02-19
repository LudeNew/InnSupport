
import { useEffect, useState } from 'react';
import { getProjects } from '../api';
import { FolderKanban, Plus, Clock, MoreHorizontal } from 'lucide-react';
import CreateProjectModal from './CreateProjectModal';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchProjects = async () => {
        try {
            const response = await getProjects();
            setProjects(response.data);
        } catch (error) {
            console.error("Не удалось загрузить проекты");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    if (loading) return <div>Загрузка проектов...</div>;

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button
                    className="btn btn-primary"
                    style={{ boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus size={20} /> Новый проект
                </button>
            </div>

            {showCreateModal && (
                <CreateProjectModal
                    onClose={() => setShowCreateModal(false)}
                    onProjectCreated={() => { fetchProjects(); }}
                />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                {projects.map(project => (
                    <div key={project.id} className="biz-card" style={{
                        padding: '1.8rem',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        position: 'relative',
                        justifyContent: 'space-between',
                        border: '1px solid #f3f4f6'
                    }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{
                                    width: 54, height: 54, borderRadius: '14px',
                                    background: '#f9fafb',
                                    color: '#111827',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold'
                                }}>
                                    <FolderKanban size={26} strokeWidth={1.5} />
                                </div>
                                <button style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MoreHorizontal size={20} color="#9ca3af" />
                                </button>
                            </div>

                            <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '1.4rem', fontWeight: '700', color: '#111827' }}>{project.name}</h3>
                            <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', height: '3.2rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {project.description || "Описания нет"}
                            </p>
                        </div>

                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#9ca3af' }}>
                            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                                <Clock size={16} />
                                <span>{new Date(project.updated_at || project.created_at).toLocaleDateString()}</span>
                            </div>
                            <span className="badge" style={{ background: '#f0fdf4', color: '#166534', padding: '0.3rem 0.8rem', fontSize: '0.75rem' }}>Активен</span>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#9ca3af', background: '#f9fafb', borderRadius: '24px', border: '1px dashed #e5e7eb' }}>
                        <FolderKanban size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>Проектов нет. Самое время создать первый!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Projects;
