"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

import { SpinnerButton } from "@/components/ui";

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

type EditorSectionKey =
  | "personal"
  | "skills"
  | "experience"
  | "education"
  | "projects"
  | "extras";

const EDITOR_SECTIONS: Array<{ key: EditorSectionKey; label: string }> = [
  { key: "personal", label: "Personal" },
  { key: "skills", label: "Skills & Tools" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "projects", label: "Projects" },
  { key: "extras", label: "Extras" },
];

const SKILL_CATEGORIES = [
  "language",
  "framework",
  "database",
  "tool",
  "cloud",
  "devops",
  "ml/ai",
  "other",
] as const;

const SKILL_CATEGORY_STYLES: Record<string, string> = {
  cloud: "border-sky-100 bg-sky-50 text-sky-800",
  database: "border-orange-100 bg-orange-50 text-orange-800",
  devops: "border-slate-200 bg-slate-50 text-slate-700",
  framework: "border-violet-100 bg-violet-50 text-violet-800",
  language: "border-blue-100 bg-blue-50 text-blue-800",
  "ml/ai": "border-pink-100 bg-pink-50 text-pink-800",
  other: "border-zinc-200 bg-zinc-50 text-zinc-700",
  tool: "border-cyan-100 bg-cyan-50 text-cyan-800",
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
  const [activeSection, setActiveSection] = useState<EditorSectionKey>("personal");

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
        <SpinnerButton
          type="button"
          loading={isSaving}
          loadingLabel="Saving..."
          onClick={handleSave}
          icon={<Save className="h-4 w-4" />}
          className="rounded-lg"
        >
          Save CV
        </SpinnerButton>
      </div>

      <div className="mt-5 space-y-5">
        <Field
          label="CV title"
          value={payload.title}
          onChange={(value) => setField("title", value)}
          placeholder="Manual CV"
        />

        <div
          className="flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-1"
          role="tablist"
          aria-label="Manual CV sections"
        >
          {EDITOR_SECTIONS.map((section) => (
            <button
              key={section.key}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition ${
                activeSection === section.key
                  ? "bg-white text-[#1A56DB] shadow-sm"
                  : "text-zinc-500 hover:bg-white/70 hover:text-zinc-900"
              }`}
              type="button"
              role="tab"
              aria-selected={activeSection === section.key}
              onClick={() => setActiveSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </div>

        {activeSection === "personal" && (
          <div className="space-y-4">
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
          </div>
        )}

        {activeSection === "skills" && (
          <div className="space-y-4">
            <SkillsEditor
              items={payload.skills}
              onChange={(items) => setField("skills", items)}
            />
            <ToolsEditor
              items={payload.tools}
              onChange={(items) => setField("tools", items)}
            />
          </div>
        )}

        {activeSection === "experience" && (
          <ExperienceEditor
            items={payload.experience}
            onChange={(items) => setField("experience", items)}
          />
        )}

        {activeSection === "education" && (
          <EducationEditor
            items={payload.education}
            onChange={(items) => setField("education", items)}
          />
        )}

        {activeSection === "projects" && (
          <ProjectEditor
            items={payload.projects}
            onChange={(items) => setField("projects", items)}
          />
        )}

        {activeSection === "extras" && (
          <div className="space-y-4">
            <CertificationEditor
              items={payload.certifications}
              onChange={(items) => setField("certifications", items)}
            />
            <LanguageEditor
              items={payload.languages}
              onChange={(items) => setField("languages", items)}
            />
          </div>
        )}
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
        <SkillPreviewStrip items={items} />
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
              <SelectField
                label="Category"
                value={item.category ?? ""}
                onChange={(value) =>
                  onChange(updateAt(items, index, { ...item, category: value }))
                }
                options={SKILL_CATEGORIES.map((category) => ({
                  label: category,
                  value: category,
                }))}
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

function ToolsEditor({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [toolName, setToolName] = useState("");

  function addTool() {
    const value = toolName.trim();
    if (!value) return;
    const exists = items.some((item) => item.toLowerCase() === value.toLowerCase());
    if (!exists) {
      onChange([...items, value]);
    }
    setToolName("");
  }

  return (
    <EditorBlock title="Tools & technologies">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="h-10 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 outline-none transition focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
          placeholder="Docker, GitHub, VS Code"
          value={toolName}
          onChange={(event) => setToolName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTool();
            }
          }}
        />
        <button
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
          type="button"
          onClick={addTool}
        >
          <Plus className="h-4 w-4" />
          Add tool
        </button>
      </div>
      {items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${skillCategoryClass("tool")}`}
            >
              {item}
              <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                tool
              </span>
              <button
                className="text-cyan-600 transition hover:text-red-600"
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => onChange(items.filter((value) => value !== item))}
              >
                x
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs font-medium text-zinc-500">
          Add tools separately so CareerPilot can search and match them later.
        </p>
      )}
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
        <ItemPreviewGrid
          emptyText="Add roles to see a quick experience summary here."
          items={items}
          getTitle={(item) => item.role || "Untitled role"}
          getSubtitle={(item) => item.company}
          getMeta={(item) =>
            [item.start_date, item.is_current ? "Present" : item.end_date]
              .filter(Boolean)
              .join(" - ")
          }
        />
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
        <ItemPreviewGrid
          emptyText="Add education entries to build this section."
          items={items}
          getTitle={(item) => item.degree || "Untitled education"}
          getSubtitle={(item) => item.institution}
          getMeta={(item) => [item.start_year, item.end_year].filter(Boolean).join(" - ")}
        />
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
        <ItemPreviewGrid
          emptyText="Add projects to show your strongest proof of work."
          items={items}
          getTitle={(item) => item.name || "Untitled project"}
          getSubtitle={(item) => item.technologies}
          getMeta={(item) =>
            item.highlights.length > 0
              ? `${item.highlights.length} highlights`
              : item.link
          }
        />
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
        <ItemPreviewGrid
          emptyText="Add certifications if they strengthen your target role."
          items={items}
          getTitle={(item) => item.name || "Untitled certification"}
          getSubtitle={(item) => item.issuer}
          getMeta={(item) => item.date}
        />
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
        <ItemPreviewGrid
          emptyText="Add languages and proficiency levels."
          items={items}
          getTitle={(item) => item.name || "Untitled language"}
          getSubtitle={(item) => item.proficiency}
        />
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

function SkillPreviewStrip({ items }: { items: ManualSkillInput[] }) {
  const visible = items.filter((item) => item.skill_name.trim());

  if (visible.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-500">
        Add skills with categories so matching and CV search stay explainable.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-white p-3">
      {visible.map((item, index) => (
        <span
          key={`${item.skill_name}-${index}`}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${skillCategoryClass(item.category)}`}
        >
          {item.skill_name}
          <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
            {normalizeSkillCategory(item.category)}
          </span>
          {item.proficiency ? (
            <span className="text-[10px] font-medium opacity-80">
              {item.proficiency}
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

function ItemPreviewGrid<T extends object>({
  emptyText,
  getMeta,
  getSubtitle,
  getTitle,
  items,
}: {
  emptyText: string;
  getMeta?: (item: T) => string;
  getSubtitle?: (item: T) => string;
  getTitle: (item: T) => string;
  items: T[];
}) {
  const visible = items.filter((item) => hasAnyValue(item as Record<string, unknown>));

  if (visible.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-500">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {visible.map((item, index) => {
        const subtitle = getSubtitle?.(item);
        const meta = getMeta?.(item);

        return (
          <div
            key={index}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2"
          >
            <p className="truncate text-sm font-semibold text-zinc-900">
              {getTitle(item)}
            </p>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">
                {subtitle}
              </p>
            ) : null}
            {meta ? (
              <p className="mt-1 text-xs text-zinc-400">{meta}</p>
            ) : null}
          </div>
        );
      })}
    </div>
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
      detail.skills
        .filter((skill) => skill.category !== "tool")
        .map((skill) => ({
          category: skill.category ?? "",
          proficiency: skill.proficiency ?? "",
          skill_name: skill.skill_name,
        })),
    tools:
      formData<string[]>("tools") ??
      toolsFromDetail(detail, section("tools")?.content),
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
    tools: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
  };
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="block text-xs font-semibold text-zinc-600">
      {label}
      <select
        className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 outline-none transition focus:border-[#1A56DB] focus:ring-2 focus:ring-blue-100"
        value={normalizeSkillCategory(value)}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function toolsFromDetail(detail: ResumeDetail, toolsContent?: string): string[] {
  const toolSkills = detail.skills
    .filter((skill) => skill.category === "tool")
    .map((skill) => skill.skill_name)
    .filter(Boolean);

  if (toolSkills.length > 0) {
    return uniqueStrings(toolSkills);
  }

  return uniqueStrings(
    toolsContent
      ?.split(/,|\n/)
      .map((item) => item.trim())
      .filter(Boolean) ?? [],
  );
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
    skills: payload.skills
      .filter((skill) => skill.skill_name.trim())
      .map((skill) => ({
        ...skill,
        category: normalizeSkillCategory(skill.category),
      })),
    tools: uniqueStrings(payload.tools),
    experience: payload.experience.filter((item) => hasAnyValue(item)),
    education: payload.education.filter((item) => hasAnyValue(item)),
    projects: payload.projects.filter((item) => hasAnyValue(item)),
    certifications: payload.certifications.filter((item) => hasAnyValue(item)),
    languages: payload.languages.filter((item) => hasAnyValue(item)),
  };
}

function normalizeSkillCategory(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() || "other";
  return SKILL_CATEGORIES.includes(normalized as (typeof SKILL_CATEGORIES)[number])
    ? normalized
    : "other";
}

function skillCategoryClass(value: string | null | undefined) {
  return SKILL_CATEGORY_STYLES[normalizeSkillCategory(value)] ?? SKILL_CATEGORY_STYLES.other;
}

function uniqueStrings(items: string[]) {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const item of items) {
    const value = item.trim();
    const key = value.toLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      values.push(value);
    }
  }
  return values;
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
