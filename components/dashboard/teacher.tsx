import React from "react";

interface TeacherDashboardProps {
  data: {
    teachingCourses: number;
    totalStudents: number;
    upcomingClasses: Array<{
      id: string;
      sessionDate: string;
      startTime: string;
      course: { name: string };
    }>;
    pendingAssignments: number;
  };
}

export function TeacherDashboard({ data }: TeacherDashboardProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Teacher Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 bg-white shadow rounded">
          <h3 className="text-lg font-semibold">Teaching Courses</h3>
          <p className="text-2xl">{data.teachingCourses}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h3 className="text-lg font-semibold">Total Students</h3>
          <p className="text-2xl">{data.totalStudents}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h3 className="text-lg font-semibold">Pending Assignments</h3>
          <p className="text-2xl">{data.pendingAssignments}</p>
        </div>
      </div>
    </div>
  );
}