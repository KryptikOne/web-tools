# Web Tools Roadmap

A collection of utility tools, converters, and generators planned for development.

---

## Existing Tools (Implemented)

### Color & Design

- [x] **Color Picker** - Advanced OKLCH-based color picker with multi-format conversion
- [x] **CSS Gradient Generator** - Create CSS gradients visually with linear and radial options
- [x] **Box Shadow Generator** - Generate CSS box shadows
- [x] **Border Radius Generator** - Create custom border radius values
- [x] **Cubic Bezier Generator** - Interactive cubic bezier curve editor for CSS animations
- [x] **Color Palette Generator** - Generate color palettes with harmony rules

### Image & Visual

- [x] **Dummy Image Generator** - Generate placeholder images with custom dimensions and colors

### Text & Data

- [x] **Invisible Character Remover** - Strip invisible and problematic Unicode characters
- [x] **HTML Entities Reference** - Comprehensive HTML entities reference
- [x] **Text/Binary Converter** - Convert text to binary and binary to text with encoding options

### Utility & Conversion

- [x] **Epoch Converter** - Convert Unix timestamps to dates
- [x] **PX/REM Calculator** - Convert between pixels and rem units
- [x] **Kitchen Converter** - Convert cooking measurements with reference charts
- [x] **Timezone Converter** - Convert times between timezones with visual timeline
- [x] **Percentage Calculator** - Calculate percentages - find percentage, part, or whole from any two values
- [x] **Tip Calculator** - Calculate tips with presets, split bills between multiple people
- [x] **Distance / Length Converter** - Convert between miles, km, meters, feet, yards, inches, and more
- [x] **Weight / Mass Converter** - Convert between pounds, kg, ounces, grams, stones, and tons
- [x] **Temperature Converter** - Convert between Fahrenheit, Celsius, and Kelvin
- [x] **Area Converter** - Convert between square feet, square meters, acres, hectares, and more
- [x] **Volume Converter** - Convert between gallons, liters, cubic feet, and more
- [x] **Aspect Ratio Calculator** - Calculate aspect ratios and dimensions for video/images
- [x] **Data Storage Converter** - Convert between bytes, KB, MB, GB, TB with binary/decimal modes
- [x] **Bandwidth Calculator** - Convert bandwidth units and calculate download times

### Fun & Random

- [x] **Dice Roller** - Roll virtual dice (D4, D6, D8, D10, D12, D20, D100)

---

## Planned Tools (Commented Out in Registry)

### Color & Design

- [ ] **CSS Filter Generator** - Generate CSS filter effects
- [ ] **Background Pattern Generator** - Create CSS background patterns
- [ ] **Color Blindness Simulator** - Preview designs for different types of color blindness
- [ ] **Color Palette from Image** - Extract color palettes from uploaded images
- [ ] **SVG Pattern Generator** - Create repeating SVG patterns for backgrounds
- [ ] **Icon Generator** - Generate simple icons and favicons

### Image & Visual

- [ ] **Image Resizer** - Resize images to specific dimensions
- [ ] **Image Format Converter** - Convert images between formats (PNG, JPG, WebP)
- [ ] **Image Compressor** - Compress images to reduce file size
- [ ] **Base64 Image Encoder** - Convert images to Base64 strings
- [ ] **QR Code Generator** - Generate QR codes from text or URLs
- [ ] **QR Code Reader** - Scan and decode QR codes
- [ ] **Favicon Generator** - Generate favicons from images
- [ ] **Screenshot Beautifier** - Add backgrounds and frames to screenshots
- [ ] **SVG Optimizer** - Optimize and minify SVG files
- [ ] **Image Color Extractor** - Extract dominant colors from images

### Code & Web Development

- [ ] **URL Encoder/Decoder** - Encode and decode URLs
- [ ] **JWT Decoder** - Decode and inspect JSON Web Tokens
- [ ] **CSP Parser** - Parse and validate Content Security Policy headers
- [ ] **OGP Tag Generator** - Generate Open Graph Protocol meta tags
- [ ] **OGP Checker** - Check Open Graph meta tags on websites
- [ ] **Code Formatter** - Format JS/TS/HTML/CSS code
- [ ] **Code Minifier** - Minify HTML, CSS, JavaScript
- [ ] **API Response Formatter** - Format and prettify API responses
- [ ] **HTTP Status Code Reference** - Quick reference for HTTP status codes
- [ ] **Meta Tag Generator** - Generate HTML meta tags
- [ ] **CSS Unit Converter** - Convert between CSS units
- [ ] **SQL Formatter** - Format and beautify SQL queries
- [ ] **Cron Expression Generator** - Build and explain cron schedules
- [ ] **.gitignore Generator** - Generate .gitignore files for various projects
- [ ] **Package.json Generator** - Generate package.json files

### Utility & Conversion

- [ ] **Number Base Converter** - Convert between number bases (binary, octal, decimal, hex)
- [ ] **IP Address Checker** - Check your IP address and location
- [ ] **File Size Calculator** - Calculate and convert file sizes

### Text & Data

- [ ] **Base64 Encoder/Decoder** - Encode and decode Base64 strings
- [ ] **Character Counter** - Count characters, words, and lines in text
- [ ] **CSV to JSON** - Convert CSV data to JSON format
- [ ] **ASCII to Hex** - Convert ASCII text to hexadecimal format
- [ ] **JSON Formatter** - Format and validate JSON data
- [ ] **JSON to CSV** - Convert JSON data to CSV format
- [ ] **JSON to YAML** - Convert JSON to YAML format
- [ ] **HTML Escape/Unescape** - Escape and unescape HTML entities
- [ ] **HTML Tag Remover** - Remove HTML tags from text
- [ ] **Text Case Converter** - Convert text between cases (upper, lower, title, etc.)
- [ ] **Barcode Generator** - Generate barcodes from text
- [ ] **Lorem Ipsum Generator** - Generate placeholder text
- [ ] **Markdown Preview** - Live markdown editor with preview
- [ ] **Diff Checker** - Compare two texts and highlight differences
- [ ] **RegEx Tester** - Test and debug regular expressions
- [ ] **Hash Generator** - Generate MD5, SHA-1, SHA-256 hashes

### Fun & Random

- [ ] **UUID Generator** - Generate UUIDs (v1, v4, etc.)
- [ ] **Random Number Generator** - Generate random numbers with constraints
- [ ] **Lorem Pixel** - Generate random placeholder images

---

## Planned Measurement Converters

### Everyday Use (Implemented)

- [x] **Distance / Length Converter** - miles, km, meters, feet, yards, inches, cm, mm, nautical miles
- [x] **Weight / Mass Converter** - lbs, kg, oz, grams, stones, metric tons, US tons
- [x] **Temperature Converter** - Fahrenheit, Celsius, Kelvin with reference charts
- [x] **Area Converter** - sq ft, sq m, sq yd, acres, hectares, sq km, sq miles
- [x] **Volume Converter** - gallons (US/UK), liters, cubic ft/m/in, fluid ounces

---

### Tech / Developer Focused (Implemented)

- [x] **Data Storage Converter** - bytes, KB, MB, GB, TB, PB with binary (1024) vs decimal (1000) toggle
- [x] **Bandwidth Calculator** - bps, Kbps, Mbps, Gbps, MB/s, GB/s with download time estimator

#### Screen / Resolution Tools

Screen and display calculations.

- **Features:**
    - DPI/PPI calculator
    - Aspect ratio converter (16:9, 4:3, 21:9, etc.)
    - Resolution scaler
    - Pixel density comparator

---

### Science / Engineering

#### Pressure Converter

Convert between pressure units.

- **Units:** PSI, bar, atmospheres (atm), pascals (Pa), kilopascals (kPa), mmHg, inHg
- **Features:** Tire pressure reference, weather/altitude context

#### Energy Converter

Convert between energy units.

- **Units:** joules (J), kilojoules (kJ), calories (cal), kilocalories (kcal/Cal), BTU, kilowatt-hours (kWh), electron volts (eV)
- **Features:** Food calorie context, electricity cost calculator

#### Speed / Velocity Converter

Convert between speed units.

- **Units:** mph, km/h, m/s, ft/s, knots, Mach
- **Features:** Wind speed scale (Beaufort), common speed references

#### Power Converter

Convert between power units.

- **Units:** watts (W), kilowatts (kW), horsepower (hp), BTU/hour
- **Features:** Appliance power consumption reference

#### Frequency Converter

Convert between frequency units.

- **Units:** hertz (Hz), kilohertz (kHz), megahertz (MHz), gigahertz (GHz), RPM
- **Features:** Audio frequency reference, radio band reference

---

### Practical / Niche

#### Fuel Economy Converter

Convert between fuel efficiency units.

- **Units:** MPG (US), MPG (UK), L/100km, km/L
- **Features:** Trip cost calculator, vehicle comparison tool

#### Clothing Size Converter

Convert between international clothing sizes.

- **Categories:**
    - Shoes (US, UK, EU, CM)
    - Shirts/Tops (US, UK, EU)
    - Pants/Bottoms (US, UK, EU)
    - Rings
- **Features:** Men's/Women's/Kids' modes, brand-specific variations

#### Currency Converter

Convert between world currencies.

- **Features:**
    - Live exchange rates (API integration)
    - Historical rates
    - Multi-currency comparison
    - Travel budget calculator

#### Angle Converter

Convert between angle units.

- **Units:** degrees, radians, gradians, turns, arc minutes, arc seconds
- **Features:** Trig function calculator, visual angle representation

#### Time Duration Calculator

Calculate time differences and durations.

- **Features:**
    - Days/hours/minutes/seconds breakdown
    - Working days calculator
    - Age calculator
    - Countdown/time-until calculator

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
