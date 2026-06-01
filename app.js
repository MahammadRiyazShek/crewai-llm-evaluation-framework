// Simulated CrewAI evaluation — in production this calls crewai_eval.py FastAPI backend

const EXAMPLES = [
  {
    prompt: "Explain how a transformer neural network works in 3 sentences.",
    response: "A transformer is a deep learning model that uses self-attention to weigh the importance of different words in a sequence. It processes all tokens in parallel using encoder and decoder stacks, each with multi-head attention and feed-forward layers. Transformers power modern LLMs like GPT and BERT, replacing older RNN-based architectures for most NLP tasks.",
    reference: "A transformer is a neural network architecture based on self-attention, introduced in 'Attention is All You Need' (2017). It processes sequences in parallel rather than sequentially and is the backbone of modern LLMs."
  },
  {
    prompt: "What is the capital of Australia?",
    response: "The capital of Australia is Sydney, which is the largest and most populous city in the country.",
    reference: "The capital of Australia is Canberra (not Sydney). Sydney is the largest city but Canberra was selected as the capital in 1908."
  },
  {
    prompt: "Write a Python function to check if a string is a palindrome.",
    response: "def is_palindrome(s):\n    s = s.lower().replace(' ', '')\n    return s == s[::-1]\n\nThis function normalizes the string by lowercasing and removing spaces, then checks if it equals its reverse.",
    reference: "A palindrome check should normalize the string and compare it to its reverse using slicing s[::-1]."
  },
  {
    prompt: "Briefly describe photosynthesis.",
    response: "Photosynthesis is a process where animals convert food into oxygen using moonlight, occurring in the mitochondria.",
    reference: "Photosynthesis is the process by which plants convert sunlight, water, and CO2 into glucose and oxygen, occurring in chloroplasts."
  }
];
let exIdx = 0;

function loadExample(){
  exIdx = (exIdx + 1) % EXAMPLES.length;
  const e = EXAMPLES[exIdx];
  document.getElementById('prompt').value = e.prompt;
  document.getElementById('response').value = e.response;
  document.getElementById('reference').value = e.reference;
}

function tokenize(t){ return (t.toLowerCase().match(/[a-z0-9]+/g) || []); }
function overlap(a, b){
  const sa = new Set(tokenize(a)), sb = new Set(tokenize(b));
  let i = 0; sa.forEach(x => sb.has(x) && i++);
  return i / Math.max(sa.size, 1);
}

function scoreRelevance(prompt, response){
  const sim = overlap(prompt, response);
  return Math.min(100, Math.round(50 + sim*100));
}
function scoreFactual(response, reference){
  if(!reference) return 75;
  const sim = overlap(reference, response);
  // contradictions detected when key reference terms missing
  const refKeys = tokenize(reference).filter(t => t.length>5);
  const respTokens = new Set(tokenize(response));
  const hit = refKeys.filter(k => respTokens.has(k)).length / Math.max(refKeys.length,1);
  return Math.round(Math.min(100, 30 + hit*70));
}
function scoreCompleteness(prompt, response){
  const ratio = response.split(/\s+/).length / Math.max(prompt.split(/\s+/).length, 5);
  return Math.round(Math.min(100, 40 + Math.min(ratio*15, 60)));
}
function scoreClarity(response){
  const sents = response.split(/[.!?]+/).filter(s=>s.trim());
  const avgLen = sents.reduce((s,x)=>s+x.length,0) / Math.max(sents.length,1);
  let s = 90;
  if(avgLen > 200) s -= 25;
  if(avgLen < 20)  s -= 15;
  if(sents.length < 2) s -= 10;
  return Math.max(40, s);
}
function scoreCoherence(response){
  const words = response.split(/\s+/);
  const unique = new Set(words.map(w => w.toLowerCase()));
  const ratio = unique.size / Math.max(words.length, 1);
  return Math.round(Math.min(100, 50 + ratio*80));
}
function scoreConciseness(prompt, response){
  const rW = response.split(/\s+/).length;
  if(rW < 30)  return 95;
  if(rW < 80)  return 85;
  if(rW < 150) return 75;
  return 60;
}

function evaluate(){
  const prompt = document.getElementById('prompt').value.trim();
  const response = document.getElementById('response').value.trim();
  const reference = document.getElementById('reference').value.trim();
  if(!prompt || !response){ alert('Please provide both prompt and response.'); return; }

  const scores = {
    Relevance:        scoreRelevance(prompt, response),
    'Factual Accuracy': scoreFactual(response, reference),
    Completeness:     scoreCompleteness(prompt, response),
    Clarity:          scoreClarity(response),
    Coherence:        scoreCoherence(response),
    Conciseness:      scoreConciseness(prompt, response)
  };
  const weights = { Relevance:20, 'Factual Accuracy':25, Completeness:20, Clarity:15, Coherence:10, Conciseness:10 };
  const overall = Math.round(Object.entries(scores).reduce((s,[k,v]) => s + v*weights[k]/100, 0));

  const card = document.getElementById('resultCard');
  card.style.display = 'block';

  const verdict = overall>=80 ? '✅ Excellent' : overall>=65 ? '🟢 Good' : overall>=50 ? '🟡 Acceptable' : '🔴 Poor';
  document.getElementById('overall').innerHTML = `
    <div class="score-circle" style="--p:${overall}"><b>${overall}</b><small>Overall</small></div>
    <div class="verdict"><h3>${verdict}</h3><p>Weighted aggregate of 6 rubric dimensions evaluated by 4 specialist CrewAI agents.</p></div>
  `;
  document.getElementById('rubric').innerHTML = Object.entries(scores).map(([dim,sc]) => {
    const cls = sc>=80?'high':sc>=60?'med':'low';
    return `<div class="bar-row"><span>${dim}</span><div class="bar"><div class="fill ${cls}" style="width:${sc}%"></div></div><b>${sc}</b></div>`;
  }).join('');

  const agentReports = [
    {name:'📐 Relevance Agent', score:scores.Relevance, verdict: scores.Relevance>=70 ? 'Response addresses the prompt directly.' : 'Response only partially addresses the prompt.'},
    {name:'✅ Factual Accuracy Agent', score:scores['Factual Accuracy'], verdict: scores['Factual Accuracy']>=70 ? 'Claims align with reference / KB.' : 'Detected likely factual errors or hallucinations.'},
    {name:'🎯 Completeness Agent', score:scores.Completeness, verdict: scores.Completeness>=70 ? 'Covers required aspects.' : 'Missing key aspects requested by the prompt.'},
    {name:'✍️ Clarity & Coherence Agent', score:Math.round((scores.Clarity+scores.Coherence)/2), verdict: 'Structure, grammar, and logical flow analyzed.'}
  ];
  document.getElementById('agents').innerHTML = agentReports.map(a => `
    <div class="agent-result">
      <div class="ar-head"><b>${a.name}</b><span class="ar-score">${a.score}</span></div>
      <p>${a.verdict}</p>
    </div>`).join('');

  card.scrollIntoView({behavior:'smooth'});
}
