import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "src/apis/courses.api";

const KEY = ["courses"] as const;

export const useCourses = () => useQuery({ queryKey: KEY, queryFn: api.listCourses });
export const useCourse = (id: string) => useQuery({ queryKey: [...KEY, id], queryFn: () => api.getCourse(id) });

/** Mọi thay đổi làm mới danh sách và các bản chi tiết đang cache. */
function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useCreateCourse() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: api.createCourse, onSuccess: invalidate });
}

export function useUpdateCourse() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CourseInput }) => api.updateCourse(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteCourse() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: api.deleteCourse, onSuccess: invalidate });
}
