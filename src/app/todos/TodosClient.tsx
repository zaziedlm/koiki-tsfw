'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTodo, toggleTodo } from '../../actions/todo';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

interface TodosClientProps {
  initialTodos: Todo[];
}

export function TodosClient({ initialTodos }: TodosClientProps) {
  const router = useRouter();
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    
    setError('');
    startTransition(async () => {
      const result = await createTodo({ title: newTodoTitle });
      
      if (result.success) {
        setNewTodoTitle('');
        router.refresh();
      } else {
        setError(result.error || 'タスクの追加に失敗しました');
      }
    });
  };

  const handleToggle = (id: string) => {
    setError('');
    startTransition(async () => {
      const result = await toggleTodo({ id });
      
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || 'タスクの更新に失敗しました');
      }
    });
  };

  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '3rem' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>TODO管理</h2>

        {error && (
          <p className="alert-danger" style={{ marginBottom: '1rem' }}>
            ⚠️ {error}
          </p>
        )}

        <form onSubmit={handleAddTodo} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="新しいタスクを入力..."
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending || !newTodoTitle.trim()}
            >
              {isPending ? '追加中...' : '追加'}
            </button>
          </div>
        </form>

        {initialTodos && initialTodos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {initialTodos.map((todo) => (
              <div
                key={todo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: todo.completed ? 'var(--surface)' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo.id)}
                  disabled={isPending}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span
                  style={{
                    flex: 1,
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? 'var(--muted)' : 'inherit',
                  }}
                >
                  {todo.title}
                </span>
                <small className="text-muted">
                  {new Date(todo.createdAt).toLocaleDateString('ja-JP')}
                </small>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">
            まだTODOがありません。上のフォームから追加してください。
          </p>
        )}
      </div>
    </div>
  );
}
