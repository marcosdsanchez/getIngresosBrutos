# getIngresosBrutos (Playwright Version)

Automated tool to calculate "Ingresos Brutos" tax retentions from Banco Galicia Online Banking.

## Features
- **Modern Stack**: Built with Node.js, TypeScript, and Playwright.
- **Automated Login**: Handles credentials securely via environment variables.
- **Configurable Account**: Target specific accounts via `ING_BRUTOS_ACCOUNT_NUMBER`.
- **Optimization**: Automatically filters for "Egresos de dinero" to reduce noise.
- **Auto-Calculation**: Filters transactions by date (previous month) and description ("Ing. brutos s/ cred") to compute the total retention amount.
- **Privacy Focused**: No screenshots are taken or stored.

## Prerequisites
- Node.js (v18+)
- Banco Galicia Online Banking Credentials

## Installation
```bash
npm install
```

## Usage

1. Create a `.env` file in the root directory (based on `.env.example`):
```bash
cp .env.example .env
```

2. Edit `.env` with your credentials:
```ini
ING_BRUTOS_DOCUMENTO=YOUR_DNI
ING_BRUTOS_PASSWORD=YOUR_PASSWORD
ING_BRUTOS_USER=YOUR_USERNAME 
ING_BRUTOS_ACCOUNT_NUMBER="4017888-3" 
```

3. Run the script:
```bash
npm start
```

## Output
The script will output the list of detected retention transactions and a final summary:

```text
Summary for noviembre de 2025:
Total "Ing. Brutos s/ cred": $87.671,87

>>> TOTAL RETENTIONS (11/2025): $87671.87 <<<
```
