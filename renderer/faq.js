export const faqContent = {
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

export function renderFAQ(currentLang, faqSection) {
  console.log('Renderizando FAQ, idioma:', currentLang);
  if (!faqSection) {
    console.error('Elemento faqSection não encontrado');
    return;
  }

  const faqList = faqContent[currentLang] || faqContent.pt;
  const openStates = Array.from(faqSection.querySelectorAll('details')).map(det => det.open);

  faqSection.innerHTML = '';
  faqList.forEach(({ question, answer }, index) => {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = question;
    const p = document.createElement('p');
    p.textContent = answer;
    details.appendChild(summary);
    details.appendChild(p);
    faqSection.appendChild(details);
    if (openStates[index]) details.open = true;
  });
}