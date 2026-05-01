<div align="center">

# 🧠 DocuMind AI

### *Your personal AI knowledge base over Google Drive*

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.0.0-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![FAISS](https://img.shields.io/badge/FAISS-Vector_DB-blue?style=flat)](https://github.com/facebookresearch/faiss)
[![Groq](https://img.shields.io/badge/Groq-LLM_API-orange?style=flat)](https://groq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat)](LICENSE)

**Built by [Mohit Kourav](https://github.com/MOHITKOURAV01) 🧑🏻‍💻** 

</div>

---

## What is DocuMind AI?

DocuMind AI is a production-ready **Retrieval-Augmented Generation (RAG)** system that connects to your Google Drive, processes your documents intelligently, and lets you ask natural language questions — getting grounded answers sourced directly from your files.

Think of it as **ChatGPT, but trained exclusively on your own documents.**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔗 **Google Drive Integration** | OAuth 2.0 authentication + public folder support via gdown |
| 📄 **Multi-format Processing** | PDF, TXT, and Google Docs extraction |
| ✂️ **Smart Chunking** | Semantic chunking with metadata preservation |
| 🧬 **Vector Embeddings** | SentenceTransformers for high-quality dense embeddings |
| 🔍 **FAISS Vector Search** | Lightning-fast similarity search over indexed chunks |
| 🤖 **LLM Answer Generation** | Groq (Llama 3) / Gemini for grounded, cited answers |
| 🔄 **Incremental Sync** | Only re-processes changed files (hash-based dedup) |
| 👥 **Multi-user Support** | Cookie-based session isolation per user |
| 🎨 **Premium UI** | Dark/light mode, voice I/O, animated chat interface |
| 🐳 **Docker Ready** | One-command deployment |

---

## Architecture

```
DocuMind AI — RAG Pipeline
═══════════════════════════════════════════════════════════
                                                            
  Google Drive ──► connectors/google_drive.py              
                          │                                 
                          ▼                                 
                   processing/extractor.py   ← PDF / TXT   
                          │                                 
                          ▼                                 
                   processing/chunker.py     ← Smart Chunks 
                          │                                 
                          ▼                                 
                   embedding/embedder.py     ← SentenceTransformers
                          │                                 
                          ▼                                 
                   search/vector_store.py    ← FAISS Index  
                                                            
  User Query ──► embedding/embedder.py                     
                       │                                    
                       ▼                                    
                search/vector_store.py  ← Top-K Retrieval   
                       │                                    
                       ▼                                    
                llm/answer.py           ← Groq / Gemini LLM 
                       │                                    
                       ▼                                    
              {"answer": "...", "sources": [...]}            
                                                            
═══════════════════════════════════════════════════════════

Project Structure:
├── api/               ← FastAPI routes
├── connectors/        ← Google Drive OAuth + file fetch
├── processing/        ← Text extraction + chunking
├── embedding/         ← SentenceTransformers embedder
├── search/            ← FAISS vector store
├── llm/               ← LLM answer generation
├── frontend/          ← React-less SPA (HTML/CSS/JS)
├── demo_docs/         ← Sample documents for testing
├── main.py            ← FastAPI app entry point
└── config.py          ← Environment configuration
```

---

## ⚡ Quick Start

### 1. Prerequisites
- Python 3.10+
- Google Cloud Console account
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 2. Clone & Install

```bash
git clone https://github.com/MOHITKOURAV01/DocuMind-AI.git
cd DocuMind-AI

python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
GROQ_API_KEY=your_groq_api_key
LLM_PROVIDER=groq
PORT=8000
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Google Drive API**
3. APIs & Services → **OAuth Consent Screen** → External → Add your email as Test User
4. Credentials → **Create OAuth 2.0 Client ID** → Web Application
5. Authorized redirect URI: `http://localhost:8000/auth/callback`
6. Copy Client ID and Secret to `.env`

### 5. Run

```bash
python main.py
```

Open [http://localhost:8000](http://localhost:8000) 🎉

---

## 🐳 Docker Deployment

```bash
# Build and run
docker-compose up --build

# Or build manually
docker build -t documind-ai .
docker run -p 8000:8000 --env-file .env documind-ai
```

---

## 📡 API Reference

### POST `/sync-drive`
Sync and index documents from Google Drive.

```bash
curl -X POST http://localhost:8000/sync-drive \
  -H "Content-Type: application/json" \
  -d '{"folder_id": "your_google_drive_folder_id"}'
```

**Response:**
```json
{
  "status": "success",
  "files_processed": 5,
  "files_skipped_unchanged": 2,
  "total_new_chunks": 147,
  "files": ["refund_policy.txt", "handbook.pdf", "..."]
}
```

---

### POST `/ask`
Ask a natural language question over indexed documents.

```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is our refund policy?"}'
```

**Response:**
```json
{
  "answer": "Based on the Refund Policy document: customers have 30 days to return items in original condition. Digital products are non-refundable. Refunds are processed within 5-7 business days.",
  "sources": [
    {"name": "company_refund_policy.txt", "link": "..."}
  ]
}
```

---

### GET `/status`
Get current system status.

```bash
curl http://localhost:8000/status
```

**Response:**
```json
{
  "faiss_index_exists": true,
  "total_chunks_indexed": 147,
  "unique_documents": 5,
  "drive_connected": true,
  "user_email": "user@gmail.com"
}
```

---

### GET `/recommend-questions`
Get AI-generated suggested questions based on indexed content.

---

### POST `/disconnect`
Remove Google Drive OAuth tokens.

---

### POST `/clear-data`
Clear all indexed FAISS data and downloaded files.

---

## 📊 Sample Q&A Output

**Q:** *"What is the password policy according to IT Security SOP?"*

**A:** *"According to the IT Security SOP document: Passwords must be at least 12 characters, containing uppercase, lowercase, numbers, and special characters. Passwords must be changed every 90 days and cannot reuse the last 10 passwords. Multi-factor authentication (MFA) is mandatory for all remote access."*

**Sources:** `it_security_sop.txt`

---

**Q:** *"Summarize the expense reimbursement process"*

**A:** *"Based on the Expense Report SOP: Employees must submit expense reports within 30 days of incurring the expense using the company's HR portal. Receipts are required for expenses over $25. Approval is needed from direct managers for amounts under $500, and VP approval for amounts above $500. Reimbursements are processed in the next payroll cycle."*

**Sources:** `expense_report_sop.txt`

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Backend** | Python 3.10+, FastAPI |
| **Embeddings** | SentenceTransformers (`all-MiniLM-L6-v2`) |
| **Vector DB** | FAISS (Facebook AI Similarity Search) |
| **LLM** | Groq API (Llama 3.1 8B) / Google Gemini |
| **Drive Connector** | Google Drive API v3, gdown |
| **PDF Parsing** | PyMuPDF (fitz) |
| **Frontend** | Vanilla HTML/CSS/JS (no framework needed) |
| **Deployment** | Docker, Render.com |

---

## 🗺️ Roadmap

- [ ] OpenSearch / Elasticsearch backend support
- [ ] Async document processing pipeline
- [ ] Metadata filtering in queries
- [ ] Google Docs (.gdoc) native support
- [ ] Slack / Notion connectors
- [ ] Chat history persistence

---

## 👤 Author

**Mohit Kourav**
- GitHub: [@MOHITKOURAV01](https://github.com/MOHITKOURAV01)
- Repository: [DocuMind-AI](https://github.com/MOHITKOURAV01/DocuMind-AI)

---

<div align="center">
Made with ❤️ by Mohit Kourav
</div>
