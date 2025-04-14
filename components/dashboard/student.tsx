import React from "react";

interface StudentDashboardProps {
  data: {
    enrolledCourses: number;
    clubs: number;
    studyHours: number;
    achievements: number;
    recentGrades: Array<{
      id: string;
      grade: number | null;
      exam: {
        title: string;
        course: { name: string };
      };
    }>;
    upcomingDeadlines: Array<{
      id: string;
      title: string;
      dueDate: string;
      course: { name: string };
    }>;
  };
}

export function StudentDashboard({ data }: StudentDashboardProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Student Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 bg-white shadow rounded">
          <h3 className="text-lg font-semibold">Enrolled Courses</h3>
          <p className="text-2xl">{data.enrolledCourses}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h3 className="text-lg font-semibold">Clubs</h3>
          <p className="text-2xl">{data.clubs}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h3 className="text-lg font-semibold">Study Hours</h3>
          <p className="text-2xl">{data.studyHours}</p>
        </div>
        <div className="p-4 bg-white shadow rounded">
          <h3 className="text-lg font-semibold">Achievements</h3>
          <p className="text-2xl">{data.achievements}</p>
        </div>
      </div>
    </div>
  );
}