import React, { useState, useEffect, useContext } from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import * as api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.getTasks({ userId: user?.id, sortBy: 'dueDate', order: 'asc' });
        if (res.data.success) {
          setTasks(res.data.data);
        } else {
          setError(res.data.error.message);
        }
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.id) fetchTasks();
  }, [user]);

  const toggleTaskStatus = async (id) => {
    const task = tasks.find(t => t.id === id);
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'; // Note: Our DB uses TODO, not PENDING. Let's fix that.
    const updatedStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    
    // Optimistic update
    setTasks(tasks.map(t => t.id === id ? { ...t, status: updatedStatus } : t));

    try {
      await api.updateTask(id, { status: updatedStatus });
    } catch (err) {
      // Revert on failure
      setTasks(tasks.map(t => t.id === id ? { ...t, status: task.status } : t));
      alert('Failed to update task');
    }
  };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div className="text-red-600 bg-red-50 p-4 rounded">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700">
          Create Task
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <ul className="space-y-4">
          {tasks.map(task => (
            <li key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-300 transition">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => toggleTaskStatus(task.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.status === 'COMPLETED' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-400 text-transparent hover:border-green-500'
                  }`}
                >
                  <Check size={14} />
                </button>
                <span className={`font-medium ${task.status === 'COMPLETED' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {task.title}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded font-medium flex items-center space-x-1 ${
                  task.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 
                  task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  <AlertCircle size={12} />
                  <span>{task.priority}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Tasks;
