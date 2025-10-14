module.exports = {
     content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
     theme: {
       extend: {
         colors: {
           primary: 'var(--color-primary)',
           accent: '#06B6D4',
           success: '#10B981',
           warning: '#F59E0B',
         },
         backdropBlur: {
           xs: '2px',
         }
       },
     },
     plugins: [],
   }