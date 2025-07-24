import React, { useEffect, useState } from 'react';
import { request } from '@/request';
import { Button, Input, message } from 'antd';

export default function QueryNotes({ queryId }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newNote, setNewNote] = useState('');

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const res = await request.get(`/query/${queryId}/notes`);
            setNotes(res?.result || []);
        } catch (error) {
            message.error('Failed to load notes');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        try {
            await request.post(`/query/${queryId}/notes`, {
                text: newNote,
            });
            message.success('Note added');
            setNewNote('');
            fetchNotes();
        } catch (error) {
            message.error('Failed to add note');
        }
    };

    useEffect(() => {
        if (queryId) fetchNotes();
    }, [queryId]);

    return (
        <div style={{ padding: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Notes</h3>

            <div style={{ marginBottom: '1rem' }}>
                <Input.TextArea
                    value={newNote}
                    rows={3}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write a new note..."
                />
                <Button
                    type="primary"
                    onClick={handleAddNote}
                    style={{ marginTop: '0.5rem' }}
                    disabled={!newNote.trim()}
                >
                    Add Note
                </Button>
            </div>

            <div>
                {loading ? (
                    <p>Loading notes...</p>
                ) : (
                    notes.map((note, idx) => (
                        <div
                            key={idx}
                            style={{
                                padding: '0.5rem',
                                marginBottom: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: '#f9f9f9',
                            }}
                        >
                            <p style={{ margin: 0 }}>{note.text}</p>
                            <small style={{ color: '#999' }}>
                                {new Date(note.createdAt).toLocaleString()}
                            </small>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
