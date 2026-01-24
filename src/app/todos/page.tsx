import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { listTodos } from '../../actions/todo';
import { TodosClient } from './TodosClient';

export default async function TodosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login?callbackUrl=/todos');
  }

  const result = await listTodos();

  if (!result.success) {
    return (
      <div className="container" style={{ marginTop: '3rem' }}>
        <p className="alert-danger">エラー: {result.error}</p>
      </div>
    );
  }

  return <TodosClient initialTodos={result.todos || []} />;
}

