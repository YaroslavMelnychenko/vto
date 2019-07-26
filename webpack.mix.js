const mix = require('laravel-mix');

mix .js('src/js/example.js', 'dist/js')
    .sourceMaps();
    
mix .sass('src/sass/style.sass', 'dist/css');