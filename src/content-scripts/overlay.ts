// src/content-scripts/overlay.ts

// Check if our overlay container already exists
if (!document.getElementById('web-activity-tracker-overlay')) {
  // Create container for our app
  const container = document.createElement('div');
  container.id = 'web-activity-tracker-overlay';
  document.body.appendChild(container);

  // Create and append style to handle dark mode
  const style = document.createElement('style');
  console.log("******* YO")
  style.textContent = `
    #web-activity-tracker-overlay {
      position: fixed;
      z-index: 10000;
      bottom: 0;
      right: 20px;
    }
  `;
  document.head.appendChild(style);
}