/* ================================================
   AI Resume Analyzer — script.js
   Shared JS for all pages
   ================================================ */

/* ================================================
   1. CUSTOM CURSOR
   ================================================ */
(function initCursor() {
  const ring = document.getElementById('cursor-ring');
  const dot = document.getElementById('cursor-dot');
  if (!ring || !dot) return;

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  let isTouchDevice = false;

  // Touch device detection to disable custom cursor
  window.addEventListener('touchstart', function onFirstTouch() {
    isTouchDevice = true;
    dot.style.display = 'none';
    ring.style.display = 'none';
    document.body.style.cursor = 'default';
    window.removeEventListener('touchstart', onFirstTouch);
  }, { passive: true });

  document.addEventListener('mousemove', (e) => {
    if (isTouchDevice) return;
    mouseX = e.clientX;
    mouseY = e.clientY;
    // Dot follows immediately for precision
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  });

  (function animateRing() {
    if (!isTouchDevice) {
      // Smooth lerp (0.2) for a fluid "liquid" feel
      ringX += (mouseX - ringX) * 0.2;
      ringY += (mouseY - ringY) * 0.2;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
    }
    requestAnimationFrame(animateRing);
  })();

  // Click Animation: Pulse feedback
  document.addEventListener('mousedown', () => {
    if (!isTouchDevice) document.body.classList.add('cursor-active');
  });
  document.addEventListener('mouseup', () => {
    if (!isTouchDevice) document.body.classList.remove('cursor-active');
  });

  // Hover state detection
  const hoverSelectors = 'a, button, input, textarea, select, label, .output-header, [data-hover]';
  document.addEventListener('mouseover', (e) => {
    if (!isTouchDevice && e.target.closest(hoverSelectors)) {
      document.body.classList.add('cursor-hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (!isTouchDevice && e.target.closest(hoverSelectors)) {
      document.body.classList.remove('cursor-hover');
    }
  });
})();

/* ================================================
   2. DARK / LIGHT MODE TOGGLE
   ================================================ */
/*
   HOW THE THEME SYSTEM WORKS:
   - We store 'dark' or 'light' in localStorage under 'ra_theme'
   - We add/remove the class 'light-mode' on <body>
   - CSS variables are overridden under body.light-mode { ... }
   - initThemeToggle() is called ONCE globally in DOMContentLoaded
   - Page-specific inits do NOT call it — avoids double event listeners
*/
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  // Apply the saved (or default dark) theme first
  const savedTheme = localStorage.getItem('ra_theme') || 'dark';
  applyTheme(savedTheme);

  // BUG FIX: only attach ONE click listener here.
  // Previously initThemeToggle() was also called inside each page init
  // (initLoginPage, initSignupPage, initProfilePage, initDashboard),
  // which caused TWO listeners on the button. One click toggled the class
  // on, and the second listener immediately toggled it off — net result: nothing.
  toggleBtn.addEventListener('click', () => {
    // Check current state by reading the class, not a variable
    const isLight = document.body.classList.contains('light-mode');
    const next = isLight ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('ra_theme', next);
  });
}

/**
 * applyTheme(theme)
 * Adds or removes 'light-mode' on <body> and updates button text.
 * Called on page load AND every time the toggle is clicked.
 */
function applyTheme(theme) {
  const toggleBtn = document.getElementById('theme-toggle');
  if (theme === 'light') {
    document.body.classList.add('light-mode');      // triggers body.light-mode CSS overrides
    if (toggleBtn) toggleBtn.textContent = 'Dark Mode';
  } else {
    document.body.classList.remove('light-mode');   // back to default dark variables
    if (toggleBtn) toggleBtn.textContent = 'Light Mode';
  }
}

// Apply saved theme immediately on script load (before DOMContentLoaded)
// This prevents a flash of wrong theme on page reload
(function () {
  const savedTheme = localStorage.getItem('ra_theme') || 'dark';
  if (savedTheme === 'light') document.body.classList.add('light-mode');
})();

/* ================================================
   3. TOAST NOTIFICATION
   ================================================ */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Auto remove after 3s
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/* ================================================
   4. AUTHENTICATION (Connected to Flask + MongoDB)
   ================================================ */

const API_BASE_URL = "/api";

/** Returns array of all registered users */
function getUsers() {
  return JSON.parse(localStorage.getItem('ra_users') || '[]');
}

/** Saves user array */
function saveUsers(users) {
  localStorage.setItem('ra_users', JSON.stringify(users));
}

/** Returns currently logged-in user email */
function getSession() {
  return localStorage.getItem('ra_session');
}

/** Sets logged-in session */
function setSession(email) {
  localStorage.setItem('ra_session', email);
}

/** Clears session and redirects to login */
function logout() {
  localStorage.removeItem('ra_session');
  window.location.href = '/';
}

/** Requires login — redirect if not logged in */
function requireLogin() {
  if (!getSession()) {
    window.location.href = '/';
  }
}

/** Returns user object by email */
function getUserByEmail(email) {
  return getUsers().find(u => u.email === email) || null;
}

/* ---- Login form handler ---- */
async function initLoginPage() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  if (getSession()) {
    window.location.href = '/dashboard';
    return;
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        errEl.textContent = result.error || 'Invalid email or password.';
        errEl.classList.add('show');
        return;
      }

      errEl.classList.remove('show');
      setSession(email);
      showToast('Logged in successfully!', 'success');

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      errEl.textContent = 'Server connection failed. Please try again later.';
      errEl.classList.add('show');
    }
  });
}

/* ---- Signup form handler ---- */
async function initSignupPage() {
  const signupForm = document.getElementById('signup-form');
  if (!signupForm) return;

  if (getSession()) {
    window.location.href = '/dashboard';
    return;
  }

  signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const errEl = document.getElementById('signup-error');

    if (password !== confirm) {
      errEl.textContent = 'Passwords do not match.';
      errEl.classList.add('show');
      return;
    }

    if (password.length < 6) {
      errEl.textContent = 'Password must be at least 6 characters.';
      errEl.classList.add('show');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        errEl.textContent = result.error || 'Signup failed. Please try again.';
        errEl.classList.add('show');
        return;
      }

      setSession(email);
      showToast('Account created! Set up your profile.', 'success');
      setTimeout(() => {
        window.location.href = '/profile-setup';
      }, 500);
    } catch (error) {
      console.error('Signup error:', error);
      errEl.textContent = 'Server connection failed. Please try again later.';
      errEl.classList.add('show');
    }
  });
}

/* ================================================
   5. PROFILE PAGE
   ================================================ */

/** Returns profile data for logged-in user */
function getProfile(email) {
  const profiles = JSON.parse(localStorage.getItem('ra_profiles') || '{}');
  return profiles[email] || null;
}

/** Saves profile data */
function saveProfile(email, data) {
  const profiles = JSON.parse(localStorage.getItem('ra_profiles') || '{}');
  profiles[email] = data;
  localStorage.setItem('ra_profiles', JSON.stringify(profiles));
}

/* ================================================
   6. DASHBOARD
   ================================================ */
function initDashboard() {
  if (!document.getElementById('dashboard-root')) return;
  requireLogin();

  const email = getSession();
  const profile = getProfile(email);
  const user = getUserByEmail(email);

  // Populate user info in navbar
  const displayName = (profile && profile.name) || (user && user.name) || 'User';
  const navName = document.getElementById('nav-username');
  if (navName) navName.textContent = displayName;

  const navAvatar = document.getElementById('nav-avatar');
  if (navAvatar) {
    if (profile && profile.avatar) {
      navAvatar.innerHTML = `<img src="${profile.avatar}" alt="Avatar">`;
    } else {
      navAvatar.textContent = displayName[0].toUpperCase();
    }
  }

  // Profile summary card
  const summaryName = document.getElementById('summary-name');
  const summaryEmail = document.getElementById('summary-email');
  const summaryDegree = document.getElementById('summary-degree');
  const summaryAvatar = document.getElementById('summary-avatar');

  if (summaryName) summaryName.textContent = displayName;
  if (summaryEmail) summaryEmail.textContent = email;
  if (summaryDegree) summaryDegree.textContent = (profile && profile['p-degree']) ? profile['p-degree'] : 'No degree set';

  if (summaryAvatar) {
    if (profile && profile.avatar) {
      summaryAvatar.innerHTML = `<img src="${profile.avatar}" alt="Avatar">`;
    } else {
      summaryAvatar.textContent = displayName[0].toUpperCase();
    }
  }

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
    });
  }

  // NOTE: initThemeToggle() removed from here — called once globally.
  initResumeInput();
  initAnalyze();
  initCollapsible();
}

/* ---- Resume Input tabs ---- */
function initResumeInput() {
  const pasteTab = document.getElementById('tab-paste');
  const uploadTab = document.getElementById('tab-upload');
  const pastePane = document.getElementById('pane-paste');
  const uploadPane = document.getElementById('pane-upload');

  if (!pasteTab) return;

  pasteTab.addEventListener('click', () => {
    pasteTab.classList.add('active');
    uploadTab.classList.remove('active');
    pastePane.style.display = 'block';
    uploadPane.style.display = 'none';
  });

  uploadTab.addEventListener('click', () => {
    uploadTab.classList.add('active');
    pasteTab.classList.remove('active');
    uploadPane.style.display = 'block';
    pastePane.style.display = 'none';
  });

  // File upload
  const fileInput = document.getElementById('resume-file');
  const uploadZone = document.getElementById('upload-zone');
  const fileStatus = document.getElementById('file-status');

  if (fileInput) {
    fileInput.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      handleFileRead(file, fileStatus);
    });
  }

  // Drag & drop
  if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) {
        fileInput.files = e.dataTransfer.files;
        handleFileRead(file, fileStatus);
      }
    });
    uploadZone.addEventListener('click', () => fileInput.click());
  }
}

/** FileReader: reads TXT; for PDF/DOC shows guidance */
async function handleFileRead(file, statusEl) {
  console.log(`[File System] Processing started: ${file.name} (${file.size} bytes)`);

  const ext = file.name.split('.').pop().toLowerCase();
  const outEl = document.getElementById('extracted-text');
  const email = getSession() || 'anonymous';

  if (outEl) outEl.value = ''; // Clear previous

  if (ext === 'txt') {
    const reader = new FileReader();
    reader.onload = function (e) {
      if (outEl) outEl.value = e.target.result;
      if (statusEl) {
        statusEl.textContent = `File loaded: ${file.name}`;
        statusEl.style.color = 'var(--success)';
      }
      showToast('TXT file loaded and ready.', 'success');
    };
    reader.readAsText(file);
  } else if (ext === 'pdf' || ext === 'doc' || ext === 'docx') {
    if (statusEl) {
      statusEl.textContent = `Uploading and extracting ${file.name}...`;
      statusEl.style.color = 'var(--info)';
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', email);

      const response = await fetch(`${API_BASE_URL}/upload-resume`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      if (outEl) outEl.value = result.extracted_text;
      if (statusEl) {
        statusEl.textContent = `Extracted from: ${file.name}`;
        statusEl.style.color = 'var(--success)';
      }
      showToast('Resume uploaded and text extracted successfully!', 'success');

    } catch (error) {
      console.error('Upload error:', error);
      if (statusEl) {
        statusEl.textContent = `Error: ${error.message}`;
        statusEl.style.color = 'var(--danger)';
      }
      showToast('Could not extract text. Check if the server is running.', 'error');
    }
  } else {
    console.warn(`[File System] Unsupported file type: ${ext}`);
    if (statusEl) {
      statusEl.textContent = 'Unsupported file type. Please use TXT, PDF, or DOCX.';
      statusEl.style.color = 'var(--danger)';
    }
  }
}

/* ================================================
   7. AI SIMULATION ENGINE
   ================================================ */

const ACTION_VERBS = [
  'Engineered', 'Architected', 'Developed', 'Implemented', 'Designed', 'Built', 'Launched',
  'Optimized', 'Streamlined', 'Automated', 'Led', 'Managed', 'Coordinated', 'Delivered',
  'Collaborated', 'Mentored', 'Leveraged', 'Enhanced', 'Reduced', 'Increased', 'Deployed',
  'Integrated', 'Maintained', 'Migrated', 'Refactored', 'Analyzed', 'Monitored', 'Resolved',
  'Created', 'Improved', 'Transformed', 'Spearheaded', 'Directed', 'Established', 'Scaled'
];

const SKILL_MAP = {
  'Frontend Developer': {
    expected: ['HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'Angular', 'TypeScript', 'Responsive Design', 'REST API', 'Git', 'Webpack', 'Accessibility', 'Testing', 'Figma', 'CSS Frameworks'],
  },
  'Backend Developer': {
    expected: ['Node.js', 'Python', 'Java', 'Go', 'REST API', 'GraphQL', 'SQL', 'NoSQL', 'Docker', 'Kubernetes', 'CI/CD', 'Microservices', 'Authentication', 'Cloud', 'Git'],
  },
  'Full Stack Developer': {
    expected: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'SQL', 'NoSQL', 'REST API', 'Git', 'Docker', 'TypeScript', 'Testing', 'Deployment', 'CI/CD', 'Cloud'],
  },
  'Data Scientist': {
    expected: ['Python', 'R', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Data Visualization', 'SQL', 'Statistics', 'Feature Engineering', 'NLP', 'Model Deployment', 'A/B Testing'],
  },
  'UI/UX Designer': {
    expected: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research', 'Wireframing', 'Usability Testing', 'Design Systems', 'Typography', 'Color Theory', 'Information Architecture', 'Accessibility', 'CSS', 'Photoshop', 'Illustrator'],
  },
  'DevOps Engineer': {
    expected: ['Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'AWS', 'GCP', 'Azure', 'Terraform', 'Ansible', 'Linux', 'Bash', 'Monitoring', 'Git', 'Networking', 'Security'],
  },
  'Machine Learning Engineer': {
    expected: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'MLOps', 'Docker', 'Model Training', 'Feature Engineering', 'Data Pipelines', 'SQL', 'Cloud', 'Statistics', 'NLP', 'Computer Vision', 'Git'],
  },
  'Project Manager': {
    expected: ['Agile', 'Scrum', 'Jira', 'Risk Management', 'Stakeholder Management', 'Budgeting', 'MS Project', 'Communication', 'Leadership', 'KPI Tracking', 'Documentation', 'Gantt Charts', 'PRINCE2', 'PMP', 'Team Management'],
  },
};

/** Extract resume text from paste or extracted-text field */
function getResumeText() {
  const activePaste = document.getElementById('pane-paste').style.display !== 'none';
  if (activePaste) {
    return document.getElementById('resume-text').value.trim();
  }
  return document.getElementById('extracted-text').value.trim();
}

/** Detect skills present in resume */
function detectPresentSkills(text, role) {
  const skillList = SKILL_MAP[role] ? SKILL_MAP[role].expected : SKILL_MAP['Full Stack Developer'].expected;
  const textLower = text.toLowerCase();
  const present = skillList.filter(s => textLower.includes(s.toLowerCase()));
  const missing = skillList.filter(s => !textLower.includes(s.toLowerCase()));
  return { present, missing };
}

/** Improve bullet points by prepending/replacing with action verbs */
function improveBullets(text) {
  const lines = text.split('\n');
  const improved = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d\./)) {
      // Strip leading bullet
      let content = trimmed.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '');
      // Remove existing weak starting verbs
      const weakVerbs = /^(worked on|helped|did|assisted|was responsible for|made|tried|used|had|got)/i;
      content = content.replace(weakVerbs, '');
      content = content.charAt(0).toUpperCase() + content.slice(1);
      // Pick a random action verb
      const verb = ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)];
      improved.push(`- ${verb} ${content}`);
    } else {
      improved.push(line);
    }
  });
  return improved.join('\n');
}

/** Rule-based grammar/clarity suggestions */
function generateSuggestions(text) {
  const suggestions = [];

  if (text.length < 300)
    suggestions.push({ type: 'warn', text: 'Your resume appears short. Aim for at least 400 words to adequately represent your experience.' });
  if (!text.match(/\d+/))
    suggestions.push({ type: 'warn', text: 'Add quantifiable metrics (e.g., "Reduced load time by 40%") to strengthen impact.' });
  if (text.toLowerCase().includes('responsible for'))
    suggestions.push({ type: 'improve', text: 'Replace "responsible for" with a strong action verb (e.g., "Led", "Managed", "Delivered").' });
  if (text.toLowerCase().includes('helped'))
    suggestions.push({ type: 'improve', text: 'Replace "helped" with a specific contribution verb like "Contributed", "Facilitated", or "Collaborated".' });
  if (!text.toLowerCase().includes('github') && !text.toLowerCase().includes('portfolio') && !text.toLowerCase().includes('linkedin'))
    suggestions.push({ type: 'info', text: 'Include links to your GitHub, portfolio, or LinkedIn profile for credibility.' });
  if (text.toLowerCase().includes('etc.') || text.toLowerCase().includes('and so on'))
    suggestions.push({ type: 'improve', text: 'Avoid vague fillers like "etc." — list all relevant items explicitly.' });
  if (text.split('\n').length < 15)
    suggestions.push({ type: 'warn', text: 'Your resume has very few lines. Consider expanding on your roles, responsibilities, and achievements.' });
  if (!text.toLowerCase().includes('skill'))
    suggestions.push({ type: 'warn', text: 'A dedicated Skills section was not detected. Add a clear Skills section for ATS compatibility.' });
  if (!text.toLowerCase().includes('education'))
    suggestions.push({ type: 'warn', text: 'An Education section was not detected. Include your academic background.' });
  if (!text.toLowerCase().includes('experience') && !text.toLowerCase().includes('work'))
    suggestions.push({ type: 'warn', text: 'An Experience section was not detected. Add your work history or projects.' });
  if (text.toLowerCase().includes('team player') || text.toLowerCase().includes('hard worker'))
    suggestions.push({ type: 'improve', text: 'Replace generic phrases like "team player" or "hard worker" with specific examples that demonstrate those qualities.' });

  if (suggestions.length === 0)
    suggestions.push({ type: 'good', text: 'Overall writing is clear and structured. Minor polish may improve readability.' });

  return suggestions;
}

/** Section-wise feedback */
function generateSectionFeedback(text) {
  const sections = [];
  const lower = text.toLowerCase();

  // Education
  if (lower.includes('education') || lower.includes('degree') || lower.includes('university') || lower.includes('college')) {
    sections.push({ type: 'good', text: 'Education section detected. Ensure degree name, institution, and graduation year are present.' });
  } else {
    sections.push({ type: 'warn', text: 'Education section not found. Add your academic credentials clearly.' });
  }

  // Experience
  if (lower.includes('experience') || lower.includes('work') || lower.includes('job')) {
    sections.push({ type: 'good', text: 'Work Experience section detected. Quantify achievements where possible.' });
  } else {
    sections.push({ type: 'warn', text: 'No Experience section found. Include at least internships or personal projects.' });
  }

  // Skills
  if (lower.includes('skill') || lower.includes('technologies') || lower.includes('tools')) {
    sections.push({ type: 'good', text: 'Skills section detected. Keep it concise and relevant to the target role.' });
  } else {
    sections.push({ type: 'warn', text: 'Skills section not found. A clear skills list is critical for ATS systems.' });
  }

  // Projects
  if (lower.includes('project')) {
    sections.push({ type: 'good', text: 'Projects section detected. Describe the problem, solution, and impact for each project.' });
  } else {
    sections.push({ type: 'info', text: 'Consider adding a Projects section to showcase practical work, especially if experience is limited.' });
  }

  // Summary
  if (lower.includes('summary') || lower.includes('objective') || lower.includes('about')) {
    sections.push({ type: 'good', text: 'Professional Summary detected. Keep it to 2–3 sentences highlighting your top value proposition.' });
  } else {
    sections.push({ type: 'improve', text: 'Add a Professional Summary at the top — a 2–3 line pitch about your expertise and goals.' });
  }

  return sections;
}

/** Generate LinkedIn summary */
function generateLinkedIn(text, role, displayName) {
  const name = displayName || 'I';
  const verbs = ['passionate about', 'experienced in', 'skilled in', 'focused on', 'specialized in'];
  const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];

  // Try to extract a skill or keyword from text
  const lines = text.split('\n').filter(l => l.trim().length > 5);
  const sample = lines.slice(0, 8).join(' ');

  const templates = [
    `${name} am a results-driven ${role} ${randomVerb} building high-impact solutions. With hands-on experience in software development and a problem-first mindset, I bring technical depth and collaborative energy to every team I join. I thrive in fast-paced environments where I can turn complex challenges into elegant, scalable answers.`,
    `As a dedicated ${role}, I combine technical expertise with a passion for continuous learning. I have experience delivering reliable, user-focused solutions and I am committed to writing clean, maintainable code. Open to connecting with engineers, recruiters, and innovators shaping the future of technology.`,
    `I am a ${role} who believes great work happens at the intersection of skill and curiosity. Whether it is architecting backend systems, fine-tuning front-end interactions, or collaborating cross-functionally, I bring value at every stage of the product lifecycle. Let us connect and build something meaningful.`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

/** Generate interview questions */
function generateInterviewQuestions(text, role) {
  const lower = text.toLowerCase();

  const hrQuestions = [
    `Tell me about yourself and your journey as a ${role}.`,
    'Where do you see yourself professionally in the next 3 to 5 years?',
    'What motivates you to pursue this role?',
    'Describe a time you handled significant pressure or a tight deadline.',
    'Why are you leaving your current or most recent position?',
    'What does your ideal work environment look like?',
  ];

  const technicalBase = {
    'Frontend Developer': ['Explain the concept of the virtual DOM and how React uses it.', 'What is CSS specificity and how do you resolve conflicts?', 'Describe the difference between null and undefined in JavaScript.', 'How do you optimize a web application for performance?', 'What are closures in JavaScript and when would you use them?'],
    'Backend Developer': ['Explain RESTful API design principles.', 'How do you handle authentication and authorization securely?', 'What is the difference between SQL and NoSQL databases?', 'Describe how you would design a scalable microservices architecture.', 'How do you handle race conditions in concurrent systems?'],
    'Full Stack Developer': ['How do you manage state across front-end and back-end?', 'Walk me through building a CRUD application end to end.', 'How do you approach API versioning?', 'Describe your approach to securing a full-stack application.', 'What is the role of caching in a full-stack app?'],
    'Data Scientist': ['Explain the bias-variance tradeoff.', 'How do you handle class imbalance in a dataset?', 'What evaluation metrics would you use for a classification problem?', 'Walk me through your feature engineering process.', 'How do you deploy a machine learning model to production?'],
    'UI/UX Designer': ['How do you approach user research for a new product feature?', 'Describe your design process from ideation to delivery.', 'How do you balance aesthetic design with usability?', 'Walk me through a design decision you made based on user feedback.', 'How do you measure the success of a UX design?'],
    'DevOps Engineer': ['What is the difference between Docker and Kubernetes?', 'How do you implement a CI/CD pipeline from scratch?', 'How do you handle secret management in a cloud environment?', 'Describe your approach to monitoring and alerting.', 'What is Infrastructure as Code and why is it important?'],
    'Machine Learning Engineer': ['How do you prevent overfitting in a neural network?', 'What is the difference between supervised and unsupervised learning?', 'Describe how you would build an end-to-end ML pipeline.', 'How do you evaluate the performance of a regression model?', 'What is transfer learning and when would you use it?'],
    'Project Manager': ['How do you handle scope creep during a project?', 'Describe your approach to stakeholder communication.', 'How do you prioritize competing project requirements?', 'What metrics do you use to measure project health?', 'Walk me through how you managed a difficult team situation.'],
  };

  const behavioralQuestions = [
    'Tell me about a time you disagreed with a colleague and how you resolved it.',
    'Describe a situation where you had to learn a new technology quickly.',
    'Give an example of a project you are most proud of and your specific contribution.',
    'Tell me about a time you received critical feedback and how you responded.',
    'Describe a situation where you proactively identified and solved a problem before it escalated.',
    'How do you manage your workload when handling multiple tasks simultaneously?',
  ];

  const tech = technicalBase[role] || technicalBase['Full Stack Developer'];

  // Personalize based on resume keywords
  const personalizedTech = [...tech];
  if (lower.includes('python')) personalizedTech.push('You mentioned Python on your resume. Describe a complex Python project you built and what design patterns you applied.');
  if (lower.includes('react')) personalizedTech.push('Walk me through how you manage state in a large-scale React application.');
  if (lower.includes('sql')) personalizedTech.push('Describe a complex SQL query you wrote and the problem it solved.');
  if (lower.includes('docker')) personalizedTech.push('How have you used Docker in a real project? Describe any challenges you encountered.');
  if (lower.includes('node')) personalizedTech.push('How do you handle asynchronous operations and error handling in Node.js?');
  if (lower.includes('machine learning') || lower.includes('ml'))
    personalizedTech.push('Describe an ML model you built from scratch, including data preprocessing and evaluation.');

  return {
    hr: hrQuestions.slice(0, 4),
    technical: personalizedTech.slice(0, 5),
    behavioral: behavioralQuestions.slice(0, 4),
  };
}

/* ================================================
   8. ANALYZE BUTTON + RENDER OUTPUT
   ================================================ */
function initAnalyze() {
  const analyzeBtn = document.getElementById('analyze-btn');
  if (!analyzeBtn) return;

  analyzeBtn.addEventListener('click', function () {
    const resumeText = getResumeText();
    const role = document.getElementById('job-role').value;

    if (!resumeText) {
      showToast('Please paste or upload your resume first.', 'error');
      return;
    }
    if (!role) {
      showToast('Please select a target job role.', 'error');
      return;
    }

    // Show loading
    const spinner = document.getElementById('analyze-spinner');
    if (spinner) spinner.classList.add('show');
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';

    // Simulate async AI delay
    setTimeout(async () => {
      await runAnalysis(resumeText, role);
      if (spinner) spinner.classList.remove('show');
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze Resume';
      showToast('Analysis complete and saved!', 'success');

      // Scroll to results
      document.getElementById('output-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1800);
  });
}

async function runAnalysis(text, role) {
  const email = getSession() || 'anonymous';
  const profile = getProfile(email);
  const user = getUserByEmail(email);
  const displayName = (profile && profile.name) || (user && user.name) || '';

  // 1. Improved bullets
  const improved = improveBullets(text);
  renderImprovedResume(improved);

  // 2. Suggestions
  const suggestions = generateSuggestions(text);
  renderSuggestions(suggestions);

  // 3. Section feedback
  const sectionFb = generateSectionFeedback(text);
  renderSectionFeedback(sectionFb);

  // 4. Skill gaps
  const { present, missing } = detectPresentSkills(text, role);
  renderSkillGaps(present, missing);

  // 5. LinkedIn summary
  const linkedin = generateLinkedIn(text, role, displayName);
  renderLinkedIn(linkedin);

  // 6. Interview questions
  const questions = generateInterviewQuestions(text, role);
  renderInterviewQuestions(questions);

  // Persistence: Save results to MongoDB
  try {
    await fetch(`${API_BASE_URL}/save-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        role,
        results: {
          improved_resume: improved,
          suggestions: suggestions.map(s => s.text),
          skill_gaps: { present, missing },
          linkedin_summary: linkedin
        }
      })
    });
  } catch (err) {
    console.error('Persistence failed:', err);
  }

  // Show output area
  document.getElementById('output-area').style.display = 'block';
  // Open all sections
  document.querySelectorAll('.output-section').forEach(s => s.classList.remove('collapsed'));
}

/* ---- Render helpers ---- */
function renderImprovedResume(text) {
  const el = document.getElementById('improved-resume-content');
  if (!el) return;
  el.textContent = text;
}

function renderSuggestions(suggestions) {
  const el = document.getElementById('suggestions-content');
  if (!el) return;
  el.innerHTML = '';

  suggestions.forEach(s => {
    const item = document.createElement('div');
    item.className = 'feedback-item';
    const bType = s.type === 'warn' ? 'badge-warn' : s.type === 'good' ? 'badge-good' : s.type === 'improve' ? 'badge-improve' : 'badge-info';
    item.innerHTML = `
      <span class="feedback-badge ${bType}"></span>
      <span class="feedback-text">${s.text}</span>
    `;
    el.appendChild(item);
  });
}

function renderSectionFeedback(sections) {
  const el = document.getElementById('section-feedback-content');
  if (!el) return;
  el.innerHTML = '';

  sections.forEach(s => {
    const item = document.createElement('div');
    item.className = 'feedback-item';
    const bType = s.type === 'warn' ? 'badge-warn' : s.type === 'good' ? 'badge-good' : s.type === 'improve' ? 'badge-improve' : 'badge-info';
    item.innerHTML = `
      <span class="feedback-badge ${bType}"></span>
      <span class="feedback-text">${s.text}</span>
    `;
    el.appendChild(item);
  });
}

function renderSkillGaps(present, missing) {
  const el = document.getElementById('skill-gaps-content');
  if (!el) return;
  el.innerHTML = '';

  if (present.length === 0 && missing.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted)">No skill data found for selected role.</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'skills-grid';

  present.forEach(s => {
    const pill = document.createElement('span');
    pill.className = 'skill-pill present';
    pill.innerHTML = `<span style="font-size:0.8rem">&#10003;</span> ${s}`;
    grid.appendChild(pill);
  });

  missing.forEach(s => {
    const pill = document.createElement('span');
    pill.className = 'skill-pill missing';
    pill.innerHTML = `<span style="font-size:0.8rem">&#10007;</span> ${s}`;
    grid.appendChild(pill);
  });

  el.appendChild(grid);
}

function renderLinkedIn(summary) {
  const el = document.getElementById('linkedin-content');
  if (!el) return;
  el.textContent = summary;
}

function renderInterviewQuestions(questions) {
  const el = document.getElementById('interview-content');
  if (!el) return;
  el.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'questions-grid';

  const categories = [
    { key: 'hr', label: 'HR', cls: 'cat-hr' },
    { key: 'technical', label: 'Technical', cls: 'cat-tech' },
    { key: 'behavioral', label: 'Behavioral', cls: 'cat-behav' },
  ];

  categories.forEach(cat => {
    (questions[cat.key] || []).forEach(q => {
      const item = document.createElement('div');
      item.className = 'question-item animate-in';
      item.innerHTML = `
        <span class="question-category ${cat.cls}">${cat.label}</span>
        <p>${q}</p>
      `;
      grid.appendChild(item);
    });
  });

  el.appendChild(grid);
}

/* ================================================
   9. COLLAPSIBLE SECTIONS
   ================================================ */
function initCollapsible() {
  document.querySelectorAll('.output-header').forEach(header => {
    header.addEventListener('click', function () {
      const section = this.closest('.output-section');
      if (section) {
        section.classList.toggle('collapsed');
      }
    });
  });
}

/* ================================================
   10. COPY + DOWNLOAD
   ================================================ */
function copyContent(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const text = el.innerText || el.textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Copy failed. Please copy manually.', 'error');
  });
}

function downloadContent(targetId, filename) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const text = el.innerText || el.textContent;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Downloaded as "${filename}"`, 'info');
}

/* ================================================
   11. PAGE ROUTER — call correct init on load
   ================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle: one listener for every page
  initThemeToggle();

  // Sidebar mobile toggle (runs on any page with a sidebar)
  initSidebar();

  // Page-specific inits — each guards with an early return
  initLoginPage();
  initSignupPage();
  initProfileSetupPage();   // profile-setup.html (post-signup)
  initProfileViewPage();    // profile.html (view + edit)
  initDashboard();
  initQuizPage();           // quiz.html
});

/* ================================================
   12. SIDEBAR MOBILE TOGGLE
   ================================================ */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!sidebar || !toggle) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('show');
  });

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('show');
    });
  }

  // Populate sidebar user info
  const email = getSession();
  const profile = getProfile(email);
  const user = getUserByEmail(email);
  const name = (profile && profile.name) || (user && user.name) || 'User';

  const sidebarName = document.getElementById('sidebar-user-name');
  const sidebarAvatar = document.getElementById('sidebar-avatar');

  if (sidebarName) sidebarName.textContent = name;
  if (sidebarAvatar) {
    if (profile && profile.avatar) {
      sidebarAvatar.innerHTML = `<img src="${profile.avatar}" alt="Avatar">`;
    } else {
      sidebarAvatar.textContent = name[0].toUpperCase();
    }
  }

  // Logout button (may exist on sidebar pages)
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

/* ================================================
   13. PROFILE SETUP PAGE (profile-setup.html)
       Previously lived in profile.html, now moved
   ================================================ */
function initProfileSetupPage() {
  // Guard: only run on profile-setup.html
  if (!document.getElementById('profile-setup-root')) return;
  requireLogin();

  const email = getSession();
  const user = getUserByEmail(email);
  const profile = getProfile(email);

  const emailInput = document.getElementById('p-email');
  const nameInput = document.getElementById('p-name');
  if (emailInput) emailInput.value = email;
  if (nameInput && user) nameInput.value = user.name || '';

  // Pre-fill if profile already exists
  if (profile) {
    ['p-age', 'p-contact', 'p-address', 'p-school', 'p-college', 'p-degree'].forEach(id => {
      const el = document.getElementById(id);
      if (el && profile[id]) el.value = profile[id];
    });
    if (profile.avatar) {
      const img = document.getElementById('avatar-preview-img');
      if (img) {
        img.src = profile.avatar;
        img.style.display = 'block';
        document.getElementById('avatar-placeholder').style.display = 'none';
      }
    }
  }

  // Avatar upload preview
  const avatarInput = document.getElementById('avatar-input');
  if (avatarInput) {
    avatarInput.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.getElementById('avatar-preview-img');
        img.src = e.target.result;
        img.style.display = 'block';
        document.getElementById('avatar-placeholder').style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }

  // Save profile
  const form = document.getElementById('profile-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const avatar = document.getElementById('avatar-preview-img').src || '';
      const data = {
        name: document.getElementById('p-name').value.trim(),
        email: email,
        'p-age': document.getElementById('p-age').value.trim(),
        'p-contact': document.getElementById('p-contact').value.trim(),
        'p-address': document.getElementById('p-address').value.trim(),
        'p-school': document.getElementById('p-school').value.trim(),
        'p-college': document.getElementById('p-college').value.trim(),
        'p-degree': document.getElementById('p-degree').value.trim(),
        avatar: avatar.startsWith('data:') ? avatar : '',
      };
      saveProfile(email, data);
      showToast('Profile saved!', 'success');
      setTimeout(() => { window.location.href = '/dashboard'; }, 600);
    });
  }
}

/*
  NOTE: The old initProfilePage() function still exists above and targets
  #profile-form on any page. We have renamed the setup page to profile-setup.html
  (id="profile-setup-root") so initProfileSetupPage() handles it instead.
  initProfilePage() below now handles profile.html view+edit.
*/

/* ================================================
   14. PROFILE VIEW PAGE (profile.html)
   ================================================ */
function initProfileViewPage() {
  // Guard: only run on profile.html (view page)
  if (!document.getElementById('profile-view-root')) return;
  requireLogin();

  const email = getSession();
  const profile = getProfile(email);
  const user = getUserByEmail(email);

  // ---- Populate VIEW mode ----
  function populateView() {
    const name = (profile && profile.name) || (user && user.name) || '—';
    const degree = (profile && profile['p-degree']) || '—';
    const age = (profile && profile['p-age']) || '—';
    const contact = (profile && profile['p-contact']) || '—';
    const address = (profile && profile['p-address']) || '—';
    const school = (profile && profile['p-school']) || '—';
    const college = (profile && profile['p-college']) || '—';

    const setOrEmpty = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (val && val !== '—') {
        el.textContent = val;
        el.classList.remove('empty');
      } else {
        el.textContent = 'Not provided';
        el.classList.add('empty');
      }
    };

    // Avatar
    const viewAvatar = document.getElementById('view-avatar');
    if (viewAvatar) {
      if (profile && profile.avatar) {
        viewAvatar.innerHTML = `<img src="${profile.avatar}" alt="Avatar">`;
      } else {
        viewAvatar.textContent = name[0].toUpperCase();
      }
    }

    const viewName = document.getElementById('view-name');
    if (viewName) viewName.textContent = name;

    const emailBadge = document.getElementById('view-email');
    if (emailBadge) emailBadge.textContent = email;

    const heroDegree = document.getElementById('view-degree');
    if (heroDegree) heroDegree.textContent = degree !== '—' ? degree : 'No degree set';

    const heroAgeContact = document.getElementById('view-age-contact');
    if (heroAgeContact) heroAgeContact.textContent = `Age: ${age}   Contact: ${contact}`;

    const heroAddress = document.getElementById('view-address');
    if (heroAddress) heroAddress.textContent = `Address: ${address}`;

    setOrEmpty('view-age', age);
    setOrEmpty('view-contact', contact);
    setOrEmpty('view-address-card', address);
    setOrEmpty('view-email-card', email);
    setOrEmpty('view-school', school);
    setOrEmpty('view-college', college);
    setOrEmpty('view-degree-card', degree);
  }

  populateView();

  // ---- Toggle EDIT mode ----
  const editBtn = document.getElementById('edit-btn');
  const editMode = document.getElementById('edit-mode');
  const viewMode = document.getElementById('view-mode');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  const saveBtn = document.getElementById('save-profile-btn');

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      // Pre-fill edit fields from current profile
      document.getElementById('edit-name').value = (profile && profile.name) || (user && user.name) || '';
      document.getElementById('edit-email').value = email;
      document.getElementById('edit-age').value = (profile && profile['p-age']) || '';
      document.getElementById('edit-contact').value = (profile && profile['p-contact']) || '';
      document.getElementById('edit-address').value = (profile && profile['p-address']) || '';
      document.getElementById('edit-school').value = (profile && profile['p-school']) || '';
      document.getElementById('edit-college').value = (profile && profile['p-college']) || '';
      document.getElementById('edit-degree').value = (profile && profile['p-degree']) || '';

      // Restore avatar in edit form
      if (profile && profile.avatar) {
        const editImg = document.getElementById('edit-avatar-img');
        editImg.src = profile.avatar;
        editImg.style.display = 'block';
        document.getElementById('edit-avatar-placeholder').style.display = 'none';
      }

      viewMode.style.display = 'none';
      editMode.classList.add('show');
      editMode.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      editMode.classList.remove('show');
      viewMode.style.display = 'block';
    });
  }

  // Avatar upload in edit mode
  const editAvatarInput = document.getElementById('edit-avatar-input');
  if (editAvatarInput) {
    editAvatarInput.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.getElementById('edit-avatar-img');
        img.src = e.target.result;
        img.style.display = 'block';
        document.getElementById('edit-avatar-placeholder').style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }

  // ---- Save edited profile ----
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const editImg = document.getElementById('edit-avatar-img');
      const newAvatarSrc = editImg ? editImg.src : '';

      const updatedProfile = {
        name: document.getElementById('edit-name').value.trim(),
        email: email,
        'p-age': document.getElementById('edit-age').value.trim(),
        'p-contact': document.getElementById('edit-contact').value.trim(),
        'p-address': document.getElementById('edit-address').value.trim(),
        'p-school': document.getElementById('edit-school').value.trim(),
        'p-college': document.getElementById('edit-college').value.trim(),
        'p-degree': document.getElementById('edit-degree').value.trim(),
        avatar: newAvatarSrc.startsWith('data:') ? newAvatarSrc : ((profile && profile.avatar) || ''),
      };

      saveProfile(email, updatedProfile);
      showToast('Profile updated!', 'success');

      // Reload the page to reflect new data in view mode
      setTimeout(() => { window.location.reload(); }, 600);
    });
  }
}

/* ================================================
   15. QUIZ ENGINE (quiz.html)
   ================================================ */

/*
  HOW IT WORKS:
  1. runAnalysis() in dashboard.html saves generated questions to localStorage
     under the key 'ra_quiz_questions' as a flat array: [{text, category}, ...]
  2. quiz.html reads that array, shows a start screen with counts, then goes
     one question at a time.
  3. Answers are stored in 'ra_quiz_answers' as an array indexed by question index.
  4. At the end, the summary screen renders all Q+A pairs.
*/

// Quiz state (module-level, not localStorage — resets on page reload)
let quizQuestions = [];
let quizAnswers = [];
let currentQIndex = 0;
let quizStarted = false;

function initQuizPage() {
  if (!document.getElementById('quiz-root')) return;
  requireLogin();

  // Load questions generated by analysis
  quizQuestions = JSON.parse(localStorage.getItem('ra_quiz_questions') || '[]');

  // Load any saved answers (allows resuming)
  quizAnswers = JSON.parse(localStorage.getItem('ra_quiz_answers') || '[]');

  if (quizQuestions.length === 0) {
    // No questions yet — show empty state
    document.getElementById('quiz-no-questions').style.display = 'block';
    return;
  }

  // Show start screen with stats
  showQuizScreen('quiz-start');
  renderStartStats();

  // Event listeners
  document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);
  document.getElementById('prev-btn').addEventListener('click', prevQuestion);
  document.getElementById('next-btn').addEventListener('click', nextQuestion);
  document.getElementById('skip-btn').addEventListener('click', skipQuestion);
  document.getElementById('restart-quiz-btn').addEventListener('click', restartQuiz);

  // TTS buttons
  document.getElementById('tts-speak').addEventListener('click', speakQuestion);
  document.getElementById('tts-pause').addEventListener('click', pauseSpeech);
  document.getElementById('tts-stop').addEventListener('click', stopSpeech);

  // Save answer on every keystroke
  document.getElementById('answer-input').addEventListener('input', function () {
    quizAnswers[currentQIndex] = this.value;
    localStorage.setItem('ra_quiz_answers', JSON.stringify(quizAnswers));
  });
}

/** Show one of the quiz UI states */
function showQuizScreen(screen) {
  // All states
  const screens = ['quiz-no-questions', 'quiz-start', 'quiz-loading', 'quiz-active', 'quiz-summary'];
  screens.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === screen || (id === 'quiz-' + screen && !screen.startsWith('quiz-'))) {
      el.style.display = 'block'; // Force block to override CSS hidden states
      el.classList.add('show');
    } else {
      el.style.display = 'none';
      el.classList.remove('show');
    }
  });
}

function renderStartStats() {
  const hr = quizQuestions.filter(q => q.category === 'hr').length;
  const tech = quizQuestions.filter(q => q.category === 'technical').length;
  const behav = quizQuestions.filter(q => q.category === 'behavioral').length;

  const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  s('stat-hr', hr);
  s('stat-tech', tech);
  s('stat-behav', behav);
}

function startQuiz() {
  // Show loading briefly, then show first question
  showQuizScreen('quiz-loading');
  stopSpeech();

  setTimeout(() => {
    currentQIndex = 0;
    quizStarted = true;
    showQuizScreen('quiz-active');
    renderQuestion(currentQIndex);
  }, 1200);
}

function renderQuestion(index) {
  const q = quizQuestions[index];
  const total = quizQuestions.length;
  if (!q) return;

  stopSpeech();

  // Progress bar
  const pct = ((index + 1) / total) * 100;
  const fill = document.getElementById('progress-fill');
  const count = document.getElementById('progress-count');
  const qIdx = document.getElementById('q-index');
  if (fill) fill.style.width = pct + '%';
  if (count) count.textContent = `Question ${index + 1} of ${total}`;
  if (qIdx) qIdx.textContent = `${index + 1} / ${total}`;

  // Category badge
  const badge = document.getElementById('q-category-badge');
  if (badge) {
    const labels = { hr: 'HR', technical: 'Technical', behavioral: 'Behavioral' };
    const classes = { hr: 'badge-hr', technical: 'badge-tech', behavioral: 'badge-behav' };
    badge.textContent = labels[q.category] || q.category;
    badge.className = `question-badge ${classes[q.category] || ''}`;
  }

  // Question text
  const qtEl = document.getElementById('current-question');
  if (qtEl) {
    // Simplified: direct text set first for reliability
    qtEl.textContent = q.text;
    qtEl.style.opacity = '1';
    qtEl.style.transition = 'none'; // Reset transition

    // Short delay to trigger fade-in animation
    setTimeout(() => {
      qtEl.style.opacity = '0';
      void qtEl.offsetWidth; // Force reflow
      qtEl.style.transition = 'opacity 0.4s ease';
      qtEl.style.opacity = '1';
    }, 10);
  }

  // Restore saved answer (if user had already answered this one)
  const answerInput = document.getElementById('answer-input');
  if (answerInput) answerInput.value = quizAnswers[index] || '';

  // Prev button: disable on first question
  const prevBtn = document.getElementById('prev-btn');
  if (prevBtn) prevBtn.disabled = index === 0;

  // Next button text: "Finish" on last question
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) nextBtn.textContent = index === total - 1 ? 'Finish' : 'Next';
}

function saveCurrentAnswer() {
  const answerInput = document.getElementById('answer-input');
  if (answerInput) {
    quizAnswers[currentQIndex] = answerInput.value;
    localStorage.setItem('ra_quiz_answers', JSON.stringify(quizAnswers));
  }
}

function nextQuestion() {
  saveCurrentAnswer();
  stopSpeech();
  if (currentQIndex < quizQuestions.length - 1) {
    currentQIndex++;
    renderQuestion(currentQIndex);
  } else {
    showSummary();
  }
}

function prevQuestion() {
  saveCurrentAnswer();
  stopSpeech();
  if (currentQIndex > 0) {
    currentQIndex--;
    renderQuestion(currentQIndex);
  }
}

function skipQuestion() {
  // Mark as skipped (empty string preserves index)
  quizAnswers[currentQIndex] = quizAnswers[currentQIndex] || '';
  localStorage.setItem('ra_quiz_answers', JSON.stringify(quizAnswers));
  stopSpeech();
  if (currentQIndex < quizQuestions.length - 1) {
    currentQIndex++;
    renderQuestion(currentQIndex);
  } else {
    showSummary();
  }
}

function showSummary() {
  saveCurrentAnswer();
  stopSpeech();
  showQuizScreen('quiz-summary');
  renderSummary();
}

function renderSummary() {
  const list = document.getElementById('quiz-summary-list');
  const scoreEl = document.getElementById('summary-score');
  if (!list) return;

  list.innerHTML = '';

  const answered = quizAnswers.filter(a => a && a.trim().length > 0).length;
  const total = quizQuestions.length;

  if (scoreEl) scoreEl.textContent = `${answered} of ${total} answered`;

  const catLabels = { hr: 'HR', technical: 'Technical', behavioral: 'Behavioral' };
  const catClasses = { hr: 'badge-hr', technical: 'badge-tech', behavioral: 'badge-behav' };

  quizQuestions.forEach((q, i) => {
    const item = document.createElement('div');
    item.className = 'glass-card summary-item';

    const hasAnswer = quizAnswers[i] && quizAnswers[i].trim().length > 0;

    item.innerHTML = `
      <div style="margin-bottom:8px;">
        <span class="question-badge ${catClasses[q.category] || ''}" style="font-size:0.68rem;">
          ${catLabels[q.category] || q.category}
        </span>
      </div>
      <div class="summary-q">${i + 1}. ${q.text}</div>
      <div class="summary-a-label">Your Answer</div>
      <div class="summary-a-text ${hasAnswer ? '' : 'not-answered'}">
        ${hasAnswer ? quizAnswers[i].replace(/\n/g, '<br>') : 'No answer provided'}
      </div>
    `;
    list.appendChild(item);
  });
}

function restartQuiz() {
  quizAnswers = [];
  currentQIndex = 0;
  localStorage.removeItem('ra_quiz_answers');
  stopSpeech();
  startQuiz();
}

/* ================================================
   16. TEXT-TO-SPEECH (Web Speech API)
   ================================================ */

/*
  HOW IT WORKS:
  - speechSynthesis is a browser built-in object.
  - We create a SpeechSynthesisUtterance with the question text.
  - speak()  → reads the text aloud
  - pause()  → pauses mid-sentence (resumes from pause point)
  - resume() → resumes from where it paused
  - cancel() → stops completely
*/

let currentUtterance = null;
let isSpeaking = false;
let isPaused = false;

function speakQuestion() {
  if (!window.speechSynthesis) {
    showToast('Text-to-Speech is not supported in your browser.', 'error');
    return;
  }

  const qEl = document.getElementById('current-question');
  if (!qEl) return;
  const text = qEl.textContent.trim();
  if (!text) return;

  // Stop any previous speech
  window.speechSynthesis.cancel();

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = 0.9;   // slightly slower for clarity
  currentUtterance.pitch = 1.0;
  currentUtterance.volume = 1.0;

  // Update button states during speech lifecycle
  currentUtterance.onstart = () => {
    isSpeaking = true;
    isPaused = false;
    document.getElementById('tts-speak').classList.add('active');
  };

  currentUtterance.onend = () => {
    isSpeaking = false;
    isPaused = false;
    document.getElementById('tts-speak').classList.remove('active');
  };

  currentUtterance.onerror = () => {
    isSpeaking = false;
    isPaused = false;
    document.getElementById('tts-speak').classList.remove('active');
  };

  window.speechSynthesis.speak(currentUtterance);
}

function pauseSpeech() {
  if (!window.speechSynthesis) return;

  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
    isPaused = true;
    document.getElementById('tts-pause').classList.add('active');
  } else if (window.speechSynthesis.paused) {
    // Second click on pause = resume
    window.speechSynthesis.resume();
    isPaused = false;
    document.getElementById('tts-pause').classList.remove('active');
  }
}

function stopSpeech() {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  isSpeaking = false;
  isPaused = false;

  // Reset button states safely
  const speakBtn = document.getElementById('tts-speak');
  const pauseBtn = document.getElementById('tts-pause');
  if (speakBtn) speakBtn.classList.remove('active');
  if (pauseBtn) pauseBtn.classList.remove('active');
}

/* ================================================
   17. UPDATE: runAnalysis() — save quiz questions
   We wrap the existing renderInterviewQuestions to also
   store the flat question list for quiz.html
   ================================================ */

// Override renderInterviewQuestions to also save to localStorage
const _originalRenderInterviewQuestions = renderInterviewQuestions;
renderInterviewQuestions = function (questions) {
  // Call original renderer (shows preview on dashboard)
  _originalRenderInterviewQuestions(questions);

  // Build flat array for quiz.html: [{text, category}, ...]
  const flat = [];
  (questions.hr || []).forEach(t => flat.push({ text: t, category: 'hr' }));
  (questions.technical || []).forEach(t => flat.push({ text: t, category: 'technical' }));
  (questions.behavioral || []).forEach(t => flat.push({ text: t, category: 'behavioral' }));

  // Save to localStorage so quiz.html can read them
  localStorage.setItem('ra_quiz_questions', JSON.stringify(flat));
  // Clear previous answers when new analysis is done
  localStorage.removeItem('ra_quiz_answers');
};

/* ================================================
   18. UPDATE: initSignupPage — redirect to profile-setup.html
   ================================================ */
// Patch the redirect inside initSignupPage after it runs:
// (The function above already redirects to 'profile.html' — we patch it via
//  looking at the window.location in DOMContentLoaded once the signup triggers.)

// Check: if we land on profile-setup.html directly and no session, redirect to login
(function checkProfileSetup() {
  if (window.location.pathname.includes('profile-setup.html')) {
    if (!localStorage.getItem('ra_session')) {
      window.location.href = '/index.html';
    }
  }
})();

