ALTER TABLE "Course"
ADD COLUMN "courseTypes" "CourseType"[] NOT NULL DEFAULT ARRAY[]::"CourseType"[];

UPDATE "Course"
SET "courseTypes" = ARRAY["courseType"]::"CourseType"[];

-- Hide only untouched demo entries created by the previous built-in course seed.
UPDATE "Course"
SET "status" = 'ARCHIVED'
WHERE ("slug", "title") IN (
  ('mechanics', 'ميكانيك السيارات'),
  ('electrical', 'كهرباء السيارات'),
  ('diagnostics', 'تشخيص أعطال السيارات'),
  ('hybrid', 'أنظمة الهايبرد')
)
AND "updatedAt" = "createdAt";
