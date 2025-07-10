document.addEventListener('DOMContentLoaded', () => {
  // Configuração do Firebase
  const firebaseConfig = {
  apiKey: "AIzaSyAhziJbG5Pxg0UYvq784YH4zXpsdKfh7AY",
  authDomain: "bigfoot-connect.firebaseapp.com",
  projectId: "bigfoot-connect",
  storageBucket: "bigfoot-connect.appspot.com",
  messagingSenderId: "177999879162",
  appId: "1:177999879162:web:a1ea739930cac97475e243"
};

  // Inicializa o Firebase
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase inicializado:', firebase.app().name);
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error.code, error.message);
    alert('Erro ao inicializar Firebase. Verifique as credenciais e a conexão.');
    return;
  }

  const auth = firebase.auth();
const db = firebase.firestore();
  window.firebaseAuth = auth;
  window.firebaseFns = {
    signInWithEmailAndPassword: auth.signInWithEmailAndPassword.bind(auth),
    signOut: auth.signOut.bind(auth),
    createUserWithEmailAndPassword: auth.createUserWithEmailAndPassword.bind(auth)
  };

  // Verifica se o Firebase Authentication está disponível
  if (!firebase.auth) {
    console.error('Firebase Authentication não está disponível');
    alert('Erro: Firebase Authentication não está disponível.');
    return;
  }

  // Limpar sessão do Firebase para garantir estado inicial deslogado
  firebase.auth().signOut().catch(error => console.error('Erro ao limpar sessão:', error.code, error.message));
  console.log('Sessão inicial limpa');

  const savedTheme = localStorage.getItem('bigfootTheme');
  console.log('Tema salvo no localStorage:', savedTheme);
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    updateTheme();
  }

  const translations = {
  pt: {
    connect: "🔌 Conectar / Desconectar",
    stop: "🛑 Parar",
    statusDisconnected: "Desconectado",
    statusMining: "Compartilhando",
    received: "Você já recebeu:",
    config: "⚙️ Configurações",
    login: "🔐 Login",
    logout: "🚪 Sair",
    networkQuality: "Qualidade da Rede:",
    dashboard: "🖥️ Dashboard",
    selectThreadsLabel: "Selecione o nível de compartilhamento",
    theme: "🌓 Tema",
    faq: "❓ F.A.Q",
    settingsTitle: "Configurações",
    selectLanguage: "Idioma:",
    save: "Salvar",
    loginTitle: "Entrar / Cadastrar",
    emailPlaceholder: "Seu e-mail",
    passwordPlaceholder: "Senha",
    loginBtn: "Entrar",
    registerBtn: "Cadastrar"
  },
  en: {
    connect: "🔌 Connect / Disconnect",
    stop: "🛑 Stop",
    statusDisconnected: "Disconnected",
    statusMining: "Sharing",
    received: "You’ve received:",
    config: "⚙️ Settings",
    login: "🔐 Login",
    logout: "🚪 Logout",
    networkQuality: "Network Quality:",
    dashboard: "🖥️ Dashboard",
    selectThreadsLabel: "Select sharing level",
    theme: "🌓 Theme",
    faq: "❓ F.A.Q",
    settingsTitle: "Settings",
    selectLanguage: "Language:",
    save: "Save",
    loginTitle: "Login / Register",
    emailPlaceholder: "Your email",
    passwordPlaceholder: "Password",
    loginBtn: "Login",
    registerBtn: "Register"
  }
};

  const faqContent = {
    pt: [
      {
        question: "O que é o BIGFOOT Connect?",
        answer: "É uma aplicação para compartilhar sua largura de banda e ganhar tokens BIG na rede Solana."
      },
      {
        question: "Como faço para compartilhar minha largura de banda?",
        answer: "Basta fazer login e ativar o botão conectar para começar a compartilhar."
      },
      {
        question: "Como recebo recompensas?",
        answer: "Você recebe tokens BIG proporcionalmente ao uso da sua banda compartilhada."
      }
    ],
    en: [
      {
        question: "What is BIGFOOT Connect?",
        answer: "It’s an application to share your bandwidth and earn BIG tokens on the Solana network."
      },
      {
        question: "How do I share my bandwidth?",
        answer: "Just log in and activate the connect button to start sharing."
      },
      {
        question: "How do I receive rewards?",
        answer: "You receive BIG tokens proportionally to the bandwidth you share."
      }
    ]
  };

  let currentLang = localStorage.getItem('bigfootLang') || 'pt';
  let isLoggedIn = false;
  let isMining = false;
  let pktMined = 0;
  let networkQuality = 0;

  const authButtons = document.getElementById('authButtons');
  const connectBtn = document.getElementById('connectBtn');
  const statusText = document.getElementById('statusText');
  const networkQualityValue = document.getElementById('networkQualityValue');
  const dashboardBtn = document.getElementById('dashboardBtn');
  const faqSection = document.getElementById('faqSection');
  const languageSelect = document.getElementById('languageSelect');
  const threadSelector = document.getElementById('threadSelector');
  const themeBtn = document.getElementById('themeBtn');
  const faqBtn = document.getElementById('faqBtn');
  const settingsModal = document.getElementById('settingsModal');
  const loginModal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const closeSettingsModal = document.getElementById('closeSettingsModal');
  const closeLoginModal = document.getElementById('closeLoginModal');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const registerBtn = document.getElementById('registerBtn');

  // Inicializa FAQ como oculto
  faqSection.style.display = 'none';

  // Configura persistência do Firebase
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      console.log('Persistência do Firebase configurada');
      window.firebaseAuth.onAuthStateChanged(user => {
        console.log('Estado de autenticação:', user ? `Usuário logado: ${user.email}` : 'Nenhum usuário logado', user);
        isLoggedIn = !!user;
        updateText();
        setInterval(simulateNetworkQuality, 5000);
        setInterval(simulateMining, 10000);
      });
    })
    .catch(error => console.error('Erro na persistência:', error.code, error.message));

  // Exibir nome do usuário logado
  const userWelcome = document.getElementById('userWelcome');
  if (user && user.email) {
    userWelcome.textContent = currentLang === 'pt'
      ? `Bem-vindo, ${user.email}`
      : `Welcome, ${user.email}`;
    userWelcome.style.display = 'block';
  } else {
    userWelcome.style.display = 'none';
  }

  // Carregar gráfico de uso
  if (user) {
    const usageRef = db.collection("users").doc(user.uid).collection("dailyUsage");
    const today = new Date();
    const past7Days = [...Array(7)].map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    usageRef
      .where(firebase.firestore.FieldPath.documentId(), 'in', past7Days)
      .get()
      .then(snapshot => {
        const labels = [];
        const data = [];

        past7Days.forEach(date => {
          labels.push(date.substr(5)); // Exibe só MM-DD
          const doc = snapshot.docs.find(d => d.id === date);
          data.push(doc?.data()?.shared || 0);
        });

        const ctx = document.getElementById('usageChart').getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: currentLang === 'pt' ? 'Uso diário (MB)' : 'Daily Usage (MB)',
              data,
              backgroundColor: '#4ade80'
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
      })
      .catch(err => {
        console.error('Erro ao carregar gráfico de uso:', err);
      });
  }

  // Adiciona ouvintes de eventos
  themeBtn.addEventListener('click', toggleTheme);
  faqBtn.addEventListener('click', toggleFAQ);
  connectBtn.addEventListener('click', handleConnect);
  dashboardBtn.addEventListener('click', openDashboard);
  closeSettingsModal.addEventListener('click', () => toggleModal('settingsModal'));
  closeLoginModal.addEventListener('click', () => toggleModal('loginModal'));
  saveSettingsBtn.addEventListener('click', saveSettings);
  registerBtn.addEventListener('click', handleRegister);

  // Listener para o formulário de login
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log('Formulário de login submetido');
      handleLogin();
    });
  } else {
    console.error('Formulário de login não encontrado');
    alert(currentLang === 'pt' ? 'Erro: Formulário de login não encontrado.' : 'Error: Login form not found.');
  }

  // Render FAQ
  function renderFAQ() {
    console.log('Renderizando FAQ, idioma:', currentLang);
    const faqList = faqContent[currentLang];
    const openStates = [];
    const currentDetails = faqSection.querySelectorAll('details');
    currentDetails.forEach((det, i) => {
      openStates[i] = det.open;
    });

    if (faqSection.children.length !== faqList.length) {
      faqSection.innerHTML = '';
      faqList.forEach(({ question, answer }) => {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = question;
        const p = document.createElement('p');
        p.textContent = answer;
        details.appendChild(summary);
        details.appendChild(p);
        faqSection.appendChild(details);
      });
    } else {
      faqList.forEach(({ question, answer }, i) => {
        const details = faqSection.children[i];
        details.querySelector('summary').textContent = question;
        details.querySelector('p').textContent = answer;
      });
    }

    const newDetails = faqSection.querySelectorAll('details');
    newDetails.forEach((det, i) => {
      det.open = openStates[i] || false;
    });
  }

  // Atualiza opções de threads
  function updateThreadOptionsLanguage() {
    console.log('Atualizando opções de threads, idioma:', currentLang);
    const options = threadSelector.querySelectorAll('option');
    options.forEach(option => {
      const label = currentLang === 'en' ? option.dataset.en : option.dataset.pt;
      const emoji = option.textContent.match(/^[^\s]+/);
      option.textContent = `${emoji ? emoji[0] + ' ' : ''}${label}`;
    });
  }

  // Atualiza textos da interface
  function updateText() {
    console.log('Atualizando interface, isLoggedIn:', isLoggedIn, 'isMining:', isMining, 'currentLang:', currentLang);
    const t = translations[currentLang];

    connectBtn.textContent = isMining ? t.stop : t.connect;
    connectBtn.disabled = !isLoggedIn;
    statusText.textContent = isMining ? t.statusMining : t.statusDisconnected;
    document.getElementById('threadsLabel').textContent = t.selectThreadsLabel;
    document.querySelector('.quality strong').textContent = t.networkQuality;
    networkQualityValue.textContent = `${networkQuality}%`;
    dashboardBtn.textContent = t.dashboard;

document.getElementById("themeBtn").textContent = t.theme;
document.getElementById("faqBtn").textContent = t.faq;
document.getElementById("settingsTitle").textContent = t.settingsTitle;
document.querySelector('label[for="languageSelect"]').textContent = t.selectLanguage;
document.getElementById("saveSettingsBtn").textContent = t.save;
document.getElementById("loginTitle").textContent = t.loginTitle;
document.getElementById("userEmail").placeholder = t.emailPlaceholder;
document.getElementById("userPassword").placeholder = t.passwordPlaceholder;
document.getElementById("loginBtn").textContent = t.loginBtn;
document.getElementById("registerBtn").textContent = t.registerBtn;

    authButtons.innerHTML = isLoggedIn
  ? `<button class="icon-button" id="logoutBtn" aria-label="Sair">${t.logout}</button>
     <button class="icon-button" id="settingsBtn" aria-label="Abrir configurações">${t.config}</button>`
  : `<button class="icon-button" id="loginModalBtn" aria-label="Fazer login">${t.login}</button>
     <button class="icon-button" id="settingsBtn" aria-label="Abrir configurações">${t.config}</button>`;
    console.log('Botões de autenticação renderizados:', authButtons.innerHTML);

    // Adiciona ouvintes para os botões de autenticação dinâmicos
    document.getElementById('settingsBtn').addEventListener('click', () => toggleModal('settingsModal'));
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('loginModalBtn')?.addEventListener('click', () => toggleModal('loginModal'));

    languageSelect.value = currentLang;
    threadSelector.setAttribute('aria-label', t.selectThreadsLabel);
    updateThreadOptionsLanguage();
    renderFAQ();
  }

  // Simula qualidade da rede
  function simulateNetworkQuality() {
    networkQuality = Math.floor(50 + Math.random() * 50);
    console.log('Simulando qualidade da rede:', networkQuality);
    updateText();
  }

function registrarUsoDiario(qtdEmMB) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const hoje = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
  const docRef = db.collection("users").doc(user.uid).collection("dailyUsage").doc(hoje);

  docRef.get().then(docSnapshot => {
    if (docSnapshot.exists) {
      docRef.update({
        shared: firebase.firestore.FieldValue.increment(qtdEmMB),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      docRef.set({
        shared: qtdEmMB,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }).catch(error => {
    console.error("Erro ao registrar uso diário:", error);
  });
}

  // Simula mineração
  function simulateMining() {
  if (!isMining) {
    console.log('Mineração não ativa, ignorando simulação.');
    return;
  }
  pktMined++;
  registrarUsoDiario(1); // cada execução simula 1 MB compartilhado
  console.log('Simulando mineração, pktMined:', pktMined);
  updateText();
}

  // Toggle modais
  function toggleModal(id) {
    console.log('Toggling modal:', id);
    const modal = document.getElementById(id);
    if (!modal) {
      console.error('Modal não encontrado:', id);
      return;
    }
    const isOpen = modal.style.display === 'flex';
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    if (!isOpen) {
      modal.style.display = 'flex';
    }
  }

  // Toggle FAQ
  function toggleFAQ() {
    console.log('Toggling FAQ');
    const faq = document.getElementById('faqSection');
    if (!faq) {
      console.error('Seção FAQ não encontrada');
      return;
    }
    faq.style.display = faq.style.display === 'none' || faq.style.display === '' ? 'block' : 'none';
    console.log('FAQ display:', faq.style.display);
  }

  // Atualiza tema
  function updateTheme() {
    console.log('Atualizando tema');
    document.body.style.backgroundColor = document.body.classList.contains('dark') ? '#1f2937' : '#f3f4f6';
    document.body.style.color = document.body.classList.contains('dark') ? '#f3f4f6' : '#1f2937';
    const cards = document.querySelectorAll('.modal-content, .faq');
    cards.forEach(card => {
      card.style.backgroundColor = document.body.classList.contains('dark') ? '#374151' : 'white';
    });
  }

  // Alternar tema
  function toggleTheme() {
    console.log('Alternando tema...');
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    console.log('Tema atual:', isDark ? 'dark' : 'light');
    localStorage.setItem('bigfootTheme', isDark ? 'dark' : 'light');
    updateTheme();
  }

  // Validação de e-mail
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && emailRegex.test(email);
  }

  // Login com Firebase
  function handleLogin(event) {
    console.log('Iniciando handleLogin...');
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const emailInput = document.getElementById('userEmail');
    const passwordInput = document.getElementById('userPassword');

    console.log('Elemento emailInput:', emailInput);
    console.dir(emailInput);
    console.log('Elemento passwordInput:', passwordInput);
    console.dir(passwordInput);

    if (!emailInput || !(emailInput instanceof HTMLInputElement)) {
      console.error('Campo de e-mail não encontrado ou não é um input válido');
      alert(currentLang === 'pt' ? 'Erro: Campo de e-mail não encontrado.' : 'Error: Email field not found.');
      return;
    }

    if (!passwordInput || !(passwordInput instanceof HTMLInputElement)) {
      console.error('Campo de senha não encontrado ou não é um input válido');
      alert(currentLang === 'pt' ? 'Erro: Campo de senha não encontrado.' : 'Error: Password field not found.');
      return;
    }

    const rawEmail = emailInput.value;
    const email = rawEmail ? rawEmail.trim() : '';
    const password = passwordInput.value;

    console.log('Valor bruto do e-mail:', JSON.stringify(rawEmail));
    console.log('Valor do e-mail após trim:', JSON.stringify(email));
    console.log('Tipo do e-mail:', typeof email);
    console.log('Valor da senha:', password ? '[HIDDEN]' : 'Nenhuma senha fornecida');

    if (!email || !password) {
      console.log('Campos de e-mail ou senha vazios');
      alert(currentLang === 'pt' ? 'Preencha o e-mail e a senha.' : 'Please fill in email and password.');
      return;
    }

    if (!isValidEmail(email)) {
      console.log('E-mail inválido:', JSON.stringify(email));
      alert(currentLang === 'pt' ? 'Por favor, insira um e-mail válido.' : 'Please enter a valid email.');
      return;
    }

    console.log('Tentando login com e-mail:', email);
    try {
      const { signInWithEmailAndPassword } = window.firebaseFns;
      signInWithEmailAndPassword(email, password)
  .then(userCredential => {
    console.log('Login bem-sucedido:', userCredential.user.email);
    if (window.electronAPI?.storeEmail) {
      window.electronAPI.storeEmail(userCredential.user.email);
    }
    console.log('Detalhes do usuário:', {
      uid: userCredential.user.uid,
      emailVerified: userCredential.user.emailVerified
    });
    isLoggedIn = true;
    toggleModal('loginModal');
    updateText();
  })

        .catch(error => {
          console.error('Erro ao entrar:', error.code, error.message);
          let message = currentLang === 'pt' ? 'Erro ao entrar. Verifique o e-mail e a senha.' : 'Login failed. Check email and password.';
          if (error.code === 'auth/invalid-email') {
            message = currentLang === 'pt' ? 'E-mail inválido.' : 'Invalid email.';
          } else if (error.code === 'auth/user-not-found') {
            message = currentLang === 'pt' ? 'Usuário não encontrado.' : 'User not found.';
          } else if (error.code === 'auth/wrong-password') {
            message = currentLang === 'pt' ? 'Senha incorreta.' : 'Incorrect password.';
          } else if (error.code === 'auth/too-many-requests') {
            message = currentLang === 'pt' ? 'Muitas tentativas. Tente novamente mais tarde.' : 'Too many attempts. Try again later.';
          } else if (error.code === 'auth/network-request-failed') {
            message = currentLang === 'pt' ? 'Falha na rede. Verifique sua conexão.' : 'Network error. Check your connection.';
          } else if (error.code === 'auth/user-disabled') {
            message = currentLang === 'pt' ? 'Conta desativada. Entre em contato com o suporte.' : 'Account disabled. Contact support.';
          } else if (error.code === 'auth/invalid-value-(email),-starting-an-object-on-a-scalar-field') {
            message = currentLang === 'pt' ? 'Formato de e-mail inválido. Verifique o e-mail inserido.' : 'Invalid email format. Check the email entered.';
          }
          alert(message);
        });
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      alert(currentLang === 'pt' ? 'Erro inesperado ao tentar entrar.' : 'Unexpected error during login.');
    }
  }

  // Logout com Firebase
  function handleLogout() {
    console.log('Tentando logout...');
    const { signOut } = window.firebaseFns;
    signOut(window.firebaseAuth)
      .then(() => {
        console.log('Logout bem-sucedido');
        isLoggedIn = false;
        isMining = false;
        pktMined = 0;
        if (window.electronAPI && window.electronAPI.toggleSharing) {
          window.electronAPI.toggleSharing(false);
        }
        updateText();
      })
      .catch(error => {
        console.error('Erro ao sair:', error.code, error.message);
        alert(currentLang === 'pt' ? 'Erro ao sair.' : 'Logout failed.');
      });
  }

  // Registro com Firebase e API externa
  async function handleRegister() {
    console.log('Tentando registro...');
    const emailInput = document.getElementById('userEmail');
    const passwordInput = document.getElementById('userPassword');

    console.log('Elemento emailInput:', emailInput);
    console.dir(emailInput);
    console.log('Elemento passwordInput:', passwordInput);
    console.dir(passwordInput);

    if (!emailInput || !(emailInput instanceof HTMLInputElement)) {
      console.error('Campo de e-mail não encontrado ou não é um input válido');
      alert(currentLang === 'pt' ? 'Erro: Campo de e-mail não encontrado.' : 'Error: Email field not found.');
      return;
    }

    if (!passwordInput || !(passwordInput instanceof HTMLInputElement)) {
      console.error('Campo de senha não encontrado ou não é um input válido');
      alert(currentLang === 'pt' ? 'Erro: Campo de senha não encontrado.' : 'Error: Password field not found.');
      return;
    }

    const rawEmail = emailInput.value;
    const email = rawEmail ? rawEmail.trim() : '';
    const password = passwordInput.value;

    console.log('Valor bruto do e-mail:', JSON.stringify(rawEmail));
    console.log('Valor do e-mail após trim:', JSON.stringify(email));
    console.log('Tipo do e-mail:', typeof email);
    console.log('Valor da senha:', password ? '[HIDDEN]' : 'Nenhuma senha fornecida');

    if (!email || !password) {
      console.log('Campos de e-mail ou senha vazios');
      alert(currentLang === 'pt' ? 'Preencha o e-mail e a senha.' : 'Please fill in email and password.');
      return;
    }

    if (!isValidEmail(email)) {
      console.log('E-mail inválido:', JSON.stringify(email));
      alert(currentLang === 'pt' ? 'Por favor, insira um e-mail válido.' : 'Please enter a valid email.');
      return;
    }

    console.log('Tentando registro com e-mail:', email);
    try {
      if (window.electronAPI && window.electronAPI.registerUser) {
        const result = await window.electronAPI.registerUser(email, password);
        if (result.success) {
          const { createUserWithEmailAndPassword } = window.firebaseFns;
          await createUserWithEmailAndPassword(email, password);
          console.log('Registro bem-sucedido:', email);
          isLoggedIn = true;
          toggleModal('loginModal');
          updateText();
          alert(currentLang === 'pt' ? 'Cadastro realizado com sucesso!' : 'Registration successful!');
        } else {
          console.error('Erro na API externa:', result.message);
          alert(result.message || (currentLang === 'pt' ? 'Erro ao cadastrar.' : 'Registration failed.'));
        }
      } else {
        console.error('API do Electron não disponível para registro');
        alert(currentLang === 'pt' ? 'Erro: API do Electron não disponível.' : 'Error: Electron API not available.');
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error.code, error.message);
      let message = currentLang === 'pt' ? 'Erro ao cadastrar. Tente outro e-mail.' : 'Registration failed. Try another email.';
      if (error.code === 'auth/email-already-in-use') {
        message = currentLang === 'pt' ? 'E-mail já cadastrado.' : 'Email already in use.';
      } else if (error.code === 'auth/invalid-email') {
        message = currentLang === 'pt' ? 'E-mail inválido.' : 'Invalid email.';
      } else if (error.code === 'auth/weak-password') {
        message = currentLang === 'pt' ? 'A senha deve ter pelo menos 6 caracteres.' : 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/network-request-failed') {
        message = currentLang === 'pt' ? 'Falha na rede. Verifique sua conexão.' : 'Network error. Check your connection.';
      }
      alert(message);
    }
  }

  // Salvar configurações
  function saveSettings() {
    console.log('Salvando configurações, idioma:', languageSelect.value);
    currentLang = languageSelect.value;
    localStorage.setItem('bigfootLang', currentLang);
    toggleModal('settingsModal');
    updateText();
  }

  // Configurar threads
  threadSelector.value = localStorage.getItem('bigfootThreads') || '4';
  threadSelector.addEventListener('change', () => {
    console.log('Threads selecionados:', threadSelector.value);
    localStorage.setItem('bigfootThreads', threadSelector.value);
  });

  // Evento do botão Conectar
  function handleConnect() {
    console.log('Botão Conectar clicado, isLoggedIn:', isLoggedIn, 'isMining:', isMining);
    if (!isLoggedIn) {
      alert(currentLang === 'pt' ? 'Por favor, faça login antes de conectar.' : 'Please log in before connecting.');
      return;
    }
    isMining = !isMining;
    const threads = parseInt(threadSelector.value, 10) || 4;
    if (window.electronAPI && window.electronAPI.startMiningWithThreads) {
      if (isMining) {
        console.log('Iniciando mineração com', threads, 'threads');
        window.electronAPI.startMiningWithThreads(threads);
      } else {
        console.log('Parando mineração');
        window.electronAPI.toggleSharing(false);
      }
    } else {
      console.error('API do Electron não disponível para mineração');
      alert(currentLang === 'pt' ? 'Erro: API do Electron não disponível.' : 'Error: Electron API not available.');
    }
    updateText();
  }

  // Evento do botão Dashboard
function openDashboard() {
  console.log('Abrindo dashboard externo...');
  if (window.electronAPI?.openDashboard) {
    window.electronAPI.openDashboard();
  } else {
    console.error('API openDashboard não disponível');
  }
}

  // Listeners para eventos do Electron
  if (window.electronAPI) {
    if (window.electronAPI.onSharingStatus) {
      window.electronAPI.onSharingStatus((status) => {
        console.log('Estado de compartilhamento recebido:', status);
        isMining = status;
        updateText();
      });
    } else {
      console.warn('API onSharingStatus não disponível');
    }

    if (window.electronAPI.onMinerLog) {
      window.electronAPI.onMinerLog((log) => {
        console.log('Log do minerador:', log);
      });
    } else {
      console.warn('API onMinerLog não disponível');
    }

    if (window.electronAPI.onMinerError) {
      window.electronAPI.onMinerError((error) => {
        console.error('Erro do minerador:', error);
        alert(currentLang === 'pt' ? `Erro: ${error}` : `Error: ${error}`);
      });
    } else {
      console.warn('API onMinerError não disponível');
    }
  } else {
    console.error('window.electronAPI não está definido');
    alert(currentLang === 'pt' ? 'Erro: Integração com Electron não disponível.' : 'Error: Electron integration not available.');
  }

  // Evento de conexão offline
  window.addEventListener('offline', () => {
    console.log('Conexão perdida');
    alert(currentLang === 'pt' ? 'Sem conexão com a internet.' : 'No internet connection.');
  });

  // Inicializa interface
  updateText();
});