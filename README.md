# SilvaStream - Movie Streaming Platform

A modern, responsive movie streaming platform powered by the Gifted Tech API.  
```
silvastream/
├── index.html (enhanced)
├── movie-details.html (enhanced)
├── series-details.html (enhanced)
├── search.html (new)
├── category.html (new)
├── mylist.html (new)
├── profile.html (new)
├── sports.html
├── styles/
│   ├── main.css
│   ├── details.css
│   ├── search.css
│   ├── category.css
│   ├── sports.css
│   └── entertainment.css (new)
├── scripts/
│   ├── api.js (enhanced)
│   ├── app.js (enhanced)
│   ├── movie-details.js (enhanced)
│   ├── series-details.js (enhanced)
│   ├── search.js (new)
│   ├── category.js (new)
│   ├── mylist.js (new)
│   ├── profile.js (new)
│   ├── player.js (enhanced)
│   ├── sports.js
│   ├── user-profiles.js (new)
│   ├── entertainment.js (new)
│   └── pwa.js (new)
├── service-worker.js (enhanced)
├── manifest.json (enhanced)
└── icons/ (folder for PWA icons)
```
## Features

- 🎬 Modern, responsive design
- 🔍 Advanced movie search
- 📱 Mobile-friendly interface
- 🎥 Integrated video player
- 📥 Download functionality
- 🏠 Multiple movie categories
- ⚡ Fast loading times

## Installation

1. Clone this repository
2. Open `index.html` in a web browser
3. No server required - works directly in the browser

## File Structure
silvastream/
├── index.html # Main HTML file
├── styles/
│ └── main.css # All CSS styles
├── scripts/
│ ├── app.js # Main application logic
│ ├── api.js # API communication
│ └── player.js # Video player management
├── assets/
│ └── images/ # Static assets
└── README.md # This file

text

## API Integration

This platform uses the Gifted Tech Movie API:
- `searchMovies(query)` - Search for movies
- `getMovieInfo(movieId)` - Get movie details
- `getDownloadSources(movieId)` - Get streaming/download sources

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

© 2025 SilvaStream. Powered by Gifted Tech.
