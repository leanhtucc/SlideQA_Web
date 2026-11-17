import { request } from "src/apis/client";

export const listCourses = () => request<Course[]>("GET", "/courses");
export const getCourse = (id: string) => request<Course>("GET", `/courses/${id}`);

/** Chuỗi rỗng được backend coi là "không có giá trị". */
const body = (c: CourseInput) => ({
  name: c.name.trim(),
  code: c.code.trim(),
  term: c.term.trim(),
  examDate: c.examDate || null,
});

export const createCourse = (c: CourseInput) => request<Course>("POST", "/courses", { body: body(c) });
export const updateCourse = (id: string, c: CourseInput) => request<Course>("PATCH", `/courses/${id}`, { body: body(c) });
export const deleteCourse = (id: string) => request<null>("DELETE", `/courses/${id}`);
