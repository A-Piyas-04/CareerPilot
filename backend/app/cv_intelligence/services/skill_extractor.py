"""CV skill extraction with provider-first and deterministic fallback."""
from __future__ import annotations

import logging
import re

from app.cv_intelligence.services.providers.analysis import get_analysis_provider

logger = logging.getLogger(__name__)

# Each entry: (canonical_skill_name, category, list_of_match_patterns)
# Patterns are matched case-insensitively as whole words / phrases.
_SKILL_DEFINITIONS: list[tuple[str, str, list[str]]] = [
    # --- Languages ---
    ("Python", "language", ["python"]),
    ("JavaScript", "language", ["javascript", "js"]),
    ("TypeScript", "language", ["typescript", "ts"]),
    ("HTML", "language", ["html", "html5"]),
    ("CSS", "language", ["css", "css3"]),
    ("SQL", "language", ["sql"]),
    ("Bash", "language", ["bash", "shell scripting"]),
    ("Go", "language", ["golang", r"\bgo\b"]),
    ("Rust", "language", ["rust"]),
    ("Java", "language", [r"\bjava\b"]),
    ("C++", "language", [r"c\+\+"]),
    ("Ruby", "language", ["ruby"]),
    # --- Frameworks / Libraries ---
    ("React", "framework", ["react", "reactjs", "react.js"]),
    ("Next.js", "framework", ["next.js", "nextjs"]),
    ("Node.js", "framework", ["node.js", "nodejs"]),
    ("FastAPI", "framework", ["fastapi"]),
    ("Django", "framework", ["django"]),
    ("Flask", "framework", ["flask"]),
    ("Express", "framework", ["express", "expressjs"]),
    ("Vue.js", "framework", ["vue", "vue.js", "vuejs"]),
    ("Angular", "framework", ["angular"]),
    ("Tailwind", "framework", ["tailwind", "tailwindcss"]),
    ("GraphQL", "framework", ["graphql"]),
    ("REST API", "framework", ["rest api", "restful", "rest"]),
    ("Pandas", "framework", ["pandas"]),
    ("NumPy", "framework", ["numpy"]),
    ("TensorFlow", "framework", ["tensorflow"]),
    ("PyTorch", "framework", ["pytorch"]),
    ("LangChain", "framework", ["langchain"]),
    # --- Databases ---
    ("PostgreSQL", "database", ["postgresql", "postgres"]),
    ("MySQL", "database", ["mysql"]),
    ("MongoDB", "database", ["mongodb", "mongo"]),
    ("Redis", "database", ["redis"]),
    ("Supabase", "database", ["supabase"]),
    ("SQLite", "database", ["sqlite"]),
    ("Elasticsearch", "database", ["elasticsearch"]),
    # --- DevOps / Tools ---
    ("Docker", "devops", ["docker"]),
    ("Kubernetes", "devops", ["kubernetes", "k8s"]),
    ("Git", "devops", [r"\bgit\b"]),
    ("GitHub", "devops", ["github"]),
    ("GitLab", "devops", ["gitlab"]),
    ("CI/CD", "devops", ["ci/cd", "cicd", "continuous integration", "continuous deployment"]),
    ("Linux", "devops", ["linux", "ubuntu", "debian"]),
    # --- Cloud ---
    ("AWS", "cloud", [r"\baws\b", "amazon web services"]),
    ("Vercel", "cloud", ["vercel"]),
    ("Railway", "cloud", ["railway"]),
    ("GCP", "cloud", ["gcp", "google cloud"]),
    ("Azure", "cloud", ["azure", "microsoft azure"]),
    # --- ML / AI ---
    ("Machine Learning", "ml/ai", ["machine learning", r"\bml\b"]),
    ("Deep Learning", "ml/ai", ["deep learning"]),
    ("NLP", "ml/ai", [r"\bnlp\b", "natural language processing"]),
    ("RAG", "ml/ai", [r"\brag\b", "retrieval.augmented generation"]),
    ("Data Analysis", "ml/ai", ["data analysis", "data analytics"]),
    ("Computer Vision", "ml/ai", ["computer vision"]),
]

# Pre-compile patterns for performance
_COMPILED: list[tuple[str, str, list[re.Pattern]]] = [
    (name, category, [re.compile(p, re.IGNORECASE) for p in patterns])
    for name, category, patterns in _SKILL_DEFINITIONS
]

_EVIDENCE_WINDOW = 120  # chars on each side of a match to use as evidence


def _extract_skills_deterministic(text: str) -> list[dict]:
    """
    Scan text for known skill keywords and return a deduplicated list of matches.

    Each result dict has keys:
        skill_name  (str)  — canonical name, e.g. "Python"
        category    (str)  — e.g. "language", "framework", "database"
        evidence    (str)  — surrounding context snippet
    """
    found: dict[str, dict] = {}  # skill_name → result (dedup by name)

    for skill_name, category, patterns in _COMPILED:
        if skill_name in found:
            continue

        for pattern in patterns:
            match = pattern.search(text)
            if match:
                start = max(0, match.start() - _EVIDENCE_WINDOW)
                end = min(len(text), match.end() + _EVIDENCE_WINDOW)
                evidence = text[start:end].strip().replace("\n", " ")
                found[skill_name] = {
                    "skill_name": skill_name,
                    "category": category,
                    "evidence": evidence,
                }
                break  # first pattern match is enough for this skill

    return list(found.values())


def extract_skills(text: str) -> list[dict]:
    """
    Extract skills via configured provider first, then fall back to deterministic
    regex extraction to keep ingestion resilient.
    """
    if not text.strip():
        return []

    try:
        provider = get_analysis_provider()
        skills = provider.extract_skills(text)
        if skills:
            return skills
    except Exception as exc:  # pragma: no cover - defensive fallback
        logger.warning("Analysis provider failed; using deterministic fallback: %s", exc)

    return _extract_skills_deterministic(text)
