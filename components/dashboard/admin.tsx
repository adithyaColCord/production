import React from "react";

interface AdminDashboardProps {
  data: {
    totalStudents: number;
    totalCourses: number;
    totalTeachers: number;
  };
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 bg-white shadow rounded">
          <h3 className="text-lg font-semibold">Total Students</h3>
          <p className="text-2xl">{data.totalStudents}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h3 className="text-lg font-semibold">Total Courses</h3>
          <p className="text-2xl">{data.totalCourses}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h3 className="text-lg font-semibold">Total Teachers</h3>
          <p className="text-2xl">{data.totalTeachers}</p>
        </div>
      </div>
    </div>
  );
}