"use client";

import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

import { useCreateManualResume, useUpdateManualResume } from "./hooks";
import type {
  ManualCertificationInput,
  ManualEducationInput,
  ManualExperienceInput,
  ManualLanguageInput,
  ManualProjectInput,
  ManualResumePayload,
  ManualSkillInput,
  ResumeDetail,
} from "./types";

type Props = {
  detail?: ResumeDetail;
  onSaveSuccess: (resumeId: string) => void;
};

const emptyPersonal = {
  full_name: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  linkedin: "",
  github: "",
};

const emptyExperience: ManualExperienceInput = {
  role: "",
  company: "",
  location: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
  highlights: [],
};

const emptyEducation: ManualEducationInput = {
  degree: "",
  institution: "",
  location: "",
  start_year: "",
  end_year: "",
  details: "",
};

const emptyProject: ManualProjectInput = {
  name: "",
  description: "",
  technologies: "",
  link: "",
  highlights: [],
};

const emptyCertification: ManualCertificationInput = {
  name: "",
  issuer: "",
  date: "",
  details: "",
};

const emptyLanguage: ManualLanguageInput = {
  name: "",
  proficiency: "",
};

export function ManualResumeEditor({ detail, onSaveSuccess }: Props) {
  const [payload, setPayload] = useState<ManualResumePayload>(() =>
    payloadFromDetail(detail),
  );
  const createMutation = useCreateManualResume();
  const updateMutation = useUpdateManualResume();
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const resumeId = detail?.resume.id;

  function setField<K extends keyof ManualResumePayload>(
    key: K,
    value: ManualResumePayload[K],
  ) {
    setPayload((current) => ({ ...current, [key]: value }));
  }

  function setPersonalField(
    key: keyof ManualResumePayload["personal"],
    value: string,
  ) {
    setPayload((current) => ({
      ...current,
      personal: { ...current.personal, [key]: value },
    }));
  }

  function handleSave() {
    const cleanPayload = normalizePayload(payload);

    if (resumeId) {
      updateMutation.mutate(
        { payload: cleanPayload, resumeId },
        { onSuccess: (resume) => onSaveSuccess(resume.id) },
      );
      return;
    }

    createMutation.mutate(cleanPayload, {
      onSuccess: (resume) => onSaveSuccess(resume.id),
    });
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">
            Manual CV Editor
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Build or refine your CV with structured fields. Saving regenerates
            sections, skills, and the search index.
          </p>
        </div>
        <button
          className="flex h-10 items-center gap-2 rounded-lg bg-[#1A56DB] px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          type="button"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save CV
        </button>
      </div>

      <div className="mt-5 space-y-6">
        <Field
          label="CV title"
          value={payload.title}
          onChange={(value) => setField("title", value)}
          placeholder="Manual CV"
        />

        <EditorBlock title="Personal details">
          <div className="grid gap-3 sm:grid-cols-2">
            {PERSONAL_FIELDS.map((field) => (
              <Field
                key={field.key}
                label={field.label}
                value={payload.personal[field.key]}
                onChange={(value) => setPersonalField(field.key, value)}
                placeholder={field.placeholder}
              />
            ))}
          </div>
        </EditorBlock>

        <EditorBlock title="Professional summary">
          <Textarea
            label="Summary"
            value={payload.summary}
            onChange={(value) => setField("summary", value)}
            placeholder="Short overview of your background, target role, and strengths."
            rows={4}
          />
        </EditorBlock>

        <SkillsEditor
          items={payload.skills}
          onChange={(items) => setField("skills", items)}
        />

        <ExperienceEditor
          items={payload.experience}
          onChange={(items) => setField("experience", items)}
        />

        <EducationEditor
          items={payload.education}
          onChange={(items) => setField("education", items)}
        />

        <ProjectEditor
          items={payload.projects}
          onChange={(items) => setField("projects", items)}
        />

        <CertificationEditor
          items={payload.certifications}
          onChange={(items) => setField("certifications", items)}
        />

        <LanguageEditor
          items={payload.languages}
          onChange={(items) => setField("languages", items)}
        />
      </div>
    </section>
  );
}

function SkillsEditor({
  items,
  onChange,
}: {
  items: ManualSkillInput[];
  onChange: (items: ManualSkillInput[]) => void;
}) {
  return (
    <EditorBlock
      title="Skills"
      actionLabel="Add skill"
      onAdd={() =>
        onChange([...items, { skill_name: "", category: "", proficiency: "" }])
      }
    >
      <div className="space-y-3">
        {items.map((item, index) => (
          <RepeatableRow
            key={index}
            onRemove={() => onChange(removeAt(items, index))}
          >
            <div className="grid flex-1 gap-3 sm:grid-cols-3">
              <Field
                label="Skill"
                value={item.skill_name}
                onChange={(value) =>
                  onChange(updateAt(items, index, { ...item, skill_name: value }))
                }
                placeholder="Python"
              />
              <Field
                label="Category"
                value={item.category ?? ""}
                onChange={(value) =>
                  onChange(updateAt(items, index, { ...item, category: value }))
                }
                placeholder="language"
              />
              <Field
                label="Proficiency"
                value={item.proficiency ?? ""}
                onChange={(value) =>
                  onChange(updateAt(items, index, { ...item, proficiency: value }))
                }
                placeholder="Intermediate"
              />
            </div>
          </RepeatableRow>
        ))}
      </div>
    </EditorBlock>
  );
}

function ExperienceEditor({
  items,
  onChange,
}: {
  items: ManualExperienceInput[];
  onChange: (items: ManualExperienceInput[]) => void;
}) {
  return (
    <EditorBlock
      title="Experience"
      actionLabel="Add experience"
      onAdd={() => onChange([...items, { ...emptyExperience }])}
    >
      <div className="space-y-4">
        {items.map((item, index) => (
          <RepeatableRow
            key={index}
            onRemove={() => onChange(removeAt(items, index))}
          >
            <div className="flex-1 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Role" value={item.role} onChange={(value) => onChange(updateAt(items, index, { ...item, role: value }))} placeholder="Backend Intern" />
                <Field label="Company" value={item.company} onChange={(value) => onChange(updateAt(items, index, { ...item, company: value }))} placeholder="StartupX" />
                <Field label="Location" value={item.location} onChange={(value) => onChange(updateAt(items, index, { ...item, location: value }))} placeholder="Dhaka" />
                <Field label="Start date" value={item.start_date} onChange={(value) => onChange(updateAt(items, index, { ...item, start_date: value }))} placeholder="Jan 2024" />
                <Field label="End date" value={item.end_date} onChange={(value) => onChange(updateAt(items, index, { ...item, end_date: value }))} placeholder="Present" disabled={item.is_current} />
                <label className="flex items-center gap-2 pt-6 text-sm font-medium text-zinc-700">
                  <input
                    checked={item.is_current}
                    className="h-4 w-4 rounded border-zinc-300"
                    type="checkbox"
                    onChange={(event) =>
                      onChange(
                        updateAt(items, index, {
                          ...item,
                          end_date: event.target.checked ? "" : item.end_date,
                          is_current: event.target.checked,
                        }),
                      )
                    }
                  />
                  Current role
                </label>
              </div>
              <Textarea label="Description" value={item.description} onChange={(value) => onChange(updateAt(items, index, { ...item, description: value }))} rows={3} />
              <Textarea label="Highlights, one per line" value={item.highlights.join("\n")} onChange={(value) => onChange(updateAt(items, index, { ...item, highlights: lines(value) }))} rows={3} />
            </div>
          </RepeatableRow>
        ))}
      </div>
    </EditorBlock>
  );
}

function EducationEditor({
  items,
  onChange,
}: {
  items: ManualEducationInput[];
  onChange: (items: ManualEducationInput[]) => void;
}) {
  return (
    <EditorBlock
      title="Education"
      actionLabel="Add education"
      onAdd={() => onChange([...items, { ...emptyEducation }])}
    >
      <div className="space-y-4">
        {items.map((item, index) => (
          <RepeatableRow key={index} onRemove={() => onChange(removeAt(items, index))}>
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <Field label="Degree" value={item.degree} onChange={(value) => onChange(updateAt(items, index, { ...item, degree: value }))} placeholder="BSc Computer Science" />
              <Field label="Institution" value={item.institution} onChange={(value) => onChange(updateAt(items, index, { ...item, institution: value }))} />
              <Field label="Location" value={item.location} onChange={(value) => onChange(updateAt(items, index, { ...item, location: value }))} />
              <Field label="Start year" value={item.start_year} onChange={(value) => onChange(updateAt(items, index, { ...item, start_year: value }))} />
              <Field label="End year" value={item.end_year} onChange={(value) => onChange(updateAt(items, index, { ...item, end_year: value }))} />
              <Field label="Details" value={item.details} onChange={(value) => onChange(updateAt(items, index, { ...item, details: value }))} />
            </div>
          </RepeatableRow>
        ))}
      </div>
    </EditorBlock>
  );
}

function ProjectEditor({
  items,
  onChange,
}: {
  items: ManualProjectInput[];
  onChange: (items: ManualProjectInput[]) => void;
}) {
  return (
    <EditorBlock
      title="Projects"
      actionLabel="Add project"
      onAdd={() => onChange([...items, { ...emptyProject }])}
    >
      <div className="space-y-4">
        {items.map((item, index) => (
          <RepeatableRow key={index} onRemove={() => onChange(removeAt(items, index))}>
            <div className="flex-1 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Project name" value={item.name} onChange={(value) => onChange(updateAt(items, index, { ...item, name: value }))} />
                <Field label="Technologies" value={item.technologies} onChange={(value) => onChange(updateAt(items, index, { ...item, technologies: value }))} placeholder="FastAPI, PostgreSQL" />
                <Field label="Link" value={item.link} onChange={(value) => onChange(updateAt(items, index, { ...item, link: value }))} />
              </div>
              <Textarea label="Description" value={item.description} onChange={(value) => onChange(updateAt(items, index, { ...item, description: value }))} rows={3} />
              <Textarea label="Highlights, one per line" value={item.highlights.join("\n")} onChange={(value) => onChange(updateAt(items, index, { ...item, highlights: lines(value) }))} rows={3} />
            </div>
          </RepeatableRow>
        ))}
      </div>
    </EditorBlock>
  );
}

function CertificationEditor({
  items,
  onChange,
}: {
  items: ManualCertificationInput[];
  onChange: (items: ManualCertificationInput[]) => void;
}) {
  return (
    <EditorBlock
      title="Certifications"
      actionLabel="Add certification"
      onAdd={() => onChange([...items, { ...emptyCertification }])}
    >
      <div className="space-y-3">
        {items.map((item, index) => (
          <RepeatableRow key={index} onRemove={() => onChange(removeAt(items, index))}>
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <Field label="Name" value={item.name} onChange={(value) => onChange(updateAt(items, index, { ...item, name: value }))} />
              <Field label="Issuer" value={item.issuer} onChange={(value) => onChange(updateAt(items, index, { ...item, issuer: value }))} />
              <Field label="Date" value={item.date} onChange={(value) => onChange(updateAt(items, index, { ...item, date: value }))} />
              <Field label="Details" value={item.details} onChange={(value) => onChange(updateAt(items, index, { ...item, details: value }))} />
            </div>
          </RepeatableRow>
        ))}
      </div>
    </EditorBlock>
  );
}

function LanguageEditor({
  items,
  onChange,
}: {
  items: ManualLanguageInput[];
  onChange: (items: ManualLanguageInput[]) => void;
}) {
  return (
    <EditorBlock
      title="Languages"
      actionLabel="Add language"
      onAdd={() => onChange([...items, { ...emptyLanguage }])}
    >
      <div className="space-y-3">
        {items.map((item, index) => (
          <RepeatableRow key={index} onRemove={() => onChange(removeAt(items, index))}>
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <Field label="Language" value={item.name} onChange={(value) => onChange(updateAt(items, index, { ...item, name: value }))} placeholder="English" />
              <Field label="Proficiency" value={item.proficiency} onChange={(value) => onChange(updateAt(items, index, { ...item, proficiency: value }))} placeholder="Fluent" />
            </div>
          </RepeatableRow>
        ))}
      </div>
    </EditorBlock>
  );
}

function EditorBlock({
  actionLabel,
  children,
  onAdd,
  title,
}: {
  actionLabel?: string;
  children: React.ReactNode;
  onAdd?: () => void;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
        {actionLabel && onAdd ? (
          <button
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
            type="button"
            onClick={onAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function RepeatableRow({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-white p-3">
      {children}
      <button
        className="mt-6 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
        type="button"
        onClick={onRemove}
        aria-label="Remove row"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function Field({
  disabled,
  label,
  onChange,
  placeholder,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block text-xs font-semibold text-zinc-600">
      {label}
      <input
        className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 outline-none transition focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100 disabled:bg-zinc-100"
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Textarea({
  label,
  onChange,
  placeholder,
  rows = 3,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value: string;
}) {
  return (
    <label className="block text-xs font-semibold text-zinc-600">
      {label}
      <textarea
        className="mt-1 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium leading-6 text-zinc-950 outline-none transition focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

const PERSONAL_FIELDS: Array<{
  key: keyof ManualResumePayload["personal"];
  label: string;
  placeholder?: string;
}> = [
  { key: "full_name", label: "Full name", placeholder: "John Doe" },
  { key: "email", label: "Email", placeholder: "john@example.com" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
  { key: "website", label: "Website" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "github", label: "GitHub" },
];

function payloadFromDetail(detail?: ResumeDetail): ManualResumePayload {
  if (!detail) {
    return blankPayload();
  }

  const section = (name: string) =>
    detail.sections.find((item) => item.section_name === name);
  const formData = <T,>(name: string): T | undefined => {
    const metadata = section(name)?.metadata;
    const value = metadata?.form_data;
    return value === undefined ? undefined : (value as T);
  };

  return {
    title: detail.resume.file_name || "Manual CV",
    personal: formData("personal") ?? emptyPersonal,
    summary:
      formData<{ summary: string }>("summary")?.summary ??
      section("summary")?.content ??
      "",
    skills:
      formData<ManualSkillInput[]>("skills") ??
      detail.skills.map((skill) => ({
        category: skill.category ?? "",
        proficiency: skill.proficiency ?? "",
        skill_name: skill.skill_name,
      })),
    experience:
      formData<ManualExperienceInput[]>("experience") ??
      sectionFallback(section("experience")?.content, emptyExperience, "description"),
    education:
      formData<ManualEducationInput[]>("education") ??
      sectionFallback(section("education")?.content, emptyEducation, "details"),
    projects:
      formData<ManualProjectInput[]>("projects") ??
      sectionFallback(section("projects")?.content, emptyProject, "description"),
    certifications:
      formData<ManualCertificationInput[]>("certifications") ??
      sectionFallback(
        section("certifications")?.content,
        emptyCertification,
        "details",
      ),
    languages:
      formData<ManualLanguageInput[]>("languages") ??
      section("languages")?.content
        ?.split("\n")
        .map((name) => ({ name: name.trim(), proficiency: "" }))
        .filter((item) => item.name) ??
      [],
  };
}

function blankPayload(): ManualResumePayload {
  return {
    title: "Manual CV",
    personal: { ...emptyPersonal },
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
  };
}

function sectionFallback<T extends Record<string, unknown>>(
  content: string | undefined,
  emptyItem: T,
  targetKey: keyof T,
) {
  if (!content?.trim()) {
    return [];
  }
  return [{ ...emptyItem, [targetKey]: content.trim() }] as T[];
}

function normalizePayload(payload: ManualResumePayload): ManualResumePayload {
  return {
    ...payload,
    title: payload.title.trim() || "Manual CV",
    skills: payload.skills.filter((skill) => skill.skill_name.trim()),
    experience: payload.experience.filter((item) => hasAnyValue(item)),
    education: payload.education.filter((item) => hasAnyValue(item)),
    projects: payload.projects.filter((item) => hasAnyValue(item)),
    certifications: payload.certifications.filter((item) => hasAnyValue(item)),
    languages: payload.languages.filter((item) => hasAnyValue(item)),
  };
}

function hasAnyValue(value: Record<string, unknown>) {
  return Object.values(value).some((item) => {
    if (Array.isArray(item)) {
      return item.some((entry) => String(entry).trim());
    }
    if (typeof item === "boolean") {
      return item;
    }
    return String(item ?? "").trim();
  });
}

function updateAt<T>(items: T[], index: number, value: T) {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item));
}

function removeAt<T>(items: T[], index: number) {
  return items.filter((_item, itemIndex) => itemIndex !== index);
}

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
