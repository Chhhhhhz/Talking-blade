// --- НАСТРОЙКИ СКИНОВ И ЕДЫ (ПОТОМ ЗАМЕНИ КАРТИНКИ НА СВОИ) ---
const SKINS = [
  { id: 'default', name: 'Обычный Блэйд', price: 0, img: 'https://api.dicebear.com/7.x/bottts/svg?seed=Blade1' },
  { id: 'maid', name: 'Костюм горничной', price: 150, img: 'https://api.dicebear.com/7.x/bottts/svg?seed=BladeMaid' },
  { id: 'beach', name: 'Пляжный', price: 300, img: 'https://api.dicebear.com/7.x/bottts/svg?seed=BladeBeach' },
  { id: 'cat', name: 'С ушками', price: 500, img: 'https://api.dicebear.com/7.x/bottts/svg?seed=BladeCat' }
];

const FOODS = [
  { id: 'rice', name: '🍙 Онигири', price: 15, hunger: 20 },
  { id: 'tea', name: '🍵 Горький чай', price: 25, hunger: 35 },
  { id: 'cake', name: '🍰 Тортик', price: 50, hunger: 60 }
];

const PHRASES = [
  "Убери от меня руки...",
  "Из пяти человек трое должны заплатить...",
  "Я не кот, хватит меня тискать.",
  "Кафка заставила тебя это скачать?",
  "Смерть... опять не сегодня.",
  "Ладно, покорми меня. Но без энтузиазма."
];

// --- СОСТОЯНИЕ ИГРЫ ---
let state = JSON.parse(localStorage.getItem('bladeSave')) || {
  coins: 100,
  hunger: 80,
  clean: 80,
  energy: 80,
  happy: 80,
  isSleeping: false,
  currentSkin: 'default',
  ownedSkins: ['default']
};

function saveState() {
  localStorage.setItem('bladeSave', JSON.stringify(state));
}

function updateUI() {
  document.getElementById('coins').innerText = state.coins;
  document.getElementById('bar-hunger').value = state.hunger;
  document.getElementById('bar-clean').value = state.clean;
  document.getElementById('bar-energy').value = state.energy;
  document.getElementById('bar-happy').value = state.happy;

  const skinObj = SKINS.find(s => s.id === state.currentSkin) || SKINS[0];
  document.getElementById('blade-sprite').src = skinObj.img;

  const sleepOverlay = document.getElementById('sleep-overlay');
  if (state.isSleeping) {
    sleepOverlay.classList.remove('hidden');
  } else {
    sleepOverlay.classList.add('hidden');
  }
}

function say(text) {
  const bubble = document.getElementById('speech-bubble');
  bubble.innerText = text;
  bubble.classList.remove('hidden');
  clearTimeout(window.sayTimer);
  window.sayTimer = setTimeout(() => bubble.classList.add('hidden'), 3000);
}

// --- ВЗАИМОДЕЙСТВИЯ ---
const charContainer = document.getElementById('character-container');
const sprite = document.getElementById('blade-sprite');

sprite.addEventListener('click', () => {
  if (state.isSleeping) {
    say("Zzz... Не буди меня.");
    return;
  }
  sprite.classList.remove('bounce');
  void sprite.offsetWidth;
  sprite.classList.add('bounce');

  state.happy = Math.min(100, state.happy + 5);
  state.coins += 2;
  const randomPhrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
  say(randomPhrase);
  updateUI();
  saveState();
});

function feedBlade(hungerGain = 20) {
  if (state.isSleeping) return say("Я сплю...");
  state.hunger = Math.min(100, state.hunger + hungerGain);
  state.clean = Math.max(0, state.clean - 5);
  state.coins += 5;
  say("Приемлемо.");
  updateUI();
  saveState();
}

function washBlade() {
  if (state.isSleeping) return say("Не лей воду на спящего!");
  const bubbles = document.getElementById('bubbles-overlay');
  bubbles.classList.remove('hidden');
  state.clean = Math.min(100, state.clean + 30);
  state.coins += 8;
  say("Хватит меня тереть, я чистый!");
  updateUI();
  saveState();
  setTimeout(() => bubbles.classList.add('hidden'), 2000);
}

function toggleSleep() {
  state.isSleeping = !state.isSleeping;
  say(state.isSleeping ? "Наконец-то покой..." : "Опять просыпаться...");
  updateUI();
  saveState();
}

// --- АВТОНОМНАЯ ПРОГУЛКА ПО ЭКРАНУ ---
setInterval(() => {
  if (state.isSleeping) return;
  // Случайная позиция от 20% до 80% ширины экрана
  const randomLeft = Math.floor(Math.random() * 60) + 20;
  const currentLeft = parseFloat(charContainer.style.left) || 50;
  
  // Разворот спрайта в сторону движения
  sprite.style.transform = randomLeft < currentLeft ? 'scaleX(-1)' : 'scaleX(1)';
  charContainer.style.left = randomLeft + '%';
}, 4000);

// --- ПАДЕНИЕ ПОТРЕБНОСТЕЙ СО ВРЕМЕНЕМ ---
setInterval(() => {
  if (state.isSleeping) {
    state.energy = Math.min(100, state.energy + 4);
    state.hunger = Math.max(0, state.hunger - 1);
  } else {
    state.hunger = Math.max(0, state.hunger - 2);
    state.clean = Math.max(0, state.clean - 1);
    state.energy = Math.max(0, state.energy - 2);
    state.happy = Math.max(0, state.happy - 1);
  }
  updateUI();
  saveState();
}, 10000); // каждые 10 секунд

// --- МАГАЗИН ---
function openShop() {
  document.getElementById('shop-modal').classList.remove('hidden');
  renderShop();
}

function closeShop() {
  document.getElementById('shop-modal').classList.add('hidden');
}

function renderShop() {
  const foodList = document.getElementById('food-list');
  foodList.innerHTML = '';
  FOODS.forEach(item => {
    foodList.innerHTML += `
      <div class="shop-item">
        <div>${item.name}</div>
        <small>+${item.hunger} сытости</small>
        <button onclick="buyFood('${item.id}')">🪙 ${item.price}</button>
      </div>
    `;
  });

  const skinList = document.getElementById('skin-list');
  skinList.innerHTML = '';
  SKINS.forEach(skin => {
    const isOwned = state.ownedSkins.includes(skin.id);
    const isEquipped = state.currentSkin === skin.id;
    let btnText = isEquipped ? 'Надето' : (isOwned ? 'Надеть' : `🪙 ${skin.price}`);
    skinList.innerHTML += `
      <div class="shop-item">
        <div>${skin.name}</div>
        <button onclick="handleSkin('${skin.id}')">${btnText}</button>
      </div>
    `;
  });
}

function buyFood(id) {
  const item = FOODS.find(f => f.id === id);
  if (state.coins >= item.price) {
    state.coins -= item.price;
    feedBlade(item.hunger);
    renderShop();
  } else {
    say("Недостаточно монет.");
  }
}

function handleSkin(id) {
  const skin = SKINS.find(s => s.id === id);
  if (state.ownedSkins.includes(id)) {
    state.currentSkin = id;
    say("Зачем я это надел...");
  } else if (state.coins >= skin.price) {
    state.coins -= skin.price;
    state.ownedSkins.push(id);
    state.currentSkin = id;
    say("Ты потратила монеты на ЭТО?");
  } else {
    say("Не хватает монет.");
  }
  updateUI();
  saveState();
  renderShop();
}

// --- ПИСКЛЯВЫЙ ГОЛОС ПОВТОРЮШКА ---
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

async function toggleVoiceRepeat() {
  const btn = document.getElementById('mic-btn');
  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        // Ускоряем воспроизведение без сохранения тональности = писклявый голос Тома!
        audio.preservesPitch = false;
        audio.playbackRate = 1.45;
        say("🗣️ ...");
        audio.play();
      };
      mediaRecorder.start();
      isRecording = true;
      btn.classList.add('recording');
      btn.innerText = '⏹️ Стоп';
      say("Говори...");
    } catch (err) {
      say("Нет доступа к микрофону :(");
    }
  } else {
    mediaRecorder.stop();
    isRecording = false;
    btn.classList.remove('recording');
    btn.innerText = '🎙️ Голос';
  }
}

// Запуск при открытии
updateUI();
