export function initializeChart(currentLang, translations) {
  let usageChart;
  let userInteractedWithGraph = false;

  const usageGraph = document.querySelector('.usage-graph');
  const toggleGraphBtn = document.getElementById('toggleGraphBtn');
  const usageCtx = document.getElementById('usageChart')?.getContext('2d');

  if (!usageCtx) {
    console.error('Elemento <canvas id="usageChart"> não encontrado ou contexto 2D inválido.');
    alert(currentLang === 'pt' ? 'Erro: Canvas do gráfico não encontrado.' : 'Error: Graph canvas not found.');
    return null;
  }

  if (typeof Chart === 'undefined') {
    console.error('Chart.js não foi carregado.');
    alert(currentLang === 'pt' ? 'Erro: Chart.js não carregado.' : 'Error: Chart.js not loaded.');
    return null;
  }

  console.log('Canvas usageChart encontrado, inicializando Chart.js');
  try {
    usageChart = new Chart(usageCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: translations[currentLang].usageGraphTitle,
          data: [],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: currentLang === 'pt' ? 'MB Compartilhados' : 'MB Shared'
            }
          },
          x: {
            title: {
              display: true,
              text: currentLang === 'pt' ? 'Data' : 'Date'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });
    console.log('Gráfico inicializado com sucesso:', usageChart);
    setTimeout(() => {
      usageChart.resize();
      usageChart.update();
      console.log('Gráfico redesenhado após inicialização');
    }, 100);
  } catch (error) {
    console.error('Erro ao inicializar Chart.js:', error.message, error.stack);
    alert(currentLang === 'pt' ? 'Erro ao inicializar o gráfico.' : 'Error initializing chart.');
    return null;
  }

  if (usageGraph && toggleGraphBtn) {
    // Definir estado inicial baseado no localStorage
    const graphHidden = localStorage.getItem('graphHidden') === 'true';
    usageGraph.classList.toggle('show', !graphHidden);
    toggleGraphBtn.textContent = graphHidden ? translations[currentLang].showGraph : translations[currentLang].toggleGraph;
    toggleGraphBtn.setAttribute('aria-label', graphHidden ? translations[currentLang].showGraph : translations[currentLang].toggleGraph);
    console.log('Gráfico configurado com estado inicial:', !graphHidden);

    toggleGraphBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      userInteractedWithGraph = true;
      console.log('Botão toggleGraphBtn clicado, estado antes:', usageGraph.classList.contains('show') ? 'Visível' : 'Oculto');
      usageGraph.classList.toggle('show');
      const isVisible = usageGraph.classList.contains('show');
      toggleGraphBtn.textContent = isVisible ? translations[currentLang].toggleGraph : translations[currentLang].showGraph;
      toggleGraphBtn.setAttribute('aria-label', isVisible ? translations[currentLang].toggleGraph : translations[currentLang].showGraph);
      localStorage.setItem('graphHidden', !isVisible);
      console.log('Estado do gráfico salvo:', localStorage.getItem('graphHidden'));

      // Atualizar o gráfico apenas se visível
      if (usageChart) {
        setTimeout(() => {
          usageChart.resize();
          usageChart.update();
          console.log('Gráfico redesenhado após alternância:', isVisible ? 'Visível' : 'Oculto');
        }, 100);
      }
    });
  } else {
    console.error('Elementos toggleGraphBtn ou usageGraph não encontrados:', { toggleGraphBtn, usageGraph });
  }

  return usageChart;
}

export function updateChartData(usageChart, db, currentLang, translations) {
  const user = firebase.auth().currentUser;
  if (!user || !usageChart) {
    console.log('Saindo de updateChartData: usuário ou usageChart não disponível');
    if (!usageChart) {
      console.error('Gráfico não inicializado.');
    }
    return;
  }

  console.log('Acessando Firestore para UID:', user.uid);
  db.collection("users")
    .doc(user.uid)
    .collection("dailyUsage")
    .orderBy("updatedAt", "desc")
    .limit(7)
    .get()
    .then(snapshot => {
      console.log('Dados do Firestore recebidos, documentos:', snapshot.size);
      let dados = [];
      if (snapshot.empty) {
        console.log('Nenhum documento encontrado, criando inicial');
        const hoje = new Date().toISOString().split('T')[0];
        return db.collection("users")
          .doc(user.uid)
          .collection("dailyUsage")
          .doc(hoje)
          .set({
            shared: 0,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          })
          .then(() => {
            console.log('Documento inicial criado para data:', hoje);
            dados = [{ date: hoje, amount: 0 }];
            return dados;
          });
      }
      snapshot.forEach(doc => {
        const data = doc.id;
        const shared = doc.data().shared || 0;
        console.log(`Documento - Data: ${data}, Shared: ${shared}`);
        dados.unshift({ date: data, amount: shared });
      });
      return dados;
    })
    .then(dados => {
      console.log('Dados para o gráfico:', dados);
      if (dados.length === 0) {
        dados = [{ date: new Date().toISOString().split('T')[0], amount: 0 }];
      }
      usageChart.data.labels = dados.map(d => d.date);
      usageChart.data.datasets[0].data = dados.map(d => d.amount);
      usageChart.data.datasets[0].label = translations[currentLang].usageGraphTitle;
      if (document.querySelector('.usage-graph').classList.contains('show')) {
        setTimeout(() => {
          usageChart.resize();
          usageChart.update();
          console.log('Gráfico atualizado com dados:', usageChart.data.labels);
        }, 100);
      }
    })
    .catch(error => {
      console.error('Erro ao carregar uso diário:', error.code, error.message);
      alert(currentLang === 'pt'
        ? 'Erro ao carregar histórico de uso.'
        : 'Error loading usage history.');
    });
}

export function registrarUsoDiario(db, qtdEmMB) {
  const user = firebase.auth().currentUser;
  if (!user) {
    console.log('registrarUsoDiario: Nenhum usuário logado');
    return;
  }
  console.log('Registrando uso diário para UID:', user.uid, 'Quantidade:', qtdEmMB);
  const hoje = new Date().toISOString().split('T')[0];
  const docRef = db.collection("users").doc(user.uid).collection("dailyUsage").doc(hoje);
  docRef.get().then(docSnapshot => {
    if (docSnapshot.exists) {
      docRef.update({
        shared: firebase.firestore.FieldValue.increment(qtdEmMB),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => console.log('Uso diário atualizado para data:', hoje));
    } else {
      docRef.set({
        shared: qtdEmMB,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => console.log('Uso diário criado para data:', hoje));
    }
  }).catch(error => {
    console.error('Erro ao registrar uso diário:', error.code, error.message);
  });
}