# getIngresosBrutos (Playwright Version)

Automated tool to calculate "Ingresos Brutos" tax retentions from Banco Galicia Online Banking for the previous month.

## Features
- **Modern Stack**: Built with Node.js, TypeScript, and Playwright.
- **Automated Login**: Handles credentials securely via environment variables.
- **Configurable Account**: Target specific accounts via `ACCOUNT_NUMBER`.
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
Set your credentials as environment variables and run the script:

```bash
export DOCUMENTO=YOUR_DNI
export PASSWORD=YOUR_PASSWORD
export USER=YOUR_USERNAME 
export ACCOUNT_NUMBER="4017888-3" # Core number of the account to check

npm start
```

## Output
The script will output the list of detected retention transactions and a final summary:

```text
Summary for noviembre de 2025:
Total "Ing. Brutos s/ cred": $87.671,87

>>> TOTAL RETENTIONS (11/2025): $87671.87 <<<
```
