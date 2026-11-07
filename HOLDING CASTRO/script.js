const toggleButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (toggleButton && navLinks) {
  toggleButton.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

const yearElement = document.getElementById('year');
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const form = document.querySelector('form');
if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const button = form.querySelector('button[type="submit"]');
    if (button) {
      const label = button.textContent;
      button.textContent = 'Mensagem enviada!';
      button.disabled = true;

      setTimeout(() => {
        button.textContent = label;
        button.disabled = false;
        form.reset();
      }, 2000);
    }
  });
}
