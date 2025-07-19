export const translations = {
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
    registerBtn: "Cadastrar",
    greeting: "Olá, ",
    usageGraphTitle: "Histórico de Compartilhamento",
    toggleGraph: "Ocultar Gráfico",
    showGraph: "Mostrar Gráfico"
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
    registerBtn: "Register",
    greeting: "Hello, ",
    usageGraphTitle: "Sharing History",
    toggleGraph: "Hide Graph",
    showGraph: "Show Graph"
  }
};

export let currentLang = localStorage.getItem('bigfootLang') || 'pt';

export function setLanguage(lang) {
  console.log('Salvando idioma:', lang);
  currentLang = lang;
  localStorage.setItem('bigfootLang', currentLang);
}

export function updateThreadOptionsLanguage(threadSelector) {
  console.log('Atualizando opções de threads, idioma:', currentLang);
  const options = threadSelector.querySelectorAll('option');
  options.forEach(option => {
    const label = currentLang === 'en' ? option.dataset.en : option.dataset.pt;
    const emoji = option.textContent.match(/^[^\s]+/);
    option.textContent = `${emoji ? emoji[0] + ' ' : ''}${label}`;
  });
}