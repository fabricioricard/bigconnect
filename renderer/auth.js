let auth, db;

export function initializeFirebase() {
  const firebaseConfig = {
    apiKey: "AIzaSyAhziJbG5Pxg0UYvq784YH4zXpsdKfh7AY",
    authDomain: "bigfoot-connect.firebaseapp.com",
    projectId: "bigfoot-connect",
    storageBucket: "bigfoot-connect.appspot.com",
    messagingSenderId: "177999879162",
    appId: "1:177999879162:web:a1ea739930cac97475e243"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  auth = firebase.auth();
  db = firebase.firestore();

  console.log('✅ Firebase inicializado:', firebase.apps[0].name);
  return { auth, db };
}

export function setupAuth(auth, updateText, carregarUsoDiario, toggleModal) {
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      console.log('🔐 Persistência LOCAL configurada');
      auth.onAuthStateChanged((user) => {
        console.log(user ? `👤 Logado: ${user.email}` : '🚫 Deslogado');
        window.isLoggedIn = !!user;
        updateText();
        if (user) carregarUsoDiario();
      });
    })
    .catch(error => {
      console.error('❌ Persistência falhou:', error.code, error.message);
    });
}

export function handleLogin(event, currentLang, toggleModal, updateText) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const email = document.getElementById('userEmail')?.value.trim();
  const password = document.getElementById('userPassword')?.value;

  if (!email || !password) {
    alert(currentLang === 'pt' ? 'Preencha o e-mail e a senha.' : 'Please fill in email and password.');
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log('✅ Login:', userCredential.user.email);
      window.isLoggedIn = true;
      toggleModal('loginModal');
      updateText();

      if (window.electronAPI?.storeEmail) {
        window.electronAPI.storeEmail(userCredential.user.email);
      }
    })
    .catch((error) => {
      console.error('❌ Erro de login:', error.code, error.message);
      const messages = {
        'auth/invalid-email': currentLang === 'pt' ? 'E-mail inválido.' : 'Invalid email.',
        'auth/user-not-found': currentLang === 'pt' ? 'Usuário não encontrado.' : 'User not found.',
        'auth/wrong-password': currentLang === 'pt' ? 'Senha incorreta.' : 'Incorrect password.',
        'auth/too-many-requests': currentLang === 'pt' ? 'Muitas tentativas. Tente mais tarde.' : 'Too many attempts. Try again later.',
        'auth/network-request-failed': currentLang === 'pt' ? 'Erro de rede.' : 'Network error.',
        'auth/user-disabled': currentLang === 'pt' ? 'Conta desativada.' : 'Account disabled.'
      };
      alert(messages[error.code] || 'Erro ao entrar.');
    });
}

export function handleLogout(updateText) {
  auth.signOut()
    .then(() => {
      console.log('🔒 Logout concluído');
      window.isLoggedIn = false;
      window.isMining = false;
      window.pktMined = 0;

      if (window.electronAPI?.toggleSharing) {
        window.electronAPI.toggleSharing(false);
      }

      updateText();
    })
    .catch((error) => {
      console.error('❌ Erro no logout:', error.code, error.message);
      alert('Erro ao sair.');
    });
}

export async function handleRegister(currentLang, toggleModal, updateText) {
  const email = document.getElementById('userEmail')?.value.trim();
  const password = document.getElementById('userPassword')?.value;

  if (!email || !password) {
    alert(currentLang === 'pt' ? 'Preencha o e-mail e a senha.' : 'Please fill in email and password.');
    return;
  }

  if (!isValidEmail(email)) {
    alert(currentLang === 'pt' ? 'E-mail inválido.' : 'Invalid email.');
    return;
  }

  try {
    const result = await window.electronAPI?.registerUser(email, password);
    if (!result?.success) {
      alert(result?.message || 'Erro ao cadastrar.');
      return;
    }

    await auth.createUserWithEmailAndPassword(email, password);
    console.log('✅ Registro concluído:', email);

    window.isLoggedIn = true;
    toggleModal('loginModal');
    updateText();
    alert(currentLang === 'pt' ? 'Cadastro realizado com sucesso!' : 'Registration successful!');
  } catch (error) {
    console.error('❌ Erro ao registrar:', error.code, error.message);
    const messages = {
      'auth/email-already-in-use': currentLang === 'pt' ? 'E-mail já cadastrado.' : 'Email already in use.',
      'auth/invalid-email': currentLang === 'pt' ? 'E-mail inválido.' : 'Invalid email.',
      'auth/weak-password': currentLang === 'pt' ? 'Senha fraca (mínimo 6 caracteres).' : 'Weak password.',
      'auth/network-request-failed': currentLang === 'pt' ? 'Erro de rede.' : 'Network error.'
    };
    alert(messages[error.code] || 'Erro ao cadastrar.');
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email);
}
