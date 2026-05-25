"""Evaluation test model - Hackathon evaluation suite."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class EvaluationTestBase(BaseModel):
    """Base evaluation test fields."""
    feature_name: str
    input_data: dict[str, Any]


class EvaluationTestCreate(EvaluationTestBase):
    """Evaluation test creation schema."""
    expected_output: Optional[str] = None
    notes: Optional[str] = None


class EvaluationTestUpdate(BaseModel):
    """Evaluation test update schema."""
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None
    passed: Optional[bool] = None
    notes: Optional[str] = None


class EvaluationTest(EvaluationTestBase):
    """Full evaluation test model."""
    id: str
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None
    passed: Optional[bool] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True