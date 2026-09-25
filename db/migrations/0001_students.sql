BEGIN;

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number varchar(32) NOT NULL,
  first_name varchar(80) NOT NULL,
  last_name varchar(80) NOT NULL,
  grade varchar(24) NOT NULL CHECK (grade ~ '^Grade ([1-9]|1[0-2])$'),
  class_name varchar(24) NOT NULL CHECK (class_name ~ '^[A-Za-z0-9-]{1,24}$'),
  gender varchar(24) NOT NULL DEFAULT 'not_specified'
    CHECK (gender IN ('Female', 'Male', 'Prefer not to say', 'not_specified')),
  date_of_birth date,
  guardian_name varchar(120) NOT NULL,
  guardian_phone varchar(32) NOT NULL,
  student_email varchar(254),
  enrolled_on date NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'on_leave')),
  created_by uuid NOT NULL REFERENCES "user" (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS students_admission_number_ci_uq
  ON students (lower(admission_number));

CREATE UNIQUE INDEX IF NOT EXISTS students_email_ci_uq
  ON students (lower(student_email)) WHERE student_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS students_grade_status_idx
  ON students (grade, status);

CREATE INDEX IF NOT EXISTS students_name_idx
  ON students (lower(last_name), lower(first_name));

COMMIT;
