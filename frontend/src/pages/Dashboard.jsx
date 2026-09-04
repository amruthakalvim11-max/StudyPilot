import React, { useState, useEffect, useContext } from 'react';
import { BookOpen, ClipboardList, CheckSquare, Clock } from 'lucide-react';
import * as api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const StatsCard = ({ title, value, icon, colorClass }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-md ${colorClass} text-white`}>
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-3xl font-semibold text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.default.get(`/dashboard?userId=${user?.id}`);
        if (res.data.success) {
          setData(res.data.data);
        } else {
          setError(res.data.error.message);
        }
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.id) fetchDashboardData();
  }, [user]);

  if (loading) return <div className="flex justify-center items-center h-full">Loading dashboard...</div>;
  if (error) return <div className="text-red-600 bg-red-50 p-4 rounded">{error}</div>;
  if (!data) return <div>No data available.</div>;

  const { stats, upcomingDeadlines } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Dashboard Overview
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Courses" 
          value={stats.totalCourses} 
          icon={<BookOpen size={24} />} 
          colorClass="bg-blue-500" 
        />
        <StatsCard 
          title="Total Assignments" 
          value={stats.totalAssignments} 
          icon={<ClipboardList size={24} />} 
          colorClass="bg-indigo-500" 
        />
        <StatsCard 
          title="Pending Tasks" 
          value={stats.totalPendingTasks} 
          icon={<Clock size={24} />} 
          colorClass="bg-yellow-500" 
        />
        <StatsCard 
          title="Completed Tasks" 
          value={stats.taskCounts.COMPLETED || 0} 
          icon={<CheckSquare size={24} />} 
          colorClass="bg-green-500" 
        />
      </div>

      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upcoming Deadlines</h3>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {upcomingDeadlines.length === 0 ? (
              <li className="px-4 py-4 sm:px-6 text-gray-500">No upcoming deadlines.</li>
            ) : upcomingDeadlines.map((task) => (
              <li key={task.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-600 truncate">
                      Task: {task.title}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {task.assignment?.title ? `Assignment: ${task.assignment.title}` : 'Standalone Task'}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
