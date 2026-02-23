import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicket, startTimer, stopTimer, createComment, getWorkTypes, updateTicket, createNote, uploadTicketAttachment } from '../api';
import { ArrowLeft, Play, Square, MessageSquare, Clock, ChevronRight, Activity, StickyNote, History, Paperclip, Download, Upload } from 'lucide-react';
import 'react-quill/dist/quill.snow.css';

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timerLoading, setTimerLoading] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    const [commentText, setCommentText] = useState("");
    const [noteText, setNoteText] = useState("");
    const [activeTab, setActiveTab] = useState('comments');

    const [workTypes, setWorkTypes] = useState([]);
    const [selectedWorkType, setSelectedWorkType] = useState('');
    const [selectedSubWorkType, setSelectedSubWorkType] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);

    const fetchTicket = async () => {
        try {
            const response = await getTicket(id);
            setTicket(response.data);
            if (response.data.active_timer) {
                setSelectedSubWorkType(response.data.active_timer.work_type);
            }
        } catch (error) {
            console.error("Ошибка загрузки задачи");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicket();
        getWorkTypes().then(res => setWorkTypes(res.data)).catch(console.error);
    }, [id]);

    useEffect(() => {
        let interval = null;
        if (ticket?.active_timer?.start_time) {
            interval = setInterval(() => {
                const start = new Date(ticket.active_timer.start_time).getTime();
                setElapsedTime(Math.floor((new Date().getTime() - start) / 1000));
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [ticket]);

    const formatElapsedTime = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStartTimer = async () => {
        if (!selectedSubWorkType) return alert("Выберите подтип работ.");
        setTimerLoading(true);
        try { await startTimer(ticket.id, { work_type: selectedSubWorkType }); await fetchTicket(); }
        catch (e) { alert("Ошибка таймера"); } finally { setTimerLoading(false); }
    };

    const handleStopTimer = async () => {
        setTimerLoading(true);
        try { await stopTimer(ticket.id); setSelectedWorkType(''); setSelectedSubWorkType(''); await fetchTicket(); }
        catch (e) { alert("Ошибка остановки таймера."); } finally { setTimerLoading(false); }
    };

    const submitComment = async () => {
        if (!commentText.trim()) return;
        try { await createComment({ ticket: ticket.id, text: commentText }); setCommentText(""); await fetchTicket(); }
        catch (e) { alert("Ошибка отправки комментария"); }
    };

    const submitNote = async () => {
        if (!noteText.trim()) return;
        try { await createNote({ ticket: ticket.id, text: noteText }); setNoteText(""); await fetchTicket(); }
        catch (e) { alert("Ошибка создания заметки"); }
    };

    const handleStatusChange = async (newStatus) => {
        try { await updateTicket(ticket.id, { status: newStatus }); await fetchTicket(); }
        catch (e) { alert("Ошибка смены статуса"); }
    };

    // ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ ФАЙЛОВ
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingFile(true);

        const formData = new FormData();
        formData.append('ticket', ticket.id);
        formData.append('file', file);

        try {
            await uploadTicketAttachment(formData);
            await fetchTicket();
        } catch (error) {
            alert("Ошибка при загрузке файла");
        } finally {
            setUploadingFile(false);
            e.target.value = null; // Очищаем инпут
        }
    };

    if (loading) return <div>Загрузка задачи...</div>;
    if (!ticket) return <div>Задача не найдена</div>;

    const isActive = !!ticket.active_timer;
    const parentWorkTypes = workTypes.filter(wt => !wt.parent);
    const subWorkTypes = workTypes.filter(wt => wt.parent === parseInt(selectedWorkType));

    return (
        <div style={{ padding: '0 0.5rem 2rem 0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/tickets')} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.6rem', cursor: 'pointer', display: 'flex' }}>
                    <ArrowLeft size={18} />
                </button>
                <div style={{ fontSize: '0.9rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{ticket.project_details?.name || 'Проект'}</span><ChevronRight size={14} /><span style={{ color: '#111827', fontWeight: '500' }}>#{ticket.id}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* ЛЕВАЯ КОЛОНКА */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Блок 1: Заголовок, Описание и ВЛОЖЕНИЯ */}
                    <div className="biz-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <select value={ticket.status} onChange={(e) => handleStatusChange(e.target.value)} style={{ padding: '0.4rem 1rem', borderRadius: '99px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', outline: 'none', background: ticket.status === 'IN_PROGRESS' ? '#eff6ff' : ticket.status === 'DONE' ? '#f0fdf4' : ticket.status === 'REVIEW' ? '#fefce8' : '#f3f4f6', color: ticket.status === 'IN_PROGRESS' ? '#1d4ed8' : ticket.status === 'DONE' ? '#15803d' : ticket.status === 'REVIEW' ? '#a16207' : '#4b5563', border: '1px solid transparent' }}>
                                <option value="OPEN">Открыто</option>
                                <option value="IN_PROGRESS">В работе</option>
                                <option value="REVIEW">На проверке</option>
                                <option value="DONE">Готово</option>
                            </select>
                            <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></div> {ticket.priority}
                            </span>
                        </div>
                        <h1 style={{ margin: '0 0 1.5rem 0', fontSize: '1.8rem', color: '#111827' }}>{ticket.title}</h1>

                        <div className="ql-snow" style={{ marginBottom: '2rem' }}>
                            <div className="ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: ticket.description || "<p>Описания нет.</p>" }} />
                        </div>

                        {/* ЗОНА ВЛОЖЕНИЙ (Внутри первой карточки, под описанием) */}
                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Paperclip size={18} /> Вложения ({ticket.attachments_details?.length || 0})
                                </h3>

                                {/* Кнопка загрузки файла */}
                                <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#4f46e5', background: '#e0e7ff', padding: '0.4rem 0.8rem', borderRadius: '8px', transition: 'background 0.2s' }}>
                                    {uploadingFile ? <div className="spinner" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> : <Upload size={14} />}
                                    {uploadingFile ? 'Загрузка...' : 'Прикрепить файл'}
                                    <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploadingFile} />
                                </label>
                            </div>

                            {/* Список прикрепленных файлов */}
                            {ticket.attachments_details?.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                    {ticket.attachments_details.map(att => (
                                        <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', minWidth: '200px' }}>
                                            <div style={{ background: '#e0e7ff', color: '#4f46e5', padding: '0.5rem', borderRadius: '6px' }}><Paperclip size={16} /></div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.file_name}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{new Date(att.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <a href={att.file} target="_blank" rel="noopener noreferrer" style={{ color: '#6b7280', padding: '0.3rem', borderRadius: '50%', cursor: 'pointer' }} title="Скачать">
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Блок 2: ТРЕКИНГ ВРЕМЕНИ */}
                    <div className="biz-card" style={{ background: isActive ? '#f0fdf4' : '#fff', border: isActive ? '2px solid #bbf7d0' : '1px solid #e5e7eb', transition: 'all 0.3s' }}>
                        <h2 style={{ margin: '0 0 1.5rem 0', color: isActive ? '#166534' : '#111827', display: 'flex', alignItems: 'center', gap: '0.8rem' }}><Clock size={24} /> Трекинг времени {isActive && <span style={{ background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.9rem', animation: 'pulse 2s infinite' }}>В процессе...</span>}</h2>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', marginBottom: '2rem', background: '#f9fafb', padding: '1.5rem', borderRadius: '12px' }}>
                            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Тип работ</label><select className="input-clean" disabled={isActive} value={selectedWorkType} onChange={e => { setSelectedWorkType(e.target.value); setSelectedSubWorkType(''); }}><option value="">Выберите...</option>{parentWorkTypes.map(wt => <option key={wt.id} value={wt.id}>{wt.name}</option>)}</select></div>
                            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Подтип работ</label><select className="input-clean" disabled={isActive || !selectedWorkType} value={selectedSubWorkType} onChange={e => setSelectedSubWorkType(e.target.value)}><option value="">Выберите подтип...</option>{subWorkTypes.map(wt => <option key={wt.id} value={wt.id}>{wt.name}</option>)}</select></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {isActive && <div style={{ fontSize: '2rem', fontWeight: '800', color: '#166534', minWidth: '120px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{formatElapsedTime(elapsedTime)}</div>}
                                <button onClick={isActive ? handleStopTimer : handleStartTimer} disabled={timerLoading} style={{ background: isActive ? '#fecaca' : '#4f46e5', color: isActive ? '#dc2626' : 'white', border: 'none', borderRadius: '12px', padding: '1rem 2rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>{isActive ? <><Square size={20} fill="currentColor" /> Завершить</> : <><Play size={20} fill="currentColor" /> Начать</>}</button>
                            </div>
                        </div>
                        <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563' }}><Activity size={18} /> История логов ({ticket.worklogs_details?.length || 0})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                            {ticket.worklogs_details?.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Логи пока пусты.</p> : ticket.worklogs_details?.map(log => <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem' }}><div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}><span style={{ fontWeight: '600', color: '#111827' }}>{log.user_details?.username}</span><span style={{ color: '#6b7280' }}>{log.work_type_details?.name || 'Без типа'}</span></div><div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}><span style={{ fontWeight: 'bold', color: '#4f46e5' }}>{log.time_spent_minutes} мин.</span><span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{new Date(log.created_at).toLocaleDateString()}</span></div></div>)}
                        </div>
                    </div>

                    {/* Блок 3: ЗАМЕТКИ */}
                    <div className="biz-card" style={{ borderTop: '4px solid #f59e0b' }}>
                        <h3 style={{ margin: '0 0 1.2rem 0', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><StickyNote size={20} color="#f59e0b" /> Важные заметки</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            {ticket.notes_details?.length === 0 && <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: 0 }}>Заметок пока нет.</p>}
                            {ticket.notes_details?.map(note => <div key={note.id} style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #f59e0b', fontSize: '0.95rem', color: '#374151' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}><span style={{ fontWeight: '600', color: '#111827' }}>{note.author_details?.username}</span><span style={{ color: '#9ca3af' }}>{new Date(note.created_at).toLocaleString()}</span></div><div style={{ lineHeight: '1.5' }}>{note.text}</div></div>)}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}><input type="text" className="input-clean" placeholder="Добавить заметку..." value={noteText} onChange={e => setNoteText(e.target.value)} style={{ flex: 1 }} /><button className="btn" style={{ background: 'white', border: '1px solid #e5e7eb', color: '#374151', fontWeight: '600' }} onClick={submitNote}>Добавить</button></div>
                    </div>

                    {/* Блок 4: ТАБЫ */}
                    <div className="biz-card">
                        <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            <button onClick={() => setActiveTab('comments')} style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: '600', color: activeTab === 'comments' ? '#111827' : '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={18} /> Обсуждение ({ticket.comments_details?.length || 0})</button>
                            <button onClick={() => setActiveTab('history')} style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: '600', color: activeTab === 'history' ? '#111827' : '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><History size={18} /> История</button>
                        </div>
                        {activeTab === 'comments' ? (
                            <><div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>{ticket.comments_details?.length === 0 && <p style={{ color: '#9ca3af' }}>Комментариев пока нет.</p>}{ticket.comments_details?.map(comment => <div key={comment.id} style={{ display: 'flex', gap: '1rem' }}><div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>{comment.author_details?.username?.[0]?.toUpperCase()}</div><div style={{ flex: 1, background: '#f9fafb', padding: '1rem', borderRadius: '0 12px 12px 12px', border: '1px solid #e5e7eb' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}><span style={{ fontWeight: '600', color: '#111827' }}>{comment.author_details?.username}</span><span style={{ color: '#9ca3af' }}>{new Date(comment.created_at).toLocaleString()}</span></div><div style={{ color: '#4b5563', lineHeight: '1.5' }}>{comment.text}</div></div></div>)}</div><div style={{ display: 'flex', gap: '1rem' }}><textarea className="input-clean" rows="2" placeholder="Написать комментарий..." value={commentText} onChange={e => setCommentText(e.target.value)} style={{ flex: 1, resize: 'vertical' }}></textarea><button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={submitComment}>Отправить</button></div></>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>{ticket.history_details?.length === 0 ? <p style={{ color: '#9ca3af' }}>История пуста.</p> : ticket.history_details?.slice().reverse().map(item => <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f3f4f6' }}><div style={{ marginTop: '3px', color: '#9ca3af' }}><Activity size={16} /></div><div><div style={{ fontSize: '0.9rem', color: '#374151' }}><span style={{ fontWeight: '600', color: '#111827' }}>{item.user_details?.username || 'Система'}</span> {item.action}</div><div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>{new Date(item.created_at).toLocaleString()}</div></div></div>)}</div>
                        )}
                    </div>
                </div>

                {/* ПРАВАЯ КОЛОНКА */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="biz-card">
                        <h3 style={{ margin: '0 0 1rem 0' }}>Детали задачи</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}><span style={{ color: '#6b7280' }}>Исполнитель</span><span style={{ fontWeight: '600', color: '#111827' }}>{ticket.assignee_details?.username || 'Не назначен'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}><span style={{ color: '#6b7280' }}>Проект</span><span style={{ fontWeight: '500' }}>{ticket.project_details?.name}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}><span style={{ color: '#6b7280' }}>Создатель</span><span style={{ fontWeight: '500' }}>{ticket.creator_details?.username}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6b7280' }}>Создано</span><span>{new Date(ticket.created_at).toLocaleDateString()}</span></div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default TicketDetail;