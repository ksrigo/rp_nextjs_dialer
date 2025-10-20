// (function() {
//   "use strict";
  
//   // // Handle dropdown toggles
//   // document.querySelectorAll('.dropdown-menu a.dropdown-toggle').forEach(function(element) {
//   //   element.addEventListener('click', function(e) {
//   //     const nextEl = this.nextElementSibling;
//   //     if (nextEl && nextEl.classList.contains('dropdown-menu')) {
//   //       // Hide any other shown dropdowns
//   //       this.closest('.dropdown-menu').querySelectorAll('.show').forEach(function(el) {
//   //         if (el !== nextEl) {
//   //           el.classList.remove('show');
//   //         }
//   //       });
//   //       nextEl.classList.toggle('show');
//   //     }
//   //     e.preventDefault();
//   //   });
//   });

//   // // Initialize tooltips
//   // document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(function(element) {
//   //   new bootstrap.Tooltip(element);
//   // });

//   // // Initialize popovers
//   // document.querySelectorAll('[data-bs-toggle="popover"]').forEach(function(element) {
//   //   new bootstrap.Popover(element);
//   // });

//   // Replace the vanilla JS dark mode toggle with Next.js/React implementation
//   // Note: This should be moved to a React component file
//   // const [theme, setTheme] = useState('light');

//   // useEffect(() => {
//   //   document.body.setAttribute('data-bs-theme', theme);
//   // }, [theme]);

//   // const toggleTheme = () => {
//   //   setTheme(theme === 'dark' ? 'light' : 'dark');
//   // };

//   // The click handler should be added in your React component's JSX like:
//   // <button className="light-dark-mode" onClick={toggleTheme}>Toggle Theme</button>

// //   // Initialize Waves effect
// //   Waves.init();
// })();