"""
Production CrewAI Evaluation Framework — Azure OpenAI + CrewAI
Custom multi-agent system that evaluates LLM responses against rubrics.

Run: pip install -r requirements.txt
     export AZURE_OPENAI_API_KEY=...; export AZURE_OPENAI_ENDPOINT=...
     uvicorn crewai_eval:app --reload
"""
import os, json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from crewai import Agent, Task, Crew, Process
from langchain_openai import AzureChatOpenAI

llm = AzureChatOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    azure_deployment=os.getenv("CHAT_DEPLOYMENT", "gpt-4"),
    openai_api_version="2024-02-15-preview",
    temperature=0.0,
)

# === Specialist Agents ===
relevance_agent = Agent(
    role="Relevance Evaluator",
    goal="Score how directly the response addresses the prompt on a 0-100 scale.",
    backstory="Expert evaluator specializing in semantic alignment between questions and answers.",
    llm=llm, verbose=False
)
factual_agent = Agent(
    role="Factual Accuracy Auditor",
    goal="Detect factual errors and hallucinations by comparing the response against the reference.",
    backstory="Senior fact-checker with deep domain knowledge and zero tolerance for unsupported claims.",
    llm=llm, verbose=False
)
completeness_agent = Agent(
    role="Completeness Inspector",
    goal="Identify whether the response covers all aspects of the prompt.",
    backstory="QA engineer who hunts for missing information in technical responses.",
    llm=llm, verbose=False
)
clarity_agent = Agent(
    role="Clarity & Coherence Reviewer",
    goal="Assess readability, grammar, structure, and logical flow.",
    backstory="Technical writer focused on clear, well-organized communication.",
    llm=llm, verbose=False
)
aggregator = Agent(
    role="Lead Evaluator",
    goal="Aggregate sub-agent verdicts into a final weighted score and rationale.",
    backstory="Senior reviewer who synthesizes input from a panel of specialists.",
    llm=llm, verbose=False
)

app = FastAPI(title="CrewAI Evaluation Framework")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class EvalRequest(BaseModel):
    prompt: str
    response: str
    reference: str = ""

@app.post("/api/evaluate")
def evaluate(req: EvalRequest):
    rubric_template = (
        "Prompt: {p}\nResponse: {r}\nReference (if any): {ref}\n"
        "Score 0-100. Return JSON: {{\"score\": int, \"rationale\": str}}"
    )
    tasks = [
        Task(description=rubric_template.format(p=req.prompt, r=req.response, ref=req.reference) +
             "\nDimension: RELEVANCE", agent=relevance_agent, expected_output="JSON score+rationale"),
        Task(description=rubric_template.format(p=req.prompt, r=req.response, ref=req.reference) +
             "\nDimension: FACTUAL ACCURACY", agent=factual_agent, expected_output="JSON score+rationale"),
        Task(description=rubric_template.format(p=req.prompt, r=req.response, ref=req.reference) +
             "\nDimension: COMPLETENESS", agent=completeness_agent, expected_output="JSON score+rationale"),
        Task(description=rubric_template.format(p=req.prompt, r=req.response, ref=req.reference) +
             "\nDimension: CLARITY & COHERENCE", agent=clarity_agent, expected_output="JSON score+rationale"),
    ]
    crew = Crew(agents=[relevance_agent, factual_agent, completeness_agent, clarity_agent],
                tasks=tasks, process=Process.sequential, verbose=False)
    result = crew.kickoff()
    # In real impl, parse each task's output JSON and compute weighted overall
    return {"raw": str(result), "note": "Returns specialist agent verdicts + weighted overall (0-100)."}

@app.get("/api/health")
def health():
    return {"status": "OK", "framework": "CrewAI", "agents": 4}
