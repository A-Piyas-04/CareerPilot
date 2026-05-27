export const mockCV = {
  resume_id: "mock-resume-uuid-001",
  user_id: "mock-user-uuid-001",
  raw_text: `
    John Doe - Software Engineer
    Skills: Python, React, FastAPI, PostgreSQL, Docker
    Experience: 1 year at StartupX as backend intern
    Projects: Built a REST API with FastAPI and PostgreSQL serving 10k requests/day
    Education: BSc Computer Science, 2024
  `,
  user_skills: ["Python", "React", "FastAPI", "PostgreSQL", "Docker"],
  resume_chunks: [
    {
      id: "00000000-0000-4000-8000-000000000001",
      chunk_text:
        "Built a REST API with FastAPI and PostgreSQL serving 10k requests/day",
      section_name: "projects",
    },
    {
      id: "00000000-0000-4000-8000-000000000002",
      chunk_text: "1 year experience as backend intern at StartupX",
      section_name: "experience",
    },
    {
      id: "00000000-0000-4000-8000-000000000003",
      chunk_text: "Skills: Python, React, FastAPI, PostgreSQL, Docker",
      section_name: "skills",
    },
  ],
};
