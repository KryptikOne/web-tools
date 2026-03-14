# Web Tools Roadmap

A collection of utility tools, converters, and generators planned for development.

---

## Existing Tools (Implemented)

### CSS & Design

- [x] **Color Picker** - Advanced OKLCH-based color picker with multi-format conversion
- [x] **Color Palette Generator** - Generate color palettes with harmony rules
- [x] **Color Blindness Simulator** - Preview colors and images for different types of color vision deficiency
- [x] **CSS Gradient Generator** - Create CSS gradients visually with linear and radial options
- [x] **Box Shadow Generator** - Generate CSS box shadows
- [x] **Border Radius Generator** - Create custom border radius values
- [x] **Cubic Bezier Generator** - Interactive cubic bezier curve editor for CSS animations
- [x] **CSS Filter Generator** - Generate CSS filter effects like blur, brightness, contrast, and more
- [x] **Background Pattern Generator** - Create CSS background patterns with customizable colors and sizes
- [x] **SVG Pattern Generator** - Create repeating SVG patterns for backgrounds
- [x] **PX/REM Calculator** - Convert between pixels and rem units
- [x] **CSS Unit Converter** - Convert between CSS units (px, rem, em, vw, vh, etc.)

### Image & Media

- [x] **Image Resizer** - Resize images to specific dimensions with format conversion and quality control
- [x] **Image Format Converter** - Convert images between PNG, JPEG, and WebP formats in the browser
- [x] **Image Compressor** - Compress images to reduce file size with quality and format options
- [x] **Image Color Extractor** - Extract dominant colors from uploaded images with eyedropper and palette export
- [x] **Base64 Image Encoder** - Convert images to Base64 strings or decode Base64 to preview images
- [x] **Screenshot Beautifier** - Add beautiful backgrounds, padding, shadows, and rounded corners to screenshots
- [x] **SVG Optimizer** - Optimize and minify SVG files with configurable options
- [x] **Favicon Generator** - Upload an image and generate favicons in all standard sizes
- [x] **Icon Generator** - Generate simple icons with customizable shapes, colors, and text
- [x] **Dummy Image Generator** - Generate placeholder images with custom dimensions and colors
- [x] **QR Code Generator** - Generate QR codes from URLs, text, WiFi credentials, contacts, and more
- [x] **QR Code Reader** - Upload an image to scan and decode QR codes with auto-detected content types
- [x] **Barcode Generator** - Generate barcodes in Code128, EAN-13, UPC-A, and other formats
- [x] **Aspect Ratio Calculator** - Calculate aspect ratios and dimensions for video/images

### Text & Data

- [x] **Character Counter** - Count characters, words, sentences, paragraphs, and reading time
- [x] **Text Case Converter** - Convert text between uppercase, lowercase, camelCase, and more
- [x] **Invisible Character Remover** - Strip invisible and problematic Unicode characters
- [x] **Lorem Ipsum Generator** - Generate placeholder text in paragraphs, sentences, or words
- [x] **Markdown Preview** - Live markdown editor with real-time preview
- [x] **Diff Checker** - Compare two texts and highlight differences line by line
- [x] **HTML Tag Remover** - Remove HTML tags from text while preserving content
- [x] **HTML Escape/Unescape** - Escape and unescape HTML entities in text
- [x] **CSV to JSON** - Convert CSV data to JSON format with customizable options
- [x] **JSON to CSV** - Convert JSON arrays to CSV format with header detection
- [x] **JSON to YAML** - Convert JSON to YAML format and YAML to JSON

### Encoding & Data

- [x] **URL Encoder/Decoder** - Encode and decode URLs with percent-encoding
- [x] **Base64 Encoder/Decoder** - Encode and decode Base64 strings with UTF-8 support
- [x] **ASCII to Hex** - Convert ASCII text to hexadecimal and back
- [x] **Text/Binary Converter** - Convert text to binary and binary to text with encoding options
- [x] **Number Base Converter** - Convert between binary, octal, decimal, and hexadecimal
- [x] **Hash Generator** - Generate MD5, SHA-1, SHA-256, and SHA-512 hashes
- [x] **UUID Generator** - Generate UUIDs (v4) with bulk generation and formatting options
- [x] **Random Number Generator** - Generate random numbers with min/max, decimal, and distribution options

### Web Dev Tools

- [x] **JWT Decoder** - Decode and inspect JSON Web Tokens
- [x] **RegEx Tester** - Test and debug regular expressions with real-time matching
- [x] **Epoch Converter** - Convert Unix timestamps to dates
- [x] **Cron Expression Generator** - Build and explain cron schedules
- [x] **HTTP Status Code Reference** - Quick reference for HTTP status codes
- [x] **HTML Entities Reference** - Comprehensive HTML entities reference
- [x] **Meta Tag Generator** - Generate HTML meta tags for SEO and browser behavior
- [x] **OGP Tag Generator** - Generate Open Graph Protocol meta tags
- [x] **CSP Parser** - Parse and validate Content Security Policy headers
- [x] **.gitignore Generator** - Generate .gitignore files for various project types
- [x] **Package.json Generator** - Generate package.json files with customizable fields

### Unit Converters

- [x] **Distance / Length Converter** - Convert between miles, km, meters, feet, yards, inches, and more
- [x] **Weight / Mass Converter** - Convert between pounds, kg, ounces, grams, stones, and tons
- [x] **Temperature Converter** - Convert between Fahrenheit, Celsius, and Kelvin
- [x] **Area Converter** - Convert between square feet, square meters, acres, hectares, and more
- [x] **Volume Converter** - Convert between gallons, liters, cubic feet, and more
- [x] **Pressure Converter** - Convert between PSI, bar, atmospheres, pascals, mmHg, and more
- [x] **Energy Converter** - Convert between joules, calories, kilocalories, BTU, kWh, and more
- [x] **Speed / Velocity Converter** - Convert between mph, km/h, m/s, knots, Mach, and more
- [x] **Power Converter** - Convert between watts, kilowatts, horsepower, BTU/h, and more
- [x] **Frequency Converter** - Convert between Hz, kHz, MHz, GHz, RPM, and more
- [x] **Fuel Economy Converter** - Convert between MPG (US/UK), L/100km, km/L
- [x] **Angle Converter** - Convert between degrees, radians, gradians, turns, and arc units
- [x] **Kitchen Converter** - Convert cooking measurements with reference charts
- [x] **Clothing Size Converter** - Convert between US, UK, EU clothing and shoe sizes
- [x] **Data Storage Converter** - Convert between bytes, KB, MB, GB, TB with binary/decimal modes
- [x] **Bandwidth Calculator** - Convert bandwidth units and calculate download times
- [x] **File Size Calculator** - Calculate and convert file sizes with storage planning tools

### Calculators & Time

- [x] **Percentage Calculator** - Calculate percentages - find percentage, part, or whole from any two values
- [x] **Tip Calculator** - Calculate tips with presets, split bills between multiple people
- [x] **Timezone Converter** - Convert times between timezones with visual timeline
- [x] **Time Duration Calculator** - Convert time units, calculate date differences, add/subtract durations
- [x] **Dice Roller** - Roll virtual dice (D4, D6, D8, D10, D12, D20, D100)

---

## Backlog (Requires APIs or Deprioritized)

These tools are on hold — they either require external API integrations or overlap with existing developer tools.

### Requires External APIs

- [ ] **OGP Checker** - Check Open Graph meta tags on websites (requires server-side URL fetching)
- [ ] **IP Address Checker** - Check your IP address and location (requires geolocation API)
- [ ] **Currency Converter** - Convert between world currencies (requires live exchange rate API)

### Removed (Code Formatters)

Formatter tools were removed — better served by existing code editors and dedicated tools.

- ~~Code Formatter~~ - Format JS/TS/HTML/CSS code
- ~~Code Minifier~~ - Minify HTML, CSS, JavaScript
- ~~API Response Formatter~~ - Format and prettify API responses
- ~~SQL Formatter~~ - Format and beautify SQL queries
- ~~JSON Formatter~~ - Format and validate JSON data

---

## Future Enhancements

Planned improvements for existing tools:

### Text/Binary Converter

- [ ] File upload support (.txt files)
- [ ] File download (save as .txt or .bin)
- [ ] Custom delimiter input

---

## Contributing

Feel free to suggest new tools or improvements by opening an issue or pull request.

---

## Priority Legend

When implementing, consider:

- **High Priority:** Frequently needed, broad appeal
- **Medium Priority:** Useful but more niche
- **Low Priority:** Nice to have, specialized use cases
