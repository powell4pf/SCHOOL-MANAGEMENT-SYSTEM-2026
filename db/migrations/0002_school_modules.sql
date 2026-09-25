BEGIN;

CREATE TABLE IF NOT EXISTS school_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind varchar(16) NOT NULL CHECK (kind IN ('teacher', 'staff')),
  employee_number varchar(32) NOT NULL,
  first_name varchar(80) NOT NULL,
  last_name varchar(80) NOT NULL,
  email varchar(254) NOT NULL,
  phone varchar(32),
  department varchar(80) NOT NULL,
  job_title varchar(80) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
  created_by uuid NOT NULL REFERENCES "user" (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS school_people_employee_number_ci_uq
  ON school_people (lower(employee_number));
CREATE UNIQUE INDEX IF NOT EXISTS school_people_email_ci_uq
  ON school_people (lower(email));
CREATE INDEX IF NOT EXISTS school_people_kind_status_name_idx
  ON school_people (kind, status, lower(last_name), lower(first_name));

CREATE TABLE IF NOT EXISTS school_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind varchar(16) NOT NULL CHECK (kind IN ('schedule', 'exam', 'notice')),
  title varchar(140) NOT NULL,
  description varchar(2000) NOT NULL DEFAULT '',
  starts_at timestamptz,
  ends_at timestamptz,
  location varchar(120) NOT NULL DEFAULT '',
  audience varchar(80) NOT NULL DEFAULT 'Whole school',
  status varchar(16) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'published', 'draft', 'cancelled')),
  created_by uuid NOT NULL REFERENCES "user" (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR starts_at IS NOT NULL AND ends_at >= starts_at),
  CHECK (kind = 'notice' OR starts_at IS NOT NULL),
  CHECK (kind <> 'notice' OR status IN ('published', 'draft')),
  CHECK (kind = 'notice' OR status IN ('scheduled', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS school_items_kind_status_start_idx
  ON school_items (kind, status, starts_at);
CREATE INDEX IF NOT EXISTS school_items_created_idx
  ON school_items (created_at DESC);

COMMIT;
