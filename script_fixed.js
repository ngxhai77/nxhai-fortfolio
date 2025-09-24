// Sound System
const SoundManager = {
  sounds: {},
  enabled: true,
  
  init() {
    // Preload all sound effects
    this.sounds = {
      hover: new Audio('sounds/core_16-hover.ogg'),
      back: new Audio('sounds/core_32-back-esc.ogg'),
      click: new Audio('sounds/core_52_enter-click.ogg'),
      confirm: new Audio('sounds/core_58_confirm.ogg'),
      selfDestruct: new Audio('sounds/selfdestruct.mp3')
    };
    
    // Set volume levels
    Object.values(this.sounds).forEach(sound => {
      sound.volume = 0.3; // Adjust volume as needed
      sound.preload = 'auto';
    });
    
    // Self-destruct sound should be louder
    this.sounds.selfDestruct.volume = 0.5;
    
    console.log('Sound system initialized');
  },
  
  play(soundName) {
    if (!this.enabled || !this.sounds[soundName]) return;
    
    try {
      // Reset and play the sound
      this.sounds[soundName].currentTime = 0;
      this.sounds[soundName].play().catch(e => {
        console.warn(`Could not play sound ${soundName}:`, e);
      });
    } catch (error) {
      console.warn(`Error playing sound ${soundName}:`, error);
    }
  },
  
  toggle() {
    this.enabled = !this.enabled;
    console.log(`Sound system ${this.enabled ? 'enabled' : 'disabled'}`);
  }
};

// Initialize sound system
SoundManager.init();

// Boot Screen System
let isBootScreenShown = false;

function initBootScreen() {
  // Check if this is a fresh page load (not navigation within the app)
  const isPageLoad = !sessionStorage.getItem('portfolio-visited') || 
                     performance.navigation.type === performance.navigation.TYPE_RELOAD;
  
  if (isPageLoad && !isBootScreenShown) {
    isBootScreenShown = true;
    document.body.classList.add('boot-active');
    
    const bootScreen = document.getElementById('boot-screen');
    const bootVideo = document.getElementById('boot-video');
    
    if (bootScreen && bootVideo) {
      console.log('Boot screen initiated');
      
      // Set minimum boot screen duration (even if video is shorter)
      const minBootDuration = 3000; // 3 seconds minimum
      const maxBootDuration = 6000; // 8 seconds maximum
      
      let videoEnded = false;
      let minTimeElapsed = false;
      
      // Minimum time timer
      setTimeout(() => {
        minTimeElapsed = true;
        checkBootComplete();
      }, minBootDuration);
      
      // Maximum time fallback
      let maxTimer = setTimeout(() => {
        console.log('Boot screen max time reached, forcing completion');
        completeBootSequence();
      }, maxBootDuration);
      
      // Function to check if boot can complete
      function checkBootComplete() {
        if (videoEnded && minTimeElapsed) {
          clearTimeout(maxTimer);
          completeBootSequence();
        }
      }
      
      // Listen for video end
      bootVideo.addEventListener('ended', () => {
        console.log('Boot video ended');
        videoEnded = true;
        checkBootComplete();
      });
      
      // Handle video load error
      bootVideo.addEventListener('error', () => {
        console.warn('Boot video failed to load, using fallback timing');
        videoEnded = true; // Treat as ended
        checkBootComplete();
      });
      
      // Handle video loaded
      bootVideo.addEventListener('loadeddata', () => {
        console.log('Boot video loaded successfully');
      });
      
      // Allow user to skip boot screen by clicking
      bootScreen.addEventListener('click', () => {
        console.log('Boot screen skipped by user');
        clearTimeout(maxTimer);
        completeBootSequence();
      });
      
      // Show skip hint after 2 seconds
      setTimeout(() => {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText && bootScreen.style.display !== 'none') {
          loadingText.innerHTML = 'INITIALIZING SYSTEM...<br><small style="font-size: 0.8rem; opacity: 0.7;">Click to skip</small>';
        }
      }, 2000);
      
      // Mark that we've visited the portfolio in this session
      sessionStorage.setItem('portfolio-visited', 'true');
    } else {
      // Boot screen elements not found, proceed to main app
      completeBootSequence();
    }
  } else {
    // Skip boot screen for navigation within the app
    completeBootSequence();
  }
}

function completeBootSequence() {
  const bootScreen = document.getElementById('boot-screen');
  
  if (bootScreen) {
    console.log('Completing boot sequence');
    
    // Fade out boot screen
    bootScreen.classList.add('fade-out');
    
    // Remove boot screen after fade out
    setTimeout(() => {
      document.body.classList.remove('boot-active');
      bootScreen.style.display = 'none';
      
      // Initialize main application
      initMainApplication();
    }, 500); // Match CSS transition duration
  } else {
    initMainApplication();
  }
}

function initMainApplication() {
  console.log('Main application initialized');
  
  // Initialize main application components after boot screen
  setTimeout(() => {
    // Trigger initial animations
    triggerButtonAnimations();
    // Initialize contact links if on contact page
    initContactPageLinks();
  }, 100);
}

// Start boot screen immediately
initBootScreen();

document.addEventListener('DOMContentLoaded', function() {
  // Get buttons from different sections
  const menuButtons = document.querySelectorAll('.menu-bar .menu-button');
  const contentButtons = document.querySelectorAll('.content button');
  const subContent = document.querySelector('.sub-content');
  const mainElement = document.querySelector('main');
  
  let currentMenuIndex = 0;
  let currentContentIndex = 0;
  let navigationLevel = 'menu'; // 'menu' or 'content'
  let lastSkillButtonPressed = null; // Track which skill button was last pressed
  let lastProjectButtonPressed = null; // Track which project category button was last pressed
  let lastConfirmedMenuIndex = 0; // Track which menu button was actually confirmed (not just hovered)
  let lastAnimatedPage = null; // Track which page already had button animation
  let isMenuConfirmed = false; // Track if any menu button has been confirmed
  
  // Text scramble animation tracking
  let activeScrambleIntervals = []; // Track all active scramble intervals

  // Function to update menu focus state (both visual and navigation index)
  function updateMenuFocus(newIndex, source = 'keyboard') {
    // If menu is confirmed and this is a hover, don't allow preview
    if (isMenuConfirmed && source === 'mouse') {
      return; // Block hover functionality after confirmation
    }
    
    // If we're in content navigation level, don't interfere with menu-button states
    if (navigationLevel === 'content' && isMenuConfirmed) {
      return; // Preserve selected menu-button state during content navigation
    }
    
    // Play hover sound effect
    SoundManager.play('hover');
    
    // Stop any active text scramble animations when navigation changes
    stopAllScrambleAnimations();
    
    // Update currentMenuIndex
    currentMenuIndex = newIndex;
    
    // Remove focus and manage hover state for all menu buttons
    menuButtons.forEach((btn, idx) => {
      // Don't blur buttons that are selected (confirmed)
      if (!btn.classList.contains('selected')) {
        btn.blur();
      }
      btn.classList.remove('keyboard-focus'); // Remove any keyboard focus class
      
      // For keyboard navigation, we need to manage hover conflicts differently
      if (source === 'keyboard') {
        // Add a class to indicate this button is keyboard-focused
        if (idx === newIndex) {
          btn.classList.add('keyboard-active');
        } else {
          btn.classList.remove('keyboard-active');
        }
      } else {
        // Mouse navigation - clear keyboard active states but preserve selected state
        if (!btn.classList.contains('selected')) {
          btn.classList.remove('keyboard-active');
        }
      }
    });
    
    // Focus the new button if source is keyboard
    if (source === 'keyboard') {
      menuButtons[currentMenuIndex].focus();
      menuButtons[currentMenuIndex].classList.add('keyboard-focus'); // Add keyboard focus class
    }
    
    // Load page preview
    const selectedButton = menuButtons[currentMenuIndex];
    const dataUrl = selectedButton.getAttribute('data-url');
    
    // Only trigger animation on first hover/focus for this page
    const shouldAnimate = (source === 'mouse' || source === 'keyboard') && lastAnimatedPage !== dataUrl;
    
    if (dataUrl && dataUrl !== 'index.html') {
      loadPageContent(dataUrl, shouldAnimate);
    } else {
      loadHomePage(false);
      if (shouldAnimate) {
        lastAnimatedPage = 'index.html'; // Mark index as animated too
      }
    }
  }

  // Store original main content
  const originalMainContent = mainElement.innerHTML;

  // Page title configuration
  const pageTitles = {
    'index.html': {
      main: "Hi, I'm Nguyen Xuan Hai",
      sub: "Full Stack Developer"
    },
    'projects.html': {
      main: "My Projects",
      sub: "" // No sub-title initially
    },
    'skills.html': {
      main: "Technical Skills", 
      sub: "" // No sub-title initially
    },
    'contact.html': {
      main: "Get In Touch",
      sub: "Contact Information"
    }
  };

  // Function to update page title
  function updatePageTitle(url, subTitle = null) {
    const titleElement = document.getElementById('page-title');
    if (titleElement && pageTitles[url]) {
      const spanElement = titleElement.querySelector('span');
      let smallElement = titleElement.querySelector('small');
      
      if (spanElement) {
        spanElement.textContent = pageTitles[url].main;
      }
      
      // Handle sub-title
      if (subTitle) {
        // If subTitle is provided, create or update small element
        if (!smallElement) {
          smallElement = document.createElement('small');
          titleElement.appendChild(smallElement);
        }
        smallElement.textContent = subTitle;
        smallElement.style.display = 'block';
      } else if (pageTitles[url].sub) {
        // Use default sub-title from config
        if (!smallElement) {
          smallElement = document.createElement('small');
          titleElement.appendChild(smallElement);
        }
        smallElement.textContent = pageTitles[url].sub;
        smallElement.style.display = 'block';
      } else {
        // Hide or remove small element if no sub-title
        if (smallElement) {
          smallElement.style.display = 'none';
        }
      }
    }
  }

  // Function to load external HTML content
  async function loadPageContent(url, triggerAnimation = true) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Extract the main content (everything inside <main> tag if exists, or body content)
      const mainContent = tempDiv.querySelector('main');
      if (mainContent) {
        mainElement.innerHTML = mainContent.innerHTML;
      } else {
        // If no main tag, get body content
        const bodyContent = tempDiv.querySelector('body');
        if (bodyContent) {
          mainElement.innerHTML = bodyContent.innerHTML;
        } else {
          mainElement.innerHTML = html;
        }
      }
      
      // Update content buttons reference after loading new content
      updateContentButtons();
      
      // Update page title
      updatePageTitle(url);
      
      // Initialize contact page links if loading contact.html
      if (url === 'contact.html') {
        setTimeout(() => {
          initContactPageLinks();
        }, 50); // Small delay to ensure DOM is ready
      }
      
      // Initialize content button clicks for index and projects pages
      if (url === 'index.html' || url === 'projects.html') {
        setTimeout(() => {
          initContentButtonClicks();
        }, 50); // Small delay to ensure DOM is ready
      }
      
      // Trigger button animations for main pages only if requested and not already animated
      const mainPages = ['index.html', 'projects.html', 'skills.html', 'contact.html'];
      if (mainPages.includes(url) && triggerAnimation && lastAnimatedPage !== url) {
        triggerButtonAnimations();
        lastAnimatedPage = url; // Mark this page as animated
      }
      
      return Promise.resolve(); // Return resolved promise for chaining
      
    } catch (error) {
      console.error('Error loading page:', error);
      // Show error message
      mainElement.innerHTML = `
        <div class="error-message" style="padding: 2rem; text-align: center;">
          <h2 style="color: #4d493e; margin-bottom: 1rem;">Page Not Found</h2>
          <p style="color: #4d493e; margin-bottom: 1rem;">Sorry, the page "${url}" could not be loaded.</p>
          <button onclick="loadHomePage()" style="padding: 0.5rem 1rem; background-color: #4d493e; color: #c8c2aa; border: none; cursor: pointer;">Go Back to Home</button>
        </div>
      `;
      return Promise.reject(error);
    }
  }

  // Function to load home page content
  function loadHomePage(keepSelectedState = false) {
    mainElement.innerHTML = originalMainContent;
    updateContentButtons();
    // Reset to menu navigation
    navigationLevel = 'menu';
    currentMenuIndex = 0;
    
    // Update page title to home
    updatePageTitle('index.html');
    
    // Only remove selected class if not preserving state
    if (!keepSelectedState) {
      menuButtons.forEach(button => button.classList.remove('selected'));
    }
    
    if (menuButtons.length > 0) {
      menuButtons[currentMenuIndex].focus();
      updateSubContent();
    }
  }

  // Make loadHomePage available globally for error button
  window.loadHomePage = loadHomePage;

  // Function to add bullet placeholders to buttons
  function addBulletsToButtons(buttons) {
    buttons.forEach(button => {
      // Check if button already has a bullet placeholder
      if (!button.querySelector('.bullet-placeholder')) {
        // Create bullet placeholder
        const bulletPlaceholder = document.createElement('div');
        bulletPlaceholder.className = 'bullet-placeholder';
        
        // Insert at the beginning of the button
        button.insertBefore(bulletPlaceholder, button.firstChild);
      }
      
      // Add bullet content to the placeholder
      const placeholder = button.querySelector('.bullet-placeholder');
      if (placeholder && !placeholder.querySelector('.bullet-container')) {
        // Get the bullet template
        const bulletTemplate = document.getElementById('bullet-template');
        if (bulletTemplate) {
          const bulletClone = bulletTemplate.content.cloneNode(true);
          placeholder.appendChild(bulletClone);
        }
      }
    });
  }

  // Function to update content buttons after loading new content
  function updateContentButtons() {
    // Re-query content buttons as they might have changed
    window.currentContentButtons = document.querySelectorAll('.content button');
    
    // Add bullets to content buttons
    addBulletsToButtons(window.currentContentButtons);
    
    // Add skill navigation event listeners
    addSkillNavigationListeners();
    
    // Add skill block animations
    addSkillBlockAnimations();
    
    // Add contact sync functionality
    addContactSyncListeners();
  }

  // Synchronize contact buttons with QR blocks
  function addContactSyncListeners() {
    // Only add if we're on contact page
    const contactButtons = document.querySelectorAll('.container .content button');
    const qrBlocks = document.querySelectorAll('.qr-block');
    
    if (contactButtons.length === 4 && qrBlocks.length === 4) {
      // Mapping: button index -> QR block index (updated order)
      // Button 0: Email Contact -> QR Block 0: Email
      // Button 1: LinkedIn Profile -> QR Block 1: LinkedIn  
      // Button 2: GitHub Repository -> QR Block 3: GitHub
      // Button 3: Curriculum Vitae -> QR Block 2: CV
      const buttonToQrMapping = [0, 1, 3, 2];
      
      contactButtons.forEach((button, buttonIndex) => {
        const correspondingQrIndex = buttonToQrMapping[buttonIndex];
        const correspondingQr = qrBlocks[correspondingQrIndex];
        
        if (correspondingQr) {
          // Button hover/focus triggers QR block animation
          button.addEventListener('mouseenter', () => {
            correspondingQr.classList.add('synced-hover');
          });
          
          button.addEventListener('mouseleave', () => {
            correspondingQr.classList.remove('synced-hover');
          });
          
          button.addEventListener('focus', () => {
            correspondingQr.classList.add('synced-focus');
          });
          
          button.addEventListener('blur', () => {
            correspondingQr.classList.remove('synced-focus');
          });
          
          // QR block hover/focus triggers button animation  
          correspondingQr.addEventListener('mouseenter', () => {
            button.classList.add('synced-hover');
          });
          
          correspondingQr.addEventListener('mouseleave', () => {
            button.classList.remove('synced-hover');
          });
          
          correspondingQr.addEventListener('focus', () => {
            button.classList.add('synced-focus');
          });
          
          correspondingQr.addEventListener('blur', () => {
            button.classList.remove('synced-focus');
          });
        }
      });
    }
  }

  // Return the set of buttons eligible for W/S navigation based on current context
  function getContentNavigationButtons() {
    // On the main projects page, restrict navigation to only the left category buttons
    if (isInMainProjectsPage()) {
      return document.querySelectorAll('.row-container .container .content button[data-project-url]');
    }
    // Default: all buttons inside .content
    return document.querySelectorAll('.content button');
  }

  // Function to add skill block animations based on skill category
  function addSkillBlockAnimations() {
    const skillButtons = document.querySelectorAll('.skill-wrapper button');
    const skillBlocks = document.querySelectorAll('.skill-block');
    
    // Map skill categories to block numbers
    const skillCategoryMap = {
      'skills-all.html': 0, // All blocks
      'skills-programming.html': 1, // color1 blocks
      'skills-backend.html': 2, // color2 blocks  
      'skills-frontend.html': 3, // color3 blocks
      'skills-tools.html': 4, // color4 blocks
      'skills-other.html': 5, // color5 blocks
      'contact.html': 6 // color6 blocks
    };
    
    // Get current page URL to determine which blocks to animate
    const currentUrl = window.location.pathname;
    let currentCategory = 0;
    
    // Determine current skill category based on loaded content
    if (currentUrl.includes('skills') || document.querySelector('.skill-wrapper')) {
      // Try to determine from the current content or default to showing all
      currentCategory = getCurrentSkillCategory();
    }
    
    skillButtons.forEach((button, index) => {
      button.addEventListener('mouseenter', () => animateSkillBlocks(currentCategory, index, true));
      button.addEventListener('mouseleave', () => animateSkillBlocks(currentCategory, index, false));
      button.addEventListener('focus', () => animateSkillBlocks(currentCategory, index, true));
      button.addEventListener('blur', () => animateSkillBlocks(currentCategory, index, false));
    });
  }

  // Function to determine current skill category
  function getCurrentSkillCategory() {
    // Check if we're in a skill detail page (has skill-wrapper but no data-skill-url buttons)
    const skillWrapper = document.querySelector('.skill-wrapper');
    const skillNavButtons = document.querySelectorAll('button[data-skill-url]');
    
    if (skillWrapper && skillNavButtons.length === 0) {
      // We're in a skill detail page, determine which one by checking the content
      const buttons = document.querySelectorAll('.skill-wrapper button');
      const buttonCount = buttons.length;
      
      // If there are many buttons (like 25+), it's likely the "all skills" page
      if (buttonCount > 20) {
        console.log('Detected skills-all.html - Category 0'); // Debug log
        return 0; // All skills category
      }
      
      // For smaller counts, try to determine category by content
      if (buttons.length > 0) {
        const firstButton = buttons[0];
        const buttonText = firstButton.textContent.toLowerCase();
        
        console.log('Analyzing button text:', buttonText); // Debug log
        
        if (buttonText.includes('javascript') || buttonText.includes('python') || buttonText.includes('typescript')) {
          console.log('Detected programming category - Category 1'); // Debug log
          return 1;
        }
        if (buttonText.includes('node') || buttonText.includes('asp.net') || buttonText.includes('restful')) {
          console.log('Detected backend category - Category 2'); // Debug log
          return 2;
        }
        if (buttonText.includes('html') || buttonText.includes('css') || buttonText.includes('responsive')) {
          console.log('Detected frontend category - Category 3'); // Debug log
          return 3;
        }
        if (buttonText.includes('git') || buttonText.includes('docker') || buttonText.includes('vs code')) {
          console.log('Detected tools category - Category 4'); // Debug log
          return 4;
        }
        if (buttonText.includes('ui/ux') || buttonText.includes('project') || buttonText.includes('problem')) {
          console.log('Detected other category - Category 5'); // Debug log
          return 5;
        }
      }
    }
    
    console.log('Defaulting to category 0 (all skills)'); // Debug log
    return 0; // Default to all categories
  }

  // Function to check if we're currently in a skill detail page
  function isInSkillDetailPage() {
    // Check if we have skill-wrapper but no data-skill-url buttons (indicating we're in detail view)
    const skillWrapper = document.querySelector('.skill-wrapper');
    const skillNavButtons = document.querySelectorAll('button[data-skill-url]');
    
    return skillWrapper && skillNavButtons.length === 0;
  }

  // Function to check if we're currently in a project detail page
  function isInProjectDetailPage() {
    // Check if we have project-wrapper with data-project-detail buttons (indicating we're in project category view)
    const projectWrapper = document.querySelector('.project-wrapper');
    const projectDetailButtons = document.querySelectorAll('button[data-project-detail]');
    
    return projectWrapper && projectDetailButtons.length > 0;
  }

  // Function to check if we're in main projects page
  function isInMainProjectsPage() {
    // Check if we have project category buttons (data-project-url)
    const projectCategoryButtons = document.querySelectorAll('button[data-project-url]');
    const projectContent = document.querySelector('.project-content');
    
    return projectCategoryButtons.length > 0 && projectContent;
  }

  // Function to animate skill blocks
  function animateSkillBlocks(category, buttonIndex, expand) {
    const skillBlocks = document.querySelectorAll('.skill-block');
    
    if (category === 0) {
      // All skills - cycle through all available blocks
      if (skillBlocks.length > 0) {
        // Use modulo to cycle through blocks if we have more buttons than blocks
        const blockIndex = buttonIndex % skillBlocks.length;
        const targetBlock = skillBlocks[blockIndex];
        
        if (expand) {
          targetBlock.classList.add('expanded');
        } else {
          targetBlock.classList.remove('expanded');
        }
      }
    } else {
      // Specific category - animate individual block within that category
      const colorClass = `color${category}`;
      const categoryBlocks = document.querySelectorAll(`.skill-block.${colorClass}`);
      
      // Map button index to specific block within the category
      if (categoryBlocks.length > 0) {
        // Use modulo to cycle through category blocks if needed
        const blockIndex = buttonIndex % categoryBlocks.length;
        const targetBlock = categoryBlocks[blockIndex];
        
        if (expand) {
          targetBlock.classList.add('expanded');
        } else {
          targetBlock.classList.remove('expanded');
        }
      }
    }
  }

  // Function to handle skill navigation within skills.html
  async function loadSkillContent(url) {
    console.log('loadSkillContent called with URL:', url); // Debug log
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      
      console.log('Fetched HTML content:', html.substring(0, 100)); // Debug log
      
      // Find the container div within the main element
      const containerDiv = mainElement.querySelector('.container');
      console.log('Found container div:', containerDiv); // Debug log
      
      if (containerDiv) {
        // Parse the HTML to get just the content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newContent = tempDiv.querySelector('.content');
        
        console.log('Parsed new content:', newContent); // Debug log
        
        if (newContent) {
          // Replace only the container content
          containerDiv.innerHTML = newContent.outerHTML;
          
          console.log('Content replaced successfully'); // Debug log
          
          // Update content buttons and add event listeners
          updateContentButtons();
          
          // Switch to content navigation and focus on first button
          setTimeout(() => {
            const skillDetailButtons = document.querySelectorAll('.skill-wrapper button');
            if (skillDetailButtons.length > 0) {
              navigationLevel = 'content';
              currentContentIndex = 0;
              skillDetailButtons[currentContentIndex].focus();
              updateSubContent();
              console.log('Focused on first skill detail button'); // Debug log
            }
          }, 100); // Small delay to ensure DOM is updated
        }
      }
    } catch (error) {
      console.error('Error loading skill content:', error);
    }
  }

  // Function to add event listeners for skill navigation
  function addSkillNavigationListeners() {
    const skillButtons = document.querySelectorAll('button[data-skill-url]');
    
    // Add click listeners for skill detail buttons
    skillButtons.forEach((button, index) => {
      button.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent any default behavior
        e.stopPropagation(); // Stop event bubbling
        
        // Play click sound effect
        SoundManager.play('click');
        
        const skillUrl = this.getAttribute('data-skill-url');
        if (skillUrl) {
          console.log('Loading skill content:', skillUrl); // Debug log
          
          // Confirm menu selection for Skills button (since we're in skills page)
          const skillsMenuButton = Array.from(menuButtons).find(menuBtn => 
            menuBtn.getAttribute('data-url') === 'skills.html'
          );
          if (skillsMenuButton) {
            menuButtons.forEach(btn => btn.classList.remove('selected'));
            skillsMenuButton.classList.add('selected');
            currentMenuIndex = Array.from(menuButtons).indexOf(skillsMenuButton);
            lastConfirmedMenuIndex = currentMenuIndex;
            isMenuConfirmed = true; // Mark menu as confirmed
          }
          
          // Get button text for subtitle
          const buttonText = this.textContent.trim();
          
          // Store which button was pressed for ESC functionality
          lastSkillButtonPressed = {
            element: this,
            index: index,
            url: skillUrl
          };
          
          // Update page title with button text as subtitle
          updatePageTitle('skills.html', buttonText);
          
          loadSkillContent(skillUrl);
        }
      });
    });
  }

  // Function to update sub-content based on navigation level
  function updateSubContent() {
    if (navigationLevel === 'menu') {
      subContent.innerHTML = `
        <p>Menu Navigation</p>
        <p><kbd>A</kbd>, <kbd>D</kbd> Navigate & Preview <kbd>ENTER</kbd> or <kbd>S</kbd> Confirm</p>
      `;
    } else {
      subContent.innerHTML = `
        <p>Selection Options</p>
        <p><kbd>W</kbd>, <kbd>S</kbd> Select <kbd>ENTER</kbd> Confirm <kbd>ESC</kbd> Back</p>
      `;
    }
  }

  // Initialize content buttons
  updateContentButtons();

  // Add bullets to menu buttons on page load
  addBulletsToButtons(menuButtons);

  // Focus on first menu button when page loads
  if (menuButtons.length > 0) {
    menuButtons[currentMenuIndex].focus();
    updateSubContent();
  }

  // Ensure content buttons are clickable on initial load (index.html)
  // and whenever new content is injected. This complements calls after page loads.
  setTimeout(() => {
    try {
      initContentButtonClicks();
    } catch (err) {
      console.warn('initContentButtonClicks failed initially:', err);
    }
  }, 50);

  // Add hover sound effects to content buttons using event delegation
  document.addEventListener('mouseenter', function(e) {
    if (e.target.matches('.content button')) {
      SoundManager.play('hover');
    }
  }, true); // Use capture phase to catch events before they bubble

  // Function to check if user is currently in a form input
  function isInFormInput() {
    const activeElement = document.activeElement;
    if (!activeElement) return false;
    
    const formElements = ['INPUT', 'TEXTAREA', 'SELECT'];
    return formElements.includes(activeElement.tagName) || 
           activeElement.contentEditable === 'true';
  }

  document.addEventListener('keydown', function (e) {
    // Skip navigation if user is typing in form inputs
    if (isInFormInput()) {
      return; // Let the form handle the key event normally
    }
    
    if (navigationLevel === 'menu') {
      // Menu navigation mode
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        // Navigate menu buttons backward and load page preview
        const newIndex = (currentMenuIndex - 1 + menuButtons.length) % menuButtons.length;
        updateMenuFocus(newIndex, 'keyboard');
        
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        // Navigate menu buttons forward and load page preview
        const newIndex = (currentMenuIndex + 1) % menuButtons.length;
        updateMenuFocus(newIndex, 'keyboard');
        
      } else if (e.key === 'Enter' || e.key === 's' || e.key === 'S') {
        // Play click sound effect
        SoundManager.play('click');
        
        // Confirm menu selection and switch to content navigation
        const selectedButton = menuButtons[currentMenuIndex];
        lastConfirmedMenuIndex = currentMenuIndex; // Update confirmed index
        isMenuConfirmed = true; // Mark menu as confirmed
        
        // Add selected animation to confirm the selection
        menuButtons.forEach(button => button.classList.remove('selected'));
        selectedButton.classList.add('selected');
        
        // Clear keyboard active classes to prevent conflicts with selected state
        menuButtons.forEach(btn => {
          btn.classList.remove('keyboard-active');
        });
        
        // Ensure selected button maintains its state
        selectedButton.classList.add('selected'); // Re-apply in case it was removed
        
        // Switch to content navigation if content buttons exist
        setTimeout(() => {
          const currentContentButtons = getContentNavigationButtons();
          if (currentContentButtons.length > 0) {
            navigationLevel = 'content';
            currentContentIndex = 0;
            currentContentButtons[currentContentIndex].focus();
            updateSubContent();
          }
        }, 100); // Small delay to ensure content is loaded
      }
    } else if (navigationLevel === 'content') {
      // Content navigation mode
      const currentContentButtons = getContentNavigationButtons();
      
      if (currentContentButtons.length > 0) {
        if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
          // Play hover sound effect
          SoundManager.play('hover');
          // Navigate content buttons backward
          currentContentIndex = (currentContentIndex - 1 + currentContentButtons.length) % currentContentButtons.length;
          currentContentButtons[currentContentIndex].focus();
        } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
          // Play hover sound effect
          SoundManager.play('hover');
          // Navigate content buttons forward
          currentContentIndex = (currentContentIndex + 1) % currentContentButtons.length;
          currentContentButtons[currentContentIndex].focus();
        } else if (e.key === 'Enter') {
          // Play click sound effect
          SoundManager.play('click');
          // Confirm content button selection
           const selectedButton = currentContentButtons[currentContentIndex];
           const dataUrl = selectedButton.getAttribute('data-url');
           const skillUrl = selectedButton.getAttribute('data-skill-url');
           const projectUrl = selectedButton.getAttribute('data-project-url');
           
           // Handle skill navigation first
           if (skillUrl) {
             loadSkillContent(skillUrl);
             return; // Exit early to prevent other navigation logic
           }
           
           // Handle project navigation
           if (projectUrl) {
             handleProjectButtonClick({ 
               currentTarget: selectedButton,
               preventDefault: () => {},
               stopPropagation: () => {}
             });
             return; // Exit early to prevent other navigation logic
           }
           
           if (dataUrl) {
             // Check if this is an external link (not a page navigation)
             const isExternalLink = dataUrl.startsWith('mailto:') || 
                                   dataUrl.startsWith('http://') || 
                                   dataUrl.startsWith('https://');
             
             if (isExternalLink) {
               // Handle external link - don't treat as page navigation
               handleExternalLink(dataUrl);
               return; // Exit early to prevent page navigation logic
             }
             
             // Regular page navigation logic
             // Find and animate the corresponding menu button
             const correspondingMenuButton = Array.from(menuButtons).find(menuBtn => 
               menuBtn.getAttribute('data-url') === dataUrl
             );
             
             if (correspondingMenuButton) {
               // Remove selected class from all menu buttons first
               menuButtons.forEach(button => button.classList.remove('selected'));
               // Add selected animation to the corresponding menu button
               correspondingMenuButton.classList.add('selected');
               // Update currentMenuIndex to match the corresponding menu button
               currentMenuIndex = Array.from(menuButtons).indexOf(correspondingMenuButton);
               lastConfirmedMenuIndex = currentMenuIndex; // Update confirmed index when content button is used
               isMenuConfirmed = true; // Mark menu as confirmed
             }
             
             // Load external page
             loadPageContent(dataUrl);
             
             // Switch to content navigation and focus on first button after loading
             setTimeout(() => {
               const newContentButtons = getContentNavigationButtons();
               if (newContentButtons.length > 0) {
                 navigationLevel = 'content';
                 currentContentIndex = 0;
                 newContentButtons[currentContentIndex].focus();
                 updateSubContent();
               }
             }, 100); // Small delay to ensure content is loaded
             
           } else if (!skillUrl && !projectUrl) {
             // Only load home page if button has no navigation attributes at all
             menuButtons.forEach(button => button.classList.remove('selected'));
             loadHomePage();
           }
        }
      }
      
      if (e.key === 'Escape') {
        // Play back sound effect
        SoundManager.play('back');
        
        // Debug logging for ESC key
        console.log('ESC key pressed. Current state:');
        console.log('- navigationLevel:', navigationLevel);
        console.log('- isMenuConfirmed:', isMenuConfirmed);
        console.log('- isInProjectDetailPage():', isInProjectDetailPage());
        console.log('- isInSkillDetailPage():', isInSkillDetailPage());
        console.log('- lastProjectButtonPressed:', lastProjectButtonPressed);
        
        // Check if we're in a project detail page
        if (isInProjectDetailPage()) {
          // We're in a project detail page - go back to main projects.html and focus on the previously pressed button
          console.log('ESC from project detail page - returning to projects.html'); // Debug log
          
          // Load the projects.html page
          loadPageContent('projects.html').then(() => {
            // Reset subtitle when going back to main projects page
            updatePageTitle('projects.html');
            
            // After loading, focus on the previously pressed project button
            setTimeout(() => {
              if (lastProjectButtonPressed && lastProjectButtonPressed.element) {
                // Find the corresponding button in the newly loaded projects.html
                const projectCategoryButtons = document.querySelectorAll('button[data-project-url]');
                const targetButton = Array.from(projectCategoryButtons).find(btn => 
                  btn.getAttribute('data-project-url') === lastProjectButtonPressed.url
                );
                
                if (targetButton) {
                  navigationLevel = 'content';
                  const allContentButtons = getContentNavigationButtons();
                  currentContentIndex = Array.from(allContentButtons).indexOf(targetButton);
                  targetButton.focus();
                  updateSubContent();
                  console.log('Focused on previously pressed project button'); // Debug log
                }
              }
            }, 150); // Slightly longer delay to ensure DOM is updated
          });
        } else if (isInSkillDetailPage()) {
          // We're in a skill detail page - go back to skills.html and focus on the previously pressed button
          console.log('ESC from skill detail page - returning to skills.html'); // Debug log
          
          // Load the skills.html page
          loadPageContent('skills.html').then(() => {
            // Reset subtitle when going back to main skills page
            updatePageTitle('skills.html');
            
            // After loading, focus on the previously pressed button
            setTimeout(() => {
              if (lastSkillButtonPressed && lastSkillButtonPressed.element) {
                // Find the corresponding button in the newly loaded skills.html
                const skillNavButtons = document.querySelectorAll('button[data-skill-url]');
                const targetButton = Array.from(skillNavButtons).find(btn => 
                  btn.getAttribute('data-skill-url') === lastSkillButtonPressed.url
                );
                
                if (targetButton) {
                  navigationLevel = 'content';
                  const allContentButtons = getContentNavigationButtons();
                  currentContentIndex = Array.from(allContentButtons).indexOf(targetButton);
                  targetButton.focus();
                  updateSubContent();
                  console.log('Focused on previously pressed skill button'); // Debug log
                }
              }
            }, 150); // Slightly longer delay to ensure DOM is updated
          });
        } else if (navigationLevel === 'content' && isMenuConfirmed) {
          // We're in content navigation but not in detail pages - this might be the case after clicking project buttons
          console.log('ESC from content level - attempting to return to menu navigation');
          navigationLevel = 'menu';
          isMenuConfirmed = false; // Reset confirmation state to allow hover again
          
          // Clear ALL state classes from all menu buttons (return to normal state)
          menuButtons.forEach(button => {
            button.classList.remove('selected'); // Clear selected when returning to menu
            button.classList.remove('keyboard-active'); // Clear keyboard-active when returning to menu
          });
          
          // Focus on the current menu button (without selected animation)
          menuButtons[currentMenuIndex].focus();
          updateSubContent();
        } else {
          // We're in main page - normal ESC behavior (go back to menu navigation)
          console.log('ESC normal behavior - go back to menu navigation');
          navigationLevel = 'menu';
          isMenuConfirmed = false; // Reset confirmation state to allow hover again
          
          // Clear ALL state classes from all menu buttons (return to normal state)
          menuButtons.forEach(button => {
            button.classList.remove('selected'); // Clear selected when returning to menu
            button.classList.remove('keyboard-active'); // Clear keyboard-active when returning to menu
          });
          
          // Focus on the current menu button (without selected animation)
          menuButtons[currentMenuIndex].focus();
          updateSubContent();
        }
      }
    }
  });

  // Scale page functionality
  function scalePage() {
    const baseWidth = 2370;  // Chiều rộng gốc
    const baseHeight = 1100; // Chiều cao gốc
    const scaleX = window.innerWidth / baseWidth;
    const scaleY = window.innerHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY); // Giữ tỉ lệ chuẩn

    const wrapper = document.querySelector(".page-wrapper");
    if (wrapper) {
      wrapper.style.transform = `scale(${scale})`;
    }
  }

  window.addEventListener("resize", scalePage);
  scalePage();

  // Vertical Project Carousel Functionality
  function initProjectCarousel() {
    const slider = document.querySelector('.project-slider');
    const cards = document.querySelectorAll('.project-card');
    
    if (!slider || cards.length === 0) return;
    
    let currentIndex = 0;
    const cardHeight = 305; // card height (250px) + margin (20px)
    const maxIndex = Math.max(0, cards.length - 2); // Show 2 cards at a time
    
    function slideToIndex(index) {
      const translateY = -index * cardHeight;
      slider.style.transform = `translateY(${translateY}px)`;
    }
    
    function nextSlide() {
      currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
      slideToIndex(currentIndex);
    }
    
    function prevSlide() {
      currentIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
      slideToIndex(currentIndex);
    }
    
    // Auto-advance every 3 seconds
    let autoSlideInterval = setInterval(nextSlide, 3000);
    
    // Pause auto-advance when hovering over the carousel
    const container = document.querySelector('.project-slider-container');
    if (container) {
      container.addEventListener('mouseenter', () => {
        clearInterval(autoSlideInterval);
      });
      
      container.addEventListener('mouseleave', () => {
        autoSlideInterval = setInterval(nextSlide, 3000);
      });
    }
    
    // Initialize position
    slideToIndex(0);
  }
  
  // Initialize carousel when page loads or when projects page is loaded
  initProjectCarousel();
  
  // Re-initialize carousel after loading projects page
  const originalLoadPageContent = loadPageContent;
  loadPageContent = async function(url) {
    const result = await originalLoadPageContent(url);
    if (url.includes('projects')) {
      setTimeout(initProjectCarousel, 100); // Small delay to ensure DOM is ready
    }
    return result;
  };

  // Project Category Navigation Functionality
  async function loadProjectContent(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      
      // Find the container div in the main projects page
      const container = document.querySelector('.row-container .container');
      if (container) {
        // Create a temporary element to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Extract the new content section
        const newContent = tempDiv.querySelector('.content');
        if (newContent) {
          // Replace only the content inside the container
          container.innerHTML = '';
          container.appendChild(newContent);
          
          // Re-attach event listeners for the new buttons
          attachProjectButtonListeners();
          
          // Add bullets to the new project category buttons
          const newProjectButtons = newContent.querySelectorAll('button');
          addBulletsToButtons(newProjectButtons);
          
          // Attach project detail listeners for project list buttons
          setTimeout(() => {
            attachProjectDetailListeners();
            
            // Auto-focus first project button and load its detail
            const firstProjectButton = newContent.querySelector('button[data-project-detail]');
            if (firstProjectButton) {
              firstProjectButton.focus();
              const projectIndex = firstProjectButton.getAttribute('data-project-detail');
              if (projectIndex !== null) {
                loadProjectDetail(parseInt(projectIndex));
              }
            }
          }, 100);
        }
        
        // Also update the project-content area if it exists in the loaded content
        const projectContentElement = document.querySelector('.project-content');
        const newProjectContent = tempDiv.querySelector('.project-content');
        if (projectContentElement && newProjectContent) {
          projectContentElement.innerHTML = newProjectContent.innerHTML;
          
          // Re-initialize the carousel for the new content
          setTimeout(initProjectCarousel, 100);
        }
      }
    } catch (error) {
      console.error('Error loading project content:', error);
    }
  }

  function attachProjectButtonListeners() {
    // Get all buttons with data-project-url attribute
    const projectButtons = document.querySelectorAll('button[data-project-url]');
    
    projectButtons.forEach(button => {
      // Remove existing listeners to avoid duplicates
      button.removeEventListener('click', handleProjectButtonClick);
      button.addEventListener('click', handleProjectButtonClick);
      button.addEventListener('focus', handleProjectButtonClick);
    });
  }

  async function handleProjectButtonClick(event) {
    event.preventDefault(); // Prevent any default behavior
    event.stopPropagation(); // Stop event bubbling
    
    const url = event.currentTarget.getAttribute('data-project-url');
    if (url) {
      console.log('Loading project content:', url); // Debug log
      
      // Confirm menu selection for Projects button (since we're in projects page)
      const projectsMenuButton = Array.from(menuButtons).find(menuBtn => 
        menuBtn.getAttribute('data-url') === 'projects.html'
      );
      if (projectsMenuButton) {
        menuButtons.forEach(btn => btn.classList.remove('selected'));
        projectsMenuButton.classList.add('selected');
        currentMenuIndex = Array.from(menuButtons).indexOf(projectsMenuButton);
        lastConfirmedMenuIndex = currentMenuIndex;
        isMenuConfirmed = true; // Mark menu as confirmed
      }
      
      // Get button text for subtitle
      const buttonText = event.currentTarget.textContent.trim();
      
      // Store which project button was pressed for ESC functionality
      lastProjectButtonPressed = {
        element: event.currentTarget,
        url: url
      };
      
      // Remove active class from all project buttons
      document.querySelectorAll('button[data-project-url]').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Add active class to clicked button
      event.currentTarget.classList.add('active');
      
      // Update page title with button text as subtitle
      updatePageTitle('projects.html', buttonText);
      
      // Load the project content
      await loadProjectContent(url);
      
      // After loading project content, set navigation level to content
      setTimeout(() => {
        const projectDetailButtons = document.querySelectorAll('button[data-project-detail]');
        if (projectDetailButtons.length > 0) {
          navigationLevel = 'content';
          currentContentIndex = 0; // Focus on first project detail button
          updateSubContent();
          console.log('Set navigation level to content after project button click'); // Debug log
        }
      }, 150); // Delay to ensure DOM is updated
    }
  }

  // Initialize project navigation when page loads
  attachProjectButtonListeners();
  
  // Add bullets to initial project buttons
  const initialProjectButtons = document.querySelectorAll('button[data-project-url]');
  if (initialProjectButtons.length > 0) {
    addBulletsToButtons(initialProjectButtons);
  }

  // Project Detail Loading Functionality
  async function loadProjectDetail(projectIndex) {
    try {
      const response = await fetch('project-detail.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      
      // Parse HTML to get all project detail containers
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const projectContainers = tempDiv.querySelectorAll('.project-detail-container');
      
      if (projectContainers[projectIndex]) {
        // Get the target project content area
        const projectContentElement = document.querySelector('.project-content');
        if (projectContentElement) {
          // Clear existing content and add the specific project detail
          projectContentElement.innerHTML = projectContainers[projectIndex].outerHTML;
        }
      }
    } catch (error) {
      console.error('Error loading project detail:', error);
    }
  }

  function attachProjectDetailListeners() {
    // Get all buttons with data-project-detail attribute
    const projectDetailButtons = document.querySelectorAll('button[data-project-detail]');
    
    projectDetailButtons.forEach(button => {
      // Remove existing listeners to avoid duplicates
      button.removeEventListener('mouseenter', handleProjectDetailHover);
      button.removeEventListener('focus', handleProjectDetailHover);
      
      // Add new listeners
      button.addEventListener('mouseenter', handleProjectDetailHover);
      button.addEventListener('focus', handleProjectDetailHover);
    });
  }

  function handleProjectDetailHover(event) {
    const projectIndex = event.currentTarget.getAttribute('data-project-detail');
    if (projectIndex !== null) {
      loadProjectDetail(parseInt(projectIndex));
    }
  }

  // Initialize project detail listeners when page loads
  attachProjectDetailListeners();

  // Project Card Button Functionality
  function attachProjectCardListeners() {
    // Get all buttons inside project-card that have project detail data
    const projectCardButtons = document.querySelectorAll('.project-card button[data-project-detail]');
    
    projectCardButtons.forEach(button => {
      // Remove existing listeners to avoid duplicates
      button.removeEventListener('click', handleProjectCardClick);
      button.addEventListener('click', handleProjectCardClick);
    });
  }

  async function handleProjectCardClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const projectDetailIndex = event.currentTarget.getAttribute('data-project-detail');
    const projectCategory = event.currentTarget.getAttribute('data-project-category');
    const projectIndex = event.currentTarget.getAttribute('data-project-index');
    
    if (projectDetailIndex && projectCategory && projectIndex) {
      console.log(`Loading project category: ${projectCategory}, detail: ${projectDetailIndex}, index: ${projectIndex}`);
      
      // Step 1: Load the project category page
      try {
        const response = await fetch(projectCategory);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        
        // Find the container div in the main projects page
        const container = document.querySelector('.row-container .container');
        if (container) {
          // Create a temporary element to parse the HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          
          // Extract the new content section
          const newContent = tempDiv.querySelector('.content');
          if (newContent) {
            // Replace only the content inside the container
            container.innerHTML = '';
            container.appendChild(newContent);
            
            // Re-attach event listeners for the new buttons
            attachProjectButtonListeners();
            
            // Add bullets to the new project category buttons
            const newProjectButtons = newContent.querySelectorAll('button');
            addBulletsToButtons(newProjectButtons);
            
            // Attach project detail listeners for project list buttons
            setTimeout(() => {
              attachProjectDetailListeners();
              
              // Step 2: Focus on the specific project button and load its detail
              const projectButtons = newContent.querySelectorAll('button[data-project-detail]');
              const targetButton = projectButtons[parseInt(projectIndex)];
              
              if (targetButton) {
                // Focus on the target button
                targetButton.focus();
                
                // Load the corresponding project detail
                loadProjectDetail(parseInt(projectDetailIndex));
                
                console.log(`Focused on project button ${projectIndex} and loaded detail ${projectDetailIndex}`);
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error loading project category:', error);
      }
    }
  }

  // Initialize project card listeners
  attachProjectCardListeners();

  // Also initialize after loading projects page
  const originalLoadPageContent2 = loadPageContent;
  loadPageContent = async function(url) {
    const result = await originalLoadPageContent2(url);
    if (url.includes('projects')) {
      setTimeout(() => {
        initProjectCarousel();
        attachProjectCardListeners();
      }, 100);
    }
    return result;
  };

  // Function to trigger button entrance animations
  function triggerButtonAnimations() {
    // Get buttons to animate - exclude project-info buttons
    const buttons = document.querySelectorAll('.content button[type="button"]:not(.project-info button[type="button"])');
    
    // Reset all button animations first
    buttons.forEach(button => {
      button.style.animation = 'none';
      button.style.opacity = '0';
      button.style.transform = 'translateX(-100px)';
      button.style.maxWidth = '0';
      button.style.overflow = 'hidden';
    });
    
    // Force reflow to ensure reset takes effect
    document.body.offsetHeight;
    
    // Trigger animations with delays
    buttons.forEach((button, index) => {
      setTimeout(() => {
        button.style.animation = `slideInButton 0.4s ease-out forwards`;
        button.style.animationDelay = `${index * 0.1}s`;
      }, 50); // Small delay to ensure reset is complete
    });
    
    // Also trigger text scramble animations
    setTimeout(() => {
      triggerTextScrambleAnimations();
    }, 200); // Start text animations slightly after button slide
  }

  // Function to stop all active text scramble animations
  function stopAllScrambleAnimations() {
    activeScrambleIntervals.forEach(interval => {
      clearInterval(interval);
    });
    activeScrambleIntervals = []; // Clear the tracking array
  }

  // Text scramble animation functions
  function scrambleText(element, finalText, duration = 800) {
    // Use characters from the original text as character pool
    const originalText = finalText;
    const textLength = originalText.length;
    
    // Create character pool from the original text
    const uniqueChars = [...new Set(originalText.replace(/\s/g, ''))]; // Remove duplicates and spaces
    const charPool = uniqueChars.length > 0 ? uniqueChars : ['A', 'B', 'C', 'D', 'E']; // Fallback if no chars
    
    let iteration = 0;
    const maxIterations = Math.floor(duration / 30); // 30ms intervals for even faster reveal
    
    const interval = setInterval(() => {
      const progress = iteration / maxIterations;
      let scrambledText = '';
      
      for (let i = 0; i < textLength; i++) {
        const charProgress = Math.max(0, (progress * textLength * 1.5) - i) / textLength;
        
        if (charProgress >= 1) {
          // Character is finalized
          scrambledText += originalText[i];
        } else if (charProgress > 0.2) {
          // Character is being revealed with some scrambling from original text
          if (Math.random() < charProgress * 0.9) {
            scrambledText += originalText[i];
          } else {
            // Use character from the original text pool
            if (originalText[i] === ' ') {
              scrambledText += ' '; // Keep spaces
            } else {
              scrambledText += charPool[Math.floor(Math.random() * charPool.length)];
            }
          }
        } else {
          // Character hasn't started revealing yet - use chars from original text
          if (originalText[i] === ' ') {
            scrambledText += ' '; // Keep spaces
          } else {
            scrambledText += charPool[Math.floor(Math.random() * charPool.length)];
          }
        }
      }
      
      element.textContent = scrambledText;
      iteration++;
      
      if (iteration >= maxIterations) {
        clearInterval(interval);
        // Remove from tracking array
        const index = activeScrambleIntervals.indexOf(interval);
        if (index > -1) {
          activeScrambleIntervals.splice(index, 1);
        }
        element.textContent = originalText; // Ensure final text is correct
      }
    }, 30); // Even faster intervals
    
    // Add to tracking array
    activeScrambleIntervals.push(interval);
  }

  // Function to trigger text scramble animations
  function triggerTextScrambleAnimations() {
    // Stop all existing scramble animations first
    stopAllScrambleAnimations();
    
    // Animate h1 text - start immediately
    const h1Element = document.querySelector('#page-title span');
    if (h1Element) {
      const originalText = h1Element.textContent;
      scrambleText(h1Element, originalText, 600); // Much faster duration
    }
    
    // Animate h1 subtitle
    const subtitleElement = document.querySelector('#page-title small');
    if (subtitleElement && subtitleElement.style.display !== 'none') {
      const originalText = subtitleElement.textContent;
      setTimeout(() => {
        scrambleText(subtitleElement, originalText, 500); // Much faster duration
      }, 100); // Very short delay
    }
    
    // Animate button text in container .content
    const containerButtons = document.querySelectorAll('.container .content button[type="button"]:not(.project-info button)');
    containerButtons.forEach((button, index) => {
      const textNode = Array.from(button.childNodes).find(node => 
        node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
      );
      
      if (textNode) {
        const originalText = textNode.textContent;
        setTimeout(() => {
          scrambleText({ 
            get textContent() { return textNode.textContent; },
            set textContent(value) { textNode.textContent = value; }
          }, originalText, 400); // Much faster duration
        }, 150 + (index * 50)); // Much shorter stagger delay
      }
    });
  }

  // Add click and hover event listeners for menu buttons
  menuButtons.forEach((button, index) => {
    // Click event - same as pressing Enter
    button.addEventListener('click', function(e) {
      e.preventDefault();
      // Play click sound effect
      SoundManager.play('click');
      
      currentMenuIndex = index;
      lastConfirmedMenuIndex = index; // Update confirmed index
      isMenuConfirmed = true; // Mark menu as confirmed
      
      // Remove selected class from all buttons
      menuButtons.forEach(btn => btn.classList.remove('selected'));
      // Add selected class to clicked button
      button.classList.add('selected');
      
      // Load the page without animation (already animated on hover)
      const dataUrl = button.getAttribute('data-url');
      if (dataUrl) {
        loadPageContent(dataUrl, false); // false = no animation
        navigationLevel = 'content';
        
        // Focus on first content button after loading
        setTimeout(() => {
          const newContentButtons = getContentNavigationButtons();
          if (newContentButtons.length > 0) {
            currentContentIndex = 0;
            newContentButtons[currentContentIndex].focus();
            updateSubContent();
          }
        }, 100);
      }
    });
    
    // Hover event - preview the page and sync with keyboard navigation
    button.addEventListener('mouseenter', function(e) {
      // Play hover sound effect only if this is a different button (always play, regardless of navigation state)
      if (currentMenuIndex !== index) {
        SoundManager.play('hover');
      }
      
      // Don't interfere with menu-button states when in content navigation
      if (navigationLevel === 'content' && isMenuConfirmed) {
        return; // Preserve selected state during content navigation
      }
      
      const dataUrl = button.getAttribute('data-url');
      if (dataUrl) {
        // Clear keyboard-active from all buttons when mouse takes control (but preserve selected)
        menuButtons.forEach((btn, idx) => {
          // Don't remove keyboard-active from selected buttons
          if (!btn.classList.contains('selected')) {
            btn.classList.remove('keyboard-active');
          }
        });
        
        // Sync mouse hover with keyboard navigation (only if not in content level)
        updateMenuFocus(index, 'mouse');
        
        // Don't add selected class - let CSS hover handle the visual effect
      }
    });
    
    // Mouse leave event - remove keyboard focus when mouse leaves individual button
    button.addEventListener('mouseleave', function(e) {
      // Only blur if navigationLevel is still menu (not in content navigation)
      if (navigationLevel === 'menu') {
        // Don't blur selected buttons
        if (!button.classList.contains('selected')) {
          button.blur();
        }
        button.classList.remove('keyboard-focus'); // Remove keyboard focus class
        // Don't remove keyboard-active from selected buttons
        if (!button.classList.contains('selected')) {
          button.classList.remove('keyboard-active');
        }
        
        // Check if mouse is still over any menu button
        setTimeout(() => {
          const mouseOverButton = Array.from(menuButtons).some(btn => btn.matches(':hover'));
          if (!mouseOverButton) {
            // Mouse left all menu buttons - clear keyboard-active classes (but preserve selected)
            menuButtons.forEach(btn => {
              if (!btn.classList.contains('selected')) {
                btn.classList.remove('keyboard-active');
              }
            });
          }
        }, 10); // Small delay to allow :hover to update
      }
    });
  });

  // Add mouseleave for menu-bar to handle when mouse leaves menu area
  const menuBar = document.querySelector('.menu-bar');
  if (menuBar) {
    menuBar.addEventListener('mouseleave', function(e) {
      // When mouse leaves menu area, only restore selected state if there was a confirmed selection
      // Don't show selected animation just from hovering
      menuButtons.forEach(btn => btn.classList.remove('selected'));
      
      // Only show selected if it was actually confirmed (clicked, Enter, or content button interaction)
      if (navigationLevel === 'content' && menuButtons[lastConfirmedMenuIndex]) {
        menuButtons[lastConfirmedMenuIndex].classList.add('selected');
      }
    });
  }

  // Function to handle external link clicks
  function handleExternalLink(url) {
    if (url.startsWith('mailto:')) {
      // Handle email links
      window.location.href = url;
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      // Handle web links - open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Handle other protocols or malformed URLs
      console.warn('Unsupported URL format:', url);
    }
  }

  // Add contact page link functionality
  function initContactPageLinks() {
    // Handle contact buttons with external URLs only
    const contactButtons = document.querySelectorAll('.content button[data-url]');
    contactButtons.forEach(button => {
      const url = button.getAttribute('data-url');
      const isExternalLink = url && (url.startsWith('mailto:') || 
                                    url.startsWith('http://') || 
                                    url.startsWith('https://'));
      
      if (isExternalLink) {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation(); // Prevent event bubbling
          
          // Play click sound effect
          SoundManager.play('click');
          
          // Confirm menu selection for Contact button (since we're in contact page)
          const contactMenuButton = Array.from(menuButtons).find(menuBtn => 
            menuBtn.getAttribute('data-url') === 'contact.html'
          );
          if (contactMenuButton) {
            menuButtons.forEach(btn => btn.classList.remove('selected'));
            contactMenuButton.classList.add('selected');
            currentMenuIndex = Array.from(menuButtons).indexOf(contactMenuButton);
            lastConfirmedMenuIndex = currentMenuIndex;
            isMenuConfirmed = true; // Mark menu as confirmed
          }
          
          handleExternalLink(url);
        });
      }
    });

    // Handle QR blocks
    const qrBlocks = document.querySelectorAll('.qr-block[data-url]');
    qrBlocks.forEach(block => {
      // Add click cursor style
      block.style.cursor = 'pointer';
      
      block.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Play click sound effect
        SoundManager.play('click');
        
        // Confirm menu selection for Contact button (since we're in contact page)
        const contactMenuButton = Array.from(menuButtons).find(menuBtn => 
          menuBtn.getAttribute('data-url') === 'contact.html'
        );
        if (contactMenuButton) {
          menuButtons.forEach(btn => btn.classList.remove('selected'));
          contactMenuButton.classList.add('selected');
          currentMenuIndex = Array.from(menuButtons).indexOf(contactMenuButton);
          lastConfirmedMenuIndex = currentMenuIndex;
          isMenuConfirmed = true; // Mark menu as confirmed
        }
        
        const url = this.getAttribute('data-url');
        if (url) {
          handleExternalLink(url);
        }
      });
    });
    
    // Handle contact form submission (Easter Egg)
    initContactFormHandler();
  }

  // Add content button click functionality for index and projects pages
  function initContentButtonClicks() {
    // Handle index.html content buttons (navigation buttons)
    const indexContentButtons = document.querySelectorAll('.content button[data-url]:not([data-url^="mailto:"]):not([data-url^="http"])');
    indexContentButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Play click sound effect
        SoundManager.play('click');
        
        // Simulate Enter key press on this button
        const dataUrl = this.getAttribute('data-url');
        if (dataUrl) {
          // Find corresponding menu button and update states
          const correspondingMenuButton = Array.from(menuButtons).find(menuBtn => 
            menuBtn.getAttribute('data-url') === dataUrl
          );
          
          if (correspondingMenuButton) {
            // Confirm menu selection like Enter/s key press
            menuButtons.forEach(btn => btn.classList.remove('selected'));
            correspondingMenuButton.classList.add('selected');
            currentMenuIndex = Array.from(menuButtons).indexOf(correspondingMenuButton);
            lastConfirmedMenuIndex = currentMenuIndex;
            isMenuConfirmed = true; // Mark menu as confirmed
          }
          
          // Load page and switch to content navigation
          loadPageContent(dataUrl, false); // No animation on click
          
          setTimeout(() => {
            const newContentButtons = getContentNavigationButtons();
            if (newContentButtons.length > 0) {
              navigationLevel = 'content';
              currentContentIndex = 0;
              newContentButtons[currentContentIndex].focus();
              updateSubContent();
            }
          }, 100);
        }
      });
    });

    // Handle projects.html content buttons (project category buttons)
    const projectContentButtons = document.querySelectorAll('.content button[data-project-url]');
    projectContentButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Play click sound effect
        SoundManager.play('click');
        
        // Simulate the project button click logic
        handleProjectButtonClick({
          currentTarget: this,
          preventDefault: () => {},
          stopPropagation: () => {}
        });
      });
    });
  }

  // Contact form easter egg handler
  function initContactFormHandler() {
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
      contactForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent normal form submission
        
        console.log('Contact form submission intercepted - triggering easter egg');
        
        // Store form data for later submission
        const formData = new FormData(this);
        const formAction = this.getAttribute('action');
        
        // Store in sessionStorage for later use
        sessionStorage.setItem('pendingFormData', JSON.stringify({
          action: formAction,
          data: {
            name: formData.get('entry.1087925411'),
            email: formData.get('entry.1240165824'),
            message: formData.get('entry.645966833')
          }
        }));
        
        // Play self-destruct sound effect
        SoundManager.play('selfDestruct');
        
        // Load self-destruct page
        loadSelfDestructPage();
      });
    }
  }
  
  // Load self-destruct page for easter egg
  async function loadSelfDestructPage() {
    try {
      console.log('Loading self-destruct easter egg page');
      
      const response = await fetch('self-destruct.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      
      // Replace the entire page content with self-destruct
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const newMain = tempDiv.querySelector('main');
      
      if (newMain) {
        // Replace main content
        mainElement.innerHTML = newMain.innerHTML;
        
        // Initialize self-destruct countdown
        initSelfDestructCountdown();
      }
    } catch (error) {
      console.error('Error loading self-destruct page:', error);
      // Fallback: submit form normally
      submitStoredFormDataAndRedirect();
    }
  }
  
  // Initialize self-destruct countdown animation
  function initSelfDestructCountdown() {
    const countdownElement = document.querySelector('.countdown');
    if (!countdownElement) {
      console.error('Countdown element not found');
      return;
    }
    
    console.log('Starting self-destruct countdown');
    
    let timeLeft = 2.00; // 2 seconds
    const interval = 10; // Update every 10ms for smooth animation
    
    const countdownTimer = setInterval(() => {
      timeLeft -= interval / 1000; // Decrease by interval in seconds
      
      if (timeLeft <= 0) {
        timeLeft = 0;
        clearInterval(countdownTimer);
        
        // Countdown finished - submit form and redirect
        countdownElement.textContent = '0.00';
        console.log('Self-destruct countdown completed');
        
        setTimeout(() => {
          submitStoredFormDataAndRedirect();
        }, 500); // Small delay for dramatic effect
      } else {
        // Update countdown display
        countdownElement.textContent = timeLeft.toFixed(2);
      }
    }, interval);
  }
  
  // Submit stored form data and redirect to index
  function submitStoredFormDataAndRedirect() {
    const storedData = sessionStorage.getItem('pendingFormData');
    
    if (storedData) {
      try {
        const formInfo = JSON.parse(storedData);
        console.log('Submitting stored form data:', formInfo);
        
        // Create and submit form programmatically
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = formInfo.action;
        form.target = '_blank';
        
        // Add form fields
        const nameField = document.createElement('input');
        nameField.type = 'hidden';
        nameField.name = 'entry.1087925411';
        nameField.value = formInfo.data.name;
        form.appendChild(nameField);
        
        const emailField = document.createElement('input');
        emailField.type = 'hidden';
        emailField.name = 'entry.1240165824';
        emailField.value = formInfo.data.email;
        form.appendChild(emailField);
        
        const messageField = document.createElement('input');
        messageField.type = 'hidden';
        messageField.name = 'entry.645966833';
        messageField.value = formInfo.data.message;
        form.appendChild(messageField);
        
        // Submit form
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        
        // Clear stored data
        sessionStorage.removeItem('pendingFormData');
        
        console.log('Form submitted successfully');
      } catch (error) {
        console.error('Error submitting stored form data:', error);
      }
    }
    
    // Redirect to index page after a short delay
    setTimeout(() => {
      console.log('Redirecting to index page');
      window.location.href = 'index.html';
    }, 1000);
  }

  // Main application will be initialized after boot screen completes
  
});
//  im not even understand this file at all 