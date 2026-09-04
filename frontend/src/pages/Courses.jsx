import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.getCourses();
        if (res.data.success) {
          setCourses(res.data.data);
        } else {
          setError(res.data.error.message);
        }
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, []);

  if (loading) return <div>Loading courses...</div>;
  if (error) return <div className="text-red-600 bg-red-50 p-4 rounded">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700">
          Add Course
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{course.name}</h3>
            <p className="text-gray-600">{course.description}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 text-blue-600 font-medium cursor-pointer">
              View Details &rarr;
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;
