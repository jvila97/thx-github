/**
 * Akinkator - Core Logic & API Integration
 * This file is completely independent and manages the character guessing game.
 */

// 1. State variables
const STATE = {
  questionCount: 0,
  maxQuestions: 20,
  history: [],
  isThinking: false
};

// 2. DOM references
const screenStart = document.getElementById('screen-start');
const screenQuestion = document.getElementById('screen-question');
const screenResult = document.getElementById('screen-result');
const orb = document.getElementById('orb');
const counter = document.getElementById('counter');
const progressFill = document.getElementById('progress-fill');
const questionText = document.getElementById('question-text');

const btnStart = document.getElementById('btn-start');
const btnSi = document.getElementById('btn-si');
const btnNo = document.getElementById('btn-no');
const btnNose = document.getElementById('btn-nose');
const btnProbablemente = document.getElementById('btn-probablemente');

const resultName = document.getElementById('result-name');
const resultDesc = document.getElementById('result-desc');
const btnCorrect = document.getElementById('btn-correct');
const btnWrong = document.getElementById('btn-wrong');
const btnRestart = document.getElementById('btn-restart');

// 3. Screen switching function
function showScreen(screenId) {
  // Logic adapted to use the .hidden class from the project's CSS
  document.querySelectorAll('.screen-container').forEach(s => s.classList.add('hidden'));
  document.getElementById(screenId).classList.remove('hidden');
}

// 4. Gemini API call
const GEMINI_API_KEY = 'TU_API_KEY_AQUI';

async function askGemini(userAnswer) {
  STATE.isThinking = true;
  orb.classList.add('thinking');

  if (userAnswer) {
    STATE.history.push({ role: 'user', parts: [{ text: userAnswer }] });
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: `You are Akinkator, a mystical AI oracle that guesses any character the user is thinking of — real, fictional, from anime, games, history, movies or any other universe. Ask one smart strategic question at a time. When confident enough respond exactly with: GUESS: [name] | [one sentence explanation]. Otherwise respond with only the next question. Never repeat a question.` }] },
      contents: STATE.history
    })
  });

  const data = await response.json();
  const reply = data.candidates[0].content.parts[0].text.trim();
  STATE.history.push({ role: 'model', parts: [{ text: reply }] });
  STATE.isThinking = false;
  orb.classList.remove('thinking');
  return reply;
}

// 5. Parse response function
function parseReply(reply) {
  if (reply.startsWith('GUESS:')) {
    const parts = reply.replace('GUESS:', '').split('|');
    const name = parts[0].trim();
    const desc = parts[1] ? parts[1].trim() : '';
    showResult(name, desc);
  } else {
    showQuestion(reply);
  }
}

// 6. Show question function
function showQuestion(text) {
  STATE.questionCount++;
  questionText.textContent = text;
  counter.textContent = `Pregunta ${STATE.questionCount} de ${STATE.maxQuestions}`;
  const percent = (STATE.questionCount / STATE.maxQuestions) * 100;
  progressFill.style.width = `%`;
  showScreen('screen-question');
}

// 7. Show result function
function showResult(name, desc) {
  resultName.textContent = name;
  resultDesc.textContent = desc;
  showScreen('screen-result');
}

// 8. Reset function
function resetGame() {
  STATE.questionCount = 0;
  STATE.history = [];
  STATE.isThinking = false;
  progressFill.style.width = '0%';
  orb.classList.remove('thinking');
  showScreen('screen-start');
}

// 9. Event listeners
document.addEventListener('DOMContentLoaded', () => {
  btnStart.addEventListener('click', async () => {
    showScreen('screen-question');
    questionText.textContent = '¿En qué personaje estás pensando? Empieza a responder...';
    const firstQuestion = await askGemini('Empieza a hacer preguntas. El usuario ya está pensando en un personaje.');
    parseReply(firstQuestion);
  });

  [btnSi, btnNo, btnNose, btnProbablemente].forEach(btn => {
    btn.addEventListener('click', async () => {
      if (STATE.isThinking) return;
      const answer = btn.textContent;
      const reply = await askGemini(answer);
      parseReply(reply);
    });
  });

  btnCorrect.addEventListener('click', () => {
    resultDesc.textContent = '¡Lo sabía! Soy Akinkator 🔮';
  });

  btnWrong.addEventListener('click', async () => {
    const lastGuess = await askGemini('Has fallado, intenta adivinar de nuevo con una última oportunidad.');
    parseReply(lastGuess);
  });

  btnRestart.addEventListener('click', resetGame);
});
