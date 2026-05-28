-- Öğrenciler kendi deneme netlerini ekleyebilir, güncelleyebilir ve silebilir.
CREATE POLICY exam_student_insert ON public.exam_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY exam_student_update ON public.exam_results
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY exam_student_delete ON public.exam_results
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.user_id = auth.uid()
    )
  );
