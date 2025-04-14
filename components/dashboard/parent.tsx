import React from "react";

interface ParentDashboardProps {
  data: {
    children: Array<{
      id: string;
      student: {
        firstName: string;
        lastName: string;
        studentCourses: Array<{ id: string; course: { name: string; code: string } }>;
        studentExams: Array<{ id: string; grade: number | null; exam: { title: string; course: { name: string } } }>;
        attendanceRecords: Array<{ id: string; status: string }>;
      };
    }>;
  };
}

export function ParentDashboard({ data }: ParentDashboardProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Parent Dashboard</h2>
      {data.children.map((child) => (
        <div key={child.id} className="p-4 bg-white shadow rounded">
          <h3 className="text-lg font-semibold">
            {child.student.firstName} {child.student.lastName}
          </h3>
          <p>Courses: {child.student.studentCourses.length}</p>
          <p>Exams: {child.student.studentExams.length}</p>
          <p>Attendance Records: {child.student.attendanceRecords.length}</p>
        </div>
      ))}
    </div>
  );
}