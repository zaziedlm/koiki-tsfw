'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '../../lib/trpc-client';

export default function TodosPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const utils = trpc.useUtils();

  // Protect the route
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/todos');
    }
  }, [status, router]);

  const { data: todos, isLoading } = trpc.todo.list.useQuery(undefined, {
    enabled: !!session,
  });

  const createMutation = trpc.todo.create.useMutation({
    onSuccess: () => {
      setNewTodoTitle('');
      utils.todo.list.invalidate();
    },
  });

  const toggleMutation = trpc.todo.toggle.useMutation({
    onSuccess: () => {
      utils.todo.list.invalidate();
    },
  });

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    createMutation.mutate({ title: newTodoTitle });
  };

  const handleToggle = (id: string) => {
    toggleMutation.mutate({ id });
  };

  if (status === 'loading') {
    return (
      <div className="container" style={{ marginTop: '3rem' }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '3rem' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>TODO管理</h2>

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
              disabled={createMutation.isPending || !newTodoTitle.trim()}
            >
              {createMutation.isPending ? '追加中...' : '追加'}
            </button>
          </div>
        </form>

        {isLoading ? (
          <p className="text-muted">TODOを読み込んでいます...</p>
        ) : todos && todos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {todos.map((todo) => (
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
                  disabled={toggleMutation.isPending}
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
