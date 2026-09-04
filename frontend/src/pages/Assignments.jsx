import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await api.getAssignments();
        if (res.data.success) {
          // Flatten course name for the table
          const formatted = res.data.data.map(a => ({
            ...a,
            course: a.course?.name || 'Unknown Course'
          }));
          setAssignments(formatted);
        } else {
          setError(res.data.error.message);
        }
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to fetch assignments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignments();
  }, []);

  if (loading) return <div>Loading assignments...</div>;
  if (error) return <div className="text-red-600 bg-red-50 p-4 rounded">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700">
          New Assignment
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assignments.map(assignment => (
              <tr key={assignment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{assignment.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{assignment.course}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{assignment.deadline}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    assignment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {assignment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Assignments;
