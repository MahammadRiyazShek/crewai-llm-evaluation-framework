# 🤖 CrewAI Evaluation Framework

Custom CrewAI multi-agent system + automated evaluation pipeline that assesses LLM response quality against rubrics — replacing manual human evaluation with a scalable automated system and achieving **79% accuracy** in model assessment.

![CrewAI](https://img.shields.io/badge/CrewAI-multi--agent-purple) ![Azure OpenAI](https://img.shields.io/badge/Azure-OpenAI-0078D4) ![LangChain](https://img.shields.io/badge/LangChain-0.1-orange)

## 🚀 Live Demo
Deploy the static frontend to **GitHub Pages**, or run the FastAPI backend for full CrewAI evaluation.

## ✨ Features
- 🤖 **4 specialist CrewAI agents** — Relevance, Factual Accuracy, Completeness, Clarity & Coherence
- 📋 **6-dimension rubric** with weighted scoring
- 📊 Interactive dashboard with per-dimension breakdown
- 🎯 **79% agreement** with human evaluators
- ⚡ **10× faster** than manual review
- 📝 Detailed agent verdicts for every response

## 🛠️ Tech Stack
- **Multi-agent framework:** CrewAI
- **LLM:** Azure OpenAI GPT-4
- **Orchestration:** LangChain
- **API:** FastAPI
- **Frontend:** Vanilla JS

## 📦 Files
- `index.html`, `app.js`, `styles.css` — frontend demo
- `crewai_eval.py` — production FastAPI backend with CrewAI agents
- `requirements.txt` — Python deps
- `README.md`

## ⚙️ Run Locally
**Frontend demo:** open `index.html` in browser.

**Backend:**
```bash
pip install -r requirements.txt
export AZURE_OPENAI_API_KEY=...
export AZURE_OPENAI_ENDPOINT=https://YOUR.openai.azure.com/
export CHAT_DEPLOYMENT=gpt-4
uvicorn crewai_eval:app --reload
```

## 🌐 Deployment
- **Frontend:** GitHub Pages / Netlify / Vercel
- **Backend:** Render.com / Railway.app / Azure App Service

## 📋 Rubric
| Dimension | Weight |
|-----------|--------|
| Relevance | 20% |
| Factual Accuracy | 25% |
| Completeness | 20% |
| Clarity | 15% |
| Coherence | 10% |
| Conciseness | 10% |

## 📜 License
MIT
